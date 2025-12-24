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
} from '../types';
import {
  buildCriticAssessPrompt,
  buildCriticQuestionsPrompt,
  buildCriticFinalPrompt,
} from '../prompts';
import { MODEL_CONFIG, PROMPT_VERSION } from '../config';

// Initialize OpenAI client
const openai = new OpenAI();

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

  const response = await openai.chat.completions.create({
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

  const response = await openai.chat.completions.create({
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

  const response = await openai.chat.completions.create({
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
