/**
 * VS-32: Orchestrator - Single AI call with retry and fallback
 *
 * Flow: Precompute → Generate → Heuristics → (Retry) → Fallback
 */

import { createClient } from '@supabase/supabase-js';
import { InterpretationInput, OverviewSection, HeuristicResult } from './types';
import { PillarPack } from '../pillars/registry';
import { precompute, computeInputHash } from './precompute';
import { generateInterpretation } from './generator';
import { runHeuristics } from './heuristics';
import { generateFallback } from './fallback';
import { getPillarPack } from '../pillars/registry';

const MAX_ATTEMPTS = 2;

// Supabase service client for background operations (bypasses RLS)
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface OrchestrationResult {
  sections: OverviewSection[];
  input_hash: string;
  used_fallback: boolean;
  fallback_reason: string | null;
  heuristics: HeuristicResult;
  attempts: number;
  tokens: number;
}

export async function orchestrate(runId: string): Promise<OrchestrationResult> {
  let input: InterpretationInput;
  let input_hash: string;
  let pack: PillarPack;

  // Phase 1: Precompute (critical barrier)
  try {
    input = await precompute(runId);
    pack = getPillarPack(input.pillar_id);

    // Compute hash for regeneration control - fetch separately to avoid join issues
    const { data: run } = await supabase
      .from('diagnostic_runs')
      .select('calibration')
      .eq('id', runId)
      .maybeSingle();

    const { data: inputs } = await supabase
      .from('diagnostic_inputs')
      .select('question_id, value')
      .eq('run_id', runId);

    input_hash = computeInputHash({
      diagnostic_inputs: inputs || [],
      calibration: run?.calibration || null,
    });

  } catch (precomputeError: any) {
    console.error('Precompute failed:', precomputeError);
    pack = getPillarPack('fpa');

    // Minimal fallback without input
    return {
      sections: generateMinimalFallback(pack),
      input_hash: 'precompute_failed',
      used_fallback: true,
      fallback_reason: `precompute_failed: ${precomputeError.message}`,
      heuristics: { passed: false, violations: [] },
      attempts: 0,
      tokens: 0,
    };
  }

  // Phase 2: Generate with retry
  let lastSections: OverviewSection[] | null = null;
  let lastHeuristics: HeuristicResult | null = null;
  let totalTokens = 0;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const { sections, tokens } = await generateInterpretation(input, pack);
      totalTokens += tokens;

      lastSections = sections;
      lastHeuristics = runHeuristics(sections, input, pack);

      if (lastHeuristics.passed) {
        return {
          sections,
          input_hash,
          used_fallback: false,
          fallback_reason: null,
          heuristics: lastHeuristics,
          attempts: attempt,
          tokens: totalTokens,
        };
      }

      console.log(`Heuristics failed (attempt ${attempt}):`,
        lastHeuristics.violations.filter(v => v.severity === 'error'));

    } catch (genError: any) {
      console.error(`Generation failed (attempt ${attempt}):`, genError);
    }
  }

  // Phase 3: Fallback
  return {
    sections: generateFallback(input, pack),
    input_hash,
    used_fallback: true,
    fallback_reason: lastHeuristics
      ? `heuristics_failed: ${lastHeuristics.violations.length} violations`
      : 'generation_failed',
    heuristics: lastHeuristics || { passed: false, violations: [] },
    attempts: MAX_ATTEMPTS,
    tokens: totalTokens,
  };
}

function generateMinimalFallback(pack: PillarPack): OverviewSection[] {
  return pack.sections.map(config => ({
    id: config.id,
    title: config.title,
    content: 'Analysis unavailable. Please try again or contact support.',
  }));
}
