/**
 * VS-25: Generator Agent (AI1)
 *
 * Creates and rewrites the report.
 * Follows tonality instructions exactly.
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  GeneratorInput,
  RewriteInput,
  DraftReport,
  InterpretedReport,
  CriticFinalOutput,
  StepLog,
} from '../types';
import {
  buildGeneratorDraftPrompt,
  buildGeneratorRewritePrompt,
  buildGeneratorFinalizePrompt,
} from '../prompts';
import { MODEL_CONFIG, PROMPT_VERSION } from '../config';

// Initialize Anthropic client
const anthropic = new Anthropic();

/**
 * Create initial draft with [NEED: x] markers.
 */
export async function createDraft(
  input: GeneratorInput,
  sessionId: string
): Promise<{ draft: DraftReport; log: Partial<StepLog> }> {
  const prompt = buildGeneratorDraftPrompt(input);
  const startTime = Date.now();

  const response = await anthropic.messages.create({
    model: MODEL_CONFIG.generator.model,
    max_tokens: MODEL_CONFIG.generator.maxTokens,
    temperature: MODEL_CONFIG.generator.temperature,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const latencyMs = Date.now() - startTime;
  const rawResponse = response.content[0].type === 'text' ? response.content[0].text : '';

  // Parse JSON response
  const draft = parseJsonResponse<DraftReport>(rawResponse);

  // Ensure gaps_marked exists
  if (!draft.gaps_marked) {
    draft.gaps_marked = [];
  }

  return {
    draft,
    log: {
      session_id: sessionId,
      step_type: 'generator_draft',
      agent: 'generator',
      prompt_version: PROMPT_VERSION,
      model: MODEL_CONFIG.generator.model,
      prompt_sent: prompt,
      raw_response: rawResponse,
      output: draft,
      tokens_input: response.usage.input_tokens,
      tokens_output: response.usage.output_tokens,
      latency_ms: latencyMs,
      temperature: MODEL_CONFIG.generator.temperature,
    },
  };
}

/**
 * Rewrite draft with user answers.
 */
export async function rewriteWithAnswers(
  input: RewriteInput,
  sessionId: string,
  round: number
): Promise<{ draft: DraftReport; log: Partial<StepLog> }> {
  const prompt = buildGeneratorRewritePrompt(input);
  const startTime = Date.now();

  const response = await anthropic.messages.create({
    model: MODEL_CONFIG.generator.model,
    max_tokens: MODEL_CONFIG.generator.maxTokens,
    temperature: MODEL_CONFIG.generator.temperature,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const latencyMs = Date.now() - startTime;
  const rawResponse = response.content[0].type === 'text' ? response.content[0].text : '';

  const draft = parseJsonResponse<DraftReport>(rawResponse);

  // Ensure gaps_marked is empty after rewrite
  if (!draft.gaps_marked) {
    draft.gaps_marked = [];
  }

  return {
    draft,
    log: {
      session_id: sessionId,
      step_type: 'generator_rewrite',
      round_number: round,
      agent: 'generator',
      prompt_version: PROMPT_VERSION,
      model: MODEL_CONFIG.generator.model,
      prompt_sent: prompt,
      raw_response: rawResponse,
      output: draft,
      previous_draft: input.previous_draft,
      tokens_input: response.usage.input_tokens,
      tokens_output: response.usage.output_tokens,
      latency_ms: latencyMs,
      temperature: MODEL_CONFIG.generator.temperature,
    },
  };
}

/**
 * Finalize draft with critic feedback.
 */
export async function finalize(
  draft: DraftReport,
  feedback: CriticFinalOutput,
  sessionId: string
): Promise<{ report: InterpretedReport; log: Partial<StepLog> }> {
  // If no edits needed, return as-is
  if (feedback.ready && feedback.edits.length === 0) {
    return {
      report: {
        synthesis: draft.synthesis,
        priority_rationale: draft.priority_rationale,
        key_insight: draft.key_insight,
      },
      log: {
        session_id: sessionId,
        step_type: 'generator_final',
        agent: 'generator',
        prompt_version: PROMPT_VERSION,
        model: MODEL_CONFIG.generator.model,
        prompt_sent: '[NO EDITS NEEDED - PASSTHROUGH]',
        raw_response: JSON.stringify(draft),
        output: draft,
        tokens_input: 0,
        tokens_output: 0,
        latency_ms: 0,
      },
    };
  }

  const prompt = buildGeneratorFinalizePrompt(draft, feedback);
  const startTime = Date.now();

  const response = await anthropic.messages.create({
    model: MODEL_CONFIG.generator.model,
    max_tokens: MODEL_CONFIG.generator.maxTokens,
    temperature: MODEL_CONFIG.generator.temperature,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const latencyMs = Date.now() - startTime;
  const rawResponse = response.content[0].type === 'text' ? response.content[0].text : '';

  const report = parseJsonResponse<InterpretedReport>(rawResponse);

  return {
    report,
    log: {
      session_id: sessionId,
      step_type: 'generator_final',
      agent: 'generator',
      prompt_version: PROMPT_VERSION,
      model: MODEL_CONFIG.generator.model,
      prompt_sent: prompt,
      raw_response: rawResponse,
      output: report,
      previous_draft: draft,
      tokens_input: response.usage.input_tokens,
      tokens_output: response.usage.output_tokens,
      latency_ms: latencyMs,
      temperature: MODEL_CONFIG.generator.temperature,
    },
  };
}

/**
 * Parse JSON response from AI, handling common issues.
 */
function parseJsonResponse<T>(response: string): T {
  // Try to extract JSON from response
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
