/**
 * VS-25: Critic Agent (AI2)
 *
 * Quality assurance agent with 3 roles:
 * 1. Assess: Identify gaps in draft
 * 2. Questions: Generate clarifying questions
 * 3. Final: Give polish feedback
 *
 * Uses OpenAI GPT-4o-mini for fast, cost-effective assessment.
 */

import OpenAI from 'openai';
import {
  CriticAssessInput,
  CriticQuestionsInput,
  CriticFinalInput,
  CriticAssessOutput,
  CriticQuestionsOutput,
  CriticFinalOutput,
  StepLog,
  VS32cAIInterpretationInput,
  VS32cCriticAssessment,
  OverviewSection,
} from '../types';
import {
  buildCriticAssessPrompt,
  buildCriticQuestionsPrompt,
  buildCriticFinalPrompt,
} from '../prompts';
import { buildVS32cCriticPrompt } from '../prompts/critic-vs32c';
import { VS32cCriticAssessmentSchema } from '../schemas';
import { MODEL_CONFIG, PROMPT_VERSION, LOOP_CONFIG } from '../config';

// Lazy-initialize OpenAI client (avoids crash if key not set at startup)
let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI();
  }
  return _openai;
}

/**
 * Assess gaps in draft (Call 1).
 * Does NOT generate questions.
 */
export async function assessGaps(
  input: CriticAssessInput,
  sessionId: string,
  round: number
): Promise<{ output: CriticAssessOutput; log: Partial<StepLog> }> {
  const prompt = buildCriticAssessPrompt(input);
  const startTime = Date.now();

  const response = await getOpenAI().chat.completions.create({
    model: MODEL_CONFIG.critic.model,
    max_tokens: MODEL_CONFIG.critic.maxTokens,
    temperature: MODEL_CONFIG.critic.temperature,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const latencyMs = Date.now() - startTime;
  const rawResponse = response.choices[0]?.message?.content || '';

  const output = parseJsonResponse<CriticAssessOutput>(rawResponse);

  // Ensure gaps array exists
  if (!output.gaps) {
    output.gaps = [];
  }

  return {
    output,
    log: {
      session_id: sessionId,
      step_type: 'critic_assess',
      round_number: round,
      agent: 'critic',
      prompt_version: PROMPT_VERSION,
      model: MODEL_CONFIG.critic.model,
      prompt_sent: prompt,
      raw_response: rawResponse,
      output,
      tokens_input: response.usage?.prompt_tokens || 0,
      tokens_output: response.usage?.completion_tokens || 0,
      latency_ms: latencyMs,
      temperature: MODEL_CONFIG.critic.temperature,
    },
  };
}

/**
 * Generate questions for prioritized gaps (Call 2).
 */
export async function generateQuestions(
  input: CriticQuestionsInput,
  sessionId: string,
  round: number
): Promise<{ output: CriticQuestionsOutput; log: Partial<StepLog> }> {
  const prompt = buildCriticQuestionsPrompt(input);
  const startTime = Date.now();

  const response = await getOpenAI().chat.completions.create({
    model: MODEL_CONFIG.critic.model,
    max_tokens: MODEL_CONFIG.critic.maxTokens,
    temperature: MODEL_CONFIG.critic.temperature,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const latencyMs = Date.now() - startTime;
  const rawResponse = response.choices[0]?.message?.content || '';

  const output = parseJsonResponse<CriticQuestionsOutput>(rawResponse);

  // Ensure questions array exists
  if (!output.questions) {
    output.questions = [];
  }

  return {
    output,
    log: {
      session_id: sessionId,
      step_type: 'critic_questions',
      round_number: round,
      agent: 'critic',
      prompt_version: PROMPT_VERSION,
      model: MODEL_CONFIG.critic.model,
      prompt_sent: prompt,
      raw_response: rawResponse,
      output,
      tokens_input: response.usage?.prompt_tokens || 0,
      tokens_output: response.usage?.completion_tokens || 0,
      latency_ms: latencyMs,
      temperature: MODEL_CONFIG.critic.temperature,
    },
  };
}

/**
 * Give final polish feedback.
 */
export async function getFinalFeedback(
  input: CriticFinalInput,
  sessionId: string
): Promise<{ output: CriticFinalOutput; log: Partial<StepLog> }> {
  const prompt = buildCriticFinalPrompt(input);
  const startTime = Date.now();

  const response = await getOpenAI().chat.completions.create({
    model: MODEL_CONFIG.critic.model,
    max_tokens: MODEL_CONFIG.critic.maxTokens,
    temperature: MODEL_CONFIG.critic.temperature,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const latencyMs = Date.now() - startTime;
  const rawResponse = response.choices[0]?.message?.content || '';

  const output = parseJsonResponse<CriticFinalOutput>(rawResponse);

  // Ensure edits array exists
  if (!output.edits) {
    output.edits = [];
  }

  return {
    output,
    log: {
      session_id: sessionId,
      step_type: 'critic_final',
      agent: 'critic',
      prompt_version: PROMPT_VERSION,
      model: MODEL_CONFIG.critic.model,
      prompt_sent: prompt,
      raw_response: rawResponse,
      output,
      tokens_input: response.usage?.prompt_tokens || 0,
      tokens_output: response.usage?.completion_tokens || 0,
      latency_ms: latencyMs,
      temperature: MODEL_CONFIG.critic.temperature,
    },
  };
}

/**
 * Parse JSON response from AI, handling common issues.
 */
function parseJsonResponse<T>(response: string): T {
  let jsonStr = response.trim();

  // Remove markdown code blocks if present
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.slice(7);
  } else if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.slice(3);
  }
  if (jsonStr.endsWith('```')) {
    jsonStr = jsonStr.slice(0, -3);
  }

  jsonStr = jsonStr.trim();

  try {
    return JSON.parse(jsonStr) as T;
  } catch (error) {
    // Try to find JSON object in response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as T;
    }
    throw new Error(`Failed to parse JSON response: ${response.substring(0, 200)}`);
  }
}

// ============================================================================
// VS-32c: Critic with AI-Generated Questions
// ============================================================================

/**
 * VS-32c: Assess draft against golden patterns and generate clarifying questions.
 *
 * This function:
 * 1. Compares draft to golden output patterns
 * 2. Identifies gaps (structural, quality, context)
 * 3. Generates targeted Yes/No questions for context gaps
 * 4. Provides rewrite instructions for quality/structural gaps
 *
 * @param input - The interpretation input with diagnostic answers
 * @param draft - Current draft overview sections
 * @param sessionId - The interpretation session ID
 * @param round - Current loop round number
 * @param totalQuestionsAsked - Questions already asked this session (for circuit breaker)
 */
export async function assessDraft(
  input: VS32cAIInterpretationInput,
  draft: OverviewSection[],
  sessionId: string,
  round: number,
  totalQuestionsAsked: number = 0
): Promise<{
  assessment: VS32cCriticAssessment;
  tokensUsed: number;
  log: Partial<StepLog>;
}> {
  const prompt = buildVS32cCriticPrompt(input, draft);
  const startTime = Date.now();

  const response = await getOpenAI().chat.completions.create({
    model: MODEL_CONFIG.critic.model,
    max_tokens: MODEL_CONFIG.critic.maxTokens,
    temperature: MODEL_CONFIG.critic.temperature,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const latencyMs = Date.now() - startTime;
  const rawResponse = response.choices[0]?.message?.content || '';
  const tokensUsed =
    (response.usage?.prompt_tokens || 0) + (response.usage?.completion_tokens || 0);

  // Parse JSON response
  const parsed = parseJsonResponse<VS32cCriticAssessment>(rawResponse);

  // Validate with Zod schema
  const validationResult = VS32cCriticAssessmentSchema.safeParse(parsed);

  let assessment: VS32cCriticAssessment;

  if (!validationResult.success) {
    console.warn('[VS-32c Critic] Validation failed, using fallback:', validationResult.error);
    // Fallback: use parsed data with defaults
    assessment = {
      gaps: parsed.gaps || [],
      overall_quality: parsed.overall_quality || 'yellow',
      rewrite_instructions: parsed.rewrite_instructions || [],
      generated_questions: parsed.generated_questions || [],
    };
  } else {
    assessment = validationResult.data;
  }

  // Apply circuit breakers
  const remainingQuestions = LOOP_CONFIG.maxQuestionsTotal - totalQuestionsAsked;
  const maxQuestionsThisRound = Math.min(3, remainingQuestions);

  if (assessment.generated_questions.length > maxQuestionsThisRound) {
    console.log(
      `[VS-32c Critic] Trimming questions from ${assessment.generated_questions.length} to ${maxQuestionsThisRound}`
    );
    assessment.generated_questions = assessment.generated_questions.slice(0, maxQuestionsThisRound);
  }

  // If we've hit max rounds, don't ask more questions
  if (round >= LOOP_CONFIG.maxRounds) {
    console.log('[VS-32c Critic] Max rounds reached, clearing questions');
    assessment.generated_questions = [];
  }

  return {
    assessment,
    tokensUsed,
    log: {
      session_id: sessionId,
      step_type: 'critic_assess',
      round_number: round,
      agent: 'critic',
      prompt_version: PROMPT_VERSION,
      model: MODEL_CONFIG.critic.model,
      prompt_sent: prompt,
      raw_response: rawResponse,
      output: assessment,
      tokens_input: response.usage?.prompt_tokens || 0,
      tokens_output: response.usage?.completion_tokens || 0,
      latency_ms: latencyMs,
      temperature: MODEL_CONFIG.critic.temperature,
    },
  };
}
