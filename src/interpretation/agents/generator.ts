/**
 * VS-32: Generator Agent (AI1)
 *
 * Creates and rewrites the report using 5-section OverviewSections structure.
 * Follows tonality instructions and pillar-specific patterns.
 * Uses OpenAI GPT-4o for best writing quality.
 *
 * Uses resilience layer for retry/circuit breaker protection.
 */

import {
  GeneratorInput,
  DraftReport,
  OverviewSections,
  InterpretedReport,
  CriticFinalOutput,
  StepLog,
  QuestionAnswer,
} from '../types';
import { PillarInterpretationConfig } from '../pillars/types';
import {
  buildGeneratorDraftPrompt,
  buildGeneratorRewritePrompt,
  buildGeneratorFinalizePrompt,
  RewriteInput,
  FinalizeInput,
} from '../prompts';
import { MODEL_CONFIG, PROMPT_VERSION } from '../config';
import { createChatCompletionWithRetry } from '../resilience';

/**
 * Create initial draft with 5-section structure and [NEED: x] markers.
 * VS-32: Now returns OverviewSections instead of legacy DraftReport.
 */
export async function createDraft(
  input: GeneratorInput,
  sessionId: string
): Promise<{ draft: OverviewSections; log: Partial<StepLog> }> {
  const prompt = buildGeneratorDraftPrompt(input);
  const startTime = Date.now();

  const response = await createChatCompletionWithRetry(
    {
      model: MODEL_CONFIG.generator.model,
      max_tokens: MODEL_CONFIG.generator.maxTokens,
      temperature: MODEL_CONFIG.generator.temperature,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    },
    'generator_draft'
  );

  const latencyMs = Date.now() - startTime;
  const rawResponse = response.choices[0]?.message?.content || '';

  // Parse as OverviewSections (VS-32 5-section structure)
  const draft = parseJsonResponse<OverviewSections>(rawResponse);

  // Ensure required arrays exist
  if (!draft.gaps_marked) {
    draft.gaps_marked = [];
  }
  if (!draft.evidence_ids_used) {
    draft.evidence_ids_used = [];
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
      tokens_input: response.usage?.prompt_tokens || 0,
      tokens_output: response.usage?.completion_tokens || 0,
      latency_ms: latencyMs,
      temperature: MODEL_CONFIG.generator.temperature,
    },
  };
}

/**
 * Rewrite draft with user answers, incorporating clarifier_ evidence IDs.
 * VS-32: Uses OverviewSections and tracks evidence chain.
 */
export async function rewriteWithAnswers(
  previousDraft: OverviewSections,
  answers: QuestionAnswer[],
  roundNumber: number,
  sessionId: string,
  pillarConfig?: PillarInterpretationConfig
): Promise<{ draft: OverviewSections; log: Partial<StepLog> }> {
  const input: RewriteInput = {
    previous_draft: previousDraft,
    answers,
    round_number: roundNumber,
    pillar_config: pillarConfig,
  };

  const prompt = buildGeneratorRewritePrompt(input);
  const startTime = Date.now();

  const response = await createChatCompletionWithRetry(
    {
      model: MODEL_CONFIG.generator.model,
      max_tokens: MODEL_CONFIG.generator.maxTokens,
      temperature: MODEL_CONFIG.generator.temperature,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    },
    'generator_rewrite'
  );

  const latencyMs = Date.now() - startTime;
  const rawResponse = response.choices[0]?.message?.content || '';

  const draft = parseJsonResponse<OverviewSections>(rawResponse);

  // Ensure arrays exist - gaps should be fewer after rewrite
  if (!draft.gaps_marked) {
    draft.gaps_marked = [];
  }
  if (!draft.evidence_ids_used) {
    draft.evidence_ids_used = [];
  }

  return {
    draft,
    log: {
      session_id: sessionId,
      step_type: 'generator_rewrite',
      round_number: roundNumber,
      agent: 'generator',
      prompt_version: PROMPT_VERSION,
      model: MODEL_CONFIG.generator.model,
      prompt_sent: prompt,
      raw_response: rawResponse,
      output: draft,
      previous_draft: convertToLegacyDraft(previousDraft),
      tokens_input: response.usage?.prompt_tokens || 0,
      tokens_output: response.usage?.completion_tokens || 0,
      latency_ms: latencyMs,
      temperature: MODEL_CONFIG.generator.temperature,
    },
  };
}

/**
 * Finalize draft with critic feedback.
 * VS-32: Produces InterpretedReport with optional overview field.
 */
export async function finalize(
  draft: OverviewSections,
  feedback: CriticFinalOutput,
  sessionId: string,
  pillarConfig?: PillarInterpretationConfig
): Promise<{ report: InterpretedReport; log: Partial<StepLog> }> {
  // If no edits needed, return as-is
  if (feedback.ready && feedback.edits.length === 0) {
    const report = convertToInterpretedReport(draft);
    return {
      report,
      log: {
        session_id: sessionId,
        step_type: 'generator_final',
        agent: 'generator',
        prompt_version: PROMPT_VERSION,
        model: MODEL_CONFIG.generator.model,
        prompt_sent: '[NO EDITS NEEDED - PASSTHROUGH]',
        raw_response: JSON.stringify(draft),
        output: report,
        tokens_input: 0,
        tokens_output: 0,
        latency_ms: 0,
      },
    };
  }

  const input: FinalizeInput = {
    draft,
    feedback,
    pillar_config: pillarConfig,
  };

  const prompt = buildGeneratorFinalizePrompt(input);
  const startTime = Date.now();

  const response = await createChatCompletionWithRetry(
    {
      model: MODEL_CONFIG.generator.model,
      max_tokens: MODEL_CONFIG.generator.maxTokens,
      temperature: MODEL_CONFIG.generator.temperature,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    },
    'generator_finalize'
  );

  const latencyMs = Date.now() - startTime;
  const rawResponse = response.choices[0]?.message?.content || '';

  const finalDraft = parseJsonResponse<OverviewSections>(rawResponse);
  const report = convertToInterpretedReport(finalDraft);

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
      previous_draft: convertToLegacyDraft(draft),
      tokens_input: response.usage?.prompt_tokens || 0,
      tokens_output: response.usage?.completion_tokens || 0,
      latency_ms: latencyMs,
      temperature: MODEL_CONFIG.generator.temperature,
    },
  };
}

/**
 * Convert OverviewSections to InterpretedReport for backwards compatibility.
 */
function convertToInterpretedReport(overview: OverviewSections): InterpretedReport {
  // Create legacy synthesis by combining exec summary and current state
  const synthesis = `${overview.executive_summary} ${overview.current_state}`;

  // Create key insight from critical risks or opportunities
  const keyInsight =
    overview.critical_risks && overview.critical_risks.length > 10
      ? overview.critical_risks
      : overview.opportunities;

  return {
    synthesis,
    priority_rationale: overview.priority_rationale,
    key_insight: keyInsight,
    // VS-32: Include the full overview structure
    overview,
    evidence_ids_used: overview.evidence_ids_used,
  };
}

/**
 * Convert OverviewSections to legacy DraftReport for logging.
 */
function convertToLegacyDraft(overview: OverviewSections): DraftReport {
  return {
    synthesis: `${overview.executive_summary} ${overview.current_state}`,
    priority_rationale: overview.priority_rationale,
    key_insight: overview.opportunities,
    gaps_marked: overview.gaps_marked,
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
