/**
 * VS-32: Critic Agent (AI2)
 *
 * Quality assurance agent with 3 roles:
 * 1. Assess: Identify gaps in draft using golden output patterns
 * 2. Questions: Generate clarifying questions (70% Yes/No preferred)
 * 3. Final: Validate against pillar config before publication
 *
 * Uses OpenAI GPT-4o-mini for fast, cost-effective assessment.
 */

import {
  CriticAssessInput,
  CriticQuestionsInput,
  CriticAssessOutput,
  CriticQuestionsOutput,
  CriticFinalOutput,
  StepLog,
  OverviewSections,
  DiagnosticData,
  PrioritizedGap,
  InterpretationQuestion,
} from '../types';
import { PillarInterpretationConfig } from '../pillars/types';
import {
  buildCriticAssessPrompt,
  buildCriticQuestionsPrompt,
  buildCriticFinalPrompt,
  CriticFinalInput,
} from '../prompts';
import { MODEL_CONFIG, PROMPT_VERSION } from '../config';
import { createChatCompletionWithRetry } from '../resilience';

/**
 * VS-32 Extended assess output with evidence coverage tracking.
 */
interface ExtendedAssessOutput extends CriticAssessOutput {
  forbidden_violations?: Array<{
    pattern: string;
    location: string;
    suggestion: string;
  }>;
  evidence_coverage?: Record<
    string,
    {
      count: number;
      types: string[];
    }
  >;
}

/**
 * Assess gaps in draft using golden output patterns (Call 1).
 * VS-32: Validates against pillar config and tracks evidence coverage.
 */
export async function assessGaps(
  draft: OverviewSections,
  context: DiagnosticData,
  sessionId: string,
  round: number,
  pillarConfig?: PillarInterpretationConfig
): Promise<{ output: ExtendedAssessOutput; log: Partial<StepLog> }> {
  const input: CriticAssessInput = {
    draft: {
      synthesis: `${draft.executive_summary} ${draft.current_state}`,
      priority_rationale: draft.priority_rationale,
      key_insight: draft.opportunities,
      gaps_marked: draft.gaps_marked,
    },
    context,
    pillar_config: pillarConfig,
    round_number: round,
  };

  const prompt = buildCriticAssessPrompt(input);
  const startTime = Date.now();

  const response = await createChatCompletionWithRetry(
    {
      model: MODEL_CONFIG.critic.model,
      max_tokens: MODEL_CONFIG.critic.maxTokens,
      temperature: MODEL_CONFIG.critic.temperature,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    },
    'critic_assess'
  );

  const latencyMs = Date.now() - startTime;
  const rawResponse = response.choices[0]?.message?.content || '';

  const output = parseJsonResponse<ExtendedAssessOutput>(rawResponse);

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
 * VS-32: Enforces 70% Yes/No question preference.
 */
export async function generateQuestions(
  prioritizedGaps: PrioritizedGap[],
  sessionId: string,
  round: number,
  pillarConfig?: PillarInterpretationConfig,
  previousQuestions?: InterpretationQuestion[],
  questionsBudget?: number
): Promise<{ output: CriticQuestionsOutput; log: Partial<StepLog> }> {
  const input: CriticQuestionsInput = {
    prioritized_gaps: prioritizedGaps,
    pillar_config: pillarConfig,
    questions_asked_so_far: previousQuestions,
    questions_budget: questionsBudget,
  };

  const prompt = buildCriticQuestionsPrompt(input);
  const startTime = Date.now();

  const response = await createChatCompletionWithRetry(
    {
      model: MODEL_CONFIG.critic.model,
      max_tokens: MODEL_CONFIG.critic.maxTokens,
      temperature: MODEL_CONFIG.critic.temperature,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    },
    'critic_questions'
  );

  const latencyMs = Date.now() - startTime;
  const rawResponse = response.choices[0]?.message?.content || '';

  const output = parseJsonResponse<CriticQuestionsOutput>(rawResponse);

  // Ensure questions array exists
  if (!output.questions) {
    output.questions = [];
  }

  // VS-32: Validate 70% Yes/No rule and log warning if not met
  const yesNoCount = output.questions.filter((q) => q.type === 'yes_no').length;
  const yesNoPercentage =
    output.questions.length > 0
      ? (yesNoCount / output.questions.length) * 100
      : 100;

  if (yesNoPercentage < 70 && output.questions.length > 0) {
    console.warn(
      `[VS-32] Warning: Only ${yesNoPercentage.toFixed(0)}% Yes/No questions (expected 70%+)`
    );
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
 * VS-32 Extended final output with evidence audit.
 */
interface ExtendedFinalOutput extends CriticFinalOutput {
  evidence_audit?: {
    total_evidence_ids: number;
    missing_required_types: string[];
    sections_below_minimum: string[];
  };
  forbidden_matches?: string[];
}

/**
 * Give final validation feedback.
 * VS-32: Validates against pillar config forbidden patterns.
 */
export async function getFinalFeedback(
  draft: OverviewSections,
  sessionId: string,
  pillarConfig?: PillarInterpretationConfig
): Promise<{ output: ExtendedFinalOutput; log: Partial<StepLog> }> {
  const input: CriticFinalInput = {
    draft,
    pillar_config: pillarConfig,
  };

  const prompt = buildCriticFinalPrompt(input);
  const startTime = Date.now();

  const response = await createChatCompletionWithRetry(
    {
      model: MODEL_CONFIG.critic.model,
      max_tokens: MODEL_CONFIG.critic.maxTokens,
      temperature: MODEL_CONFIG.critic.temperature,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    },
    'critic_final'
  );

  const latencyMs = Date.now() - startTime;
  const rawResponse = response.choices[0]?.message?.content || '';

  const output = parseJsonResponse<ExtendedFinalOutput>(rawResponse);

  // Ensure edits array exists
  if (!output.edits) {
    output.edits = [];
  }

  // VS-32: Log any forbidden pattern matches
  if (output.forbidden_matches && output.forbidden_matches.length > 0) {
    console.warn(
      `[VS-32] Forbidden patterns found: ${output.forbidden_matches.join(', ')}`
    );
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
