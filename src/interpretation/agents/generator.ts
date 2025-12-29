/**
 * VS-25: Generator Agent (AI1)
 * VS-32a: Single-call Overview Generator
 *
 * Creates and rewrites the report.
 * Follows tonality instructions exactly.
 * Uses OpenAI GPT-4o for best writing quality.
 */

import OpenAI from 'openai';
import {
  GeneratorInput,
  RewriteInput,
  DraftReport,
  InterpretedReport,
  CriticFinalOutput,
  StepLog,
  AIInterpretationInput,
  OverviewSection,
  GeneratorOverviewResult,
  VS32bHeuristicResult,
  VS32cAIInterpretationInput,
} from '../types';
import {
  buildGeneratorDraftPrompt,
  buildGeneratorRewritePrompt,
  buildGeneratorFinalizePrompt,
} from '../prompts';
import { buildGeneratorPrompt, buildRetryPrompt } from '../prompts/generator';
import { buildVS32cRewritePrompt } from '../prompts/critic-vs32c';
import { GeneratorResponseSchema } from '../schemas';
import { validateAllEvidence } from '../evidence';
import { runHeuristics } from '../validation/heuristics';
import { MODEL_CONFIG, PROMPT_VERSION } from '../config';
import { callOpenAIWithRetry } from '../openai-client';

// VS-32b: Maximum retry attempts
const MAX_GENERATION_ATTEMPTS = 2;

// Lazy-initialize OpenAI client (avoids crash if key not set at startup)
let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI();
  }
  return _openai;
}

/**
 * Create initial draft with [NEED: x] markers.
 */
export async function createDraft(
  input: GeneratorInput,
  sessionId: string
): Promise<{ draft: DraftReport; log: Partial<StepLog> }> {
  const prompt = buildGeneratorDraftPrompt(input);
  const startTime = Date.now();

  const response = await getOpenAI().chat.completions.create({
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
  const rawResponse = response.choices[0]?.message?.content || '';

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
      tokens_input: response.usage?.prompt_tokens || 0,
      tokens_output: response.usage?.completion_tokens || 0,
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

  const response = await getOpenAI().chat.completions.create({
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
  const rawResponse = response.choices[0]?.message?.content || '';

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
      tokens_input: response.usage?.prompt_tokens || 0,
      tokens_output: response.usage?.completion_tokens || 0,
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

  const response = await getOpenAI().chat.completions.create({
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
  const rawResponse = response.choices[0]?.message?.content || '';

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
      tokens_input: response.usage?.prompt_tokens || 0,
      tokens_output: response.usage?.completion_tokens || 0,
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

// ============================================================
// VS-32a: Single-Call Overview Generator
// VS-32b: With Quality Heuristics and Retry Logic
// ============================================================

/**
 * Generate overview sections in a single GPT-4o call.
 * Returns 5 validated sections with evidence IDs.
 *
 * VS-32b: Includes heuristic validation with one retry on failure.
 */
export async function generateOverview(
  input: AIInterpretationInput
): Promise<GeneratorOverviewResult> {
  let lastSections: OverviewSection[] | null = null;
  let lastHeuristics: VS32bHeuristicResult | null = null;
  let totalTokens = 0;

  for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt++) {
    // Build prompt - include violations if retrying
    const prompt =
      attempt === 1
        ? buildGeneratorPrompt(input)
        : buildRetryPrompt(input, lastHeuristics!.violations);

    // Lower temperature on retry for more consistent output
    const temperature = attempt === 1 ? 0.7 : 0.5;

    const response = await callOpenAIWithRetry(async () => {
      return getOpenAI().chat.completions.create({
        model: 'gpt-4o',
        temperature,
        max_tokens: 2000,
        messages: [
          {
            role: 'system',
            content:
              'You are a senior finance transformation consultant. Output valid JSON only.',
          },
          { role: 'user', content: prompt },
        ],
      });
    });

    totalTokens += response.usage?.total_tokens || 0;

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    // Parse JSON (handle markdown code blocks)
    let parsed: unknown;
    try {
      const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      // Try to find JSON object in response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error(`Failed to parse Generator response as JSON: ${e}`);
      }
    }

    // Validate with Zod
    const validated = GeneratorResponseSchema.parse(parsed);

    // VS-32b: Run heuristics on generated sections
    lastSections = validated.sections as OverviewSection[];
    lastHeuristics = runHeuristics(lastSections, input);

    // If heuristics pass, return immediately
    if (lastHeuristics.passed) {
      console.log(`VS-32b: Heuristics passed on attempt ${attempt}`);
      return {
        sections: lastSections,
        tokensUsed: totalTokens,
        heuristics: lastHeuristics,
        attempts: attempt,
      };
    }

    // Log failures for retry
    console.log(
      `VS-32b: Heuristics failed (attempt ${attempt}/${MAX_GENERATION_ATTEMPTS}):`,
      lastHeuristics.violations.filter((v) => v.severity === 'red')
    );
  }

  // Return last attempt even if it has warnings
  console.log(
    `VS-32b: Returning with ${lastHeuristics!.red_count} red, ${lastHeuristics!.yellow_count} yellow warnings after ${MAX_GENERATION_ATTEMPTS} attempts`
  );

  return {
    sections: lastSections!,
    tokensUsed: totalTokens,
    heuristics: lastHeuristics!,
    attempts: MAX_GENERATION_ATTEMPTS,
  };
}

// ============================================================
// VS-32c: Rewrite with Clarifier Answers
// ============================================================

/**
 * VS-32c: Rewrite overview sections incorporating clarifier answers.
 *
 * This function:
 * 1. Takes the previous draft and rewrite instructions from Critic
 * 2. Incorporates user answers to clarifying questions
 * 3. Produces improved overview sections
 *
 * @param input - Full interpretation input with clarifier_answers populated
 * @param previousDraft - The previous draft overview sections
 * @param rewriteInstructions - Specific rewrite instructions from Critic
 * @param sessionId - The interpretation session ID
 * @param round - Current loop round number
 */
export async function rewriteOverview(
  input: VS32cAIInterpretationInput,
  previousDraft: OverviewSection[],
  rewriteInstructions: string[],
  sessionId: string,
  round: number
): Promise<{
  sections: OverviewSection[];
  tokensUsed: number;
  log: Partial<StepLog>;
}> {
  // Build base prompt (same as initial generation)
  const basePrompt = buildGeneratorPrompt(input);

  // Build rewrite prompt with clarifier context
  const prompt = buildVS32cRewritePrompt(input, previousDraft, rewriteInstructions, basePrompt);

  const startTime = Date.now();

  const response = await callOpenAIWithRetry(async () => {
    return getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.6, // Slightly lower for more consistent rewrites
      max_tokens: 2000,
      messages: [
        {
          role: 'system',
          content: 'You are a senior finance transformation consultant. Output valid JSON only.',
        },
        { role: 'user', content: prompt },
      ],
    });
  });

  const latencyMs = Date.now() - startTime;
  const content = response.choices[0]?.message?.content;
  const tokensUsed = response.usage?.total_tokens || 0;

  if (!content) {
    throw new Error('Empty response from OpenAI during rewrite');
  }

  // Parse JSON (handle markdown code blocks)
  let parsed: unknown;
  try {
    const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    // Try to find JSON object in response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error(`Failed to parse Rewrite response as JSON: ${e}`);
    }
  }

  // Validate with Zod
  const validated = GeneratorResponseSchema.parse(parsed);
  const sections = validated.sections as OverviewSection[];

  console.log(`VS-32c: Rewrite complete, incorporated ${input.clarifier_answers?.length || 0} answers`);

  return {
    sections,
    tokensUsed,
    log: {
      session_id: sessionId,
      step_type: 'generator_rewrite',
      round_number: round,
      agent: 'generator',
      prompt_version: PROMPT_VERSION,
      model: 'gpt-4o',
      prompt_sent: prompt,
      raw_response: content,
      output: { sections },
      previous_draft: previousDraft,
      tokens_input: response.usage?.prompt_tokens || 0,
      tokens_output: response.usage?.completion_tokens || 0,
      latency_ms: latencyMs,
      temperature: 0.6,
    },
  };
}
