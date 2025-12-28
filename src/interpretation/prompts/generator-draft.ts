/**
 * VS-32: Generator Draft Prompt
 *
 * AI1 creates the initial draft with 5-section overview structure.
 * Uses evidence IDs, golden output patterns, and pillar-specific terminology.
 */

import { GeneratorInput } from '../types';
import { PillarInterpretationConfig, GoldenOutputPattern } from '../pillars/types';

/**
 * Format golden output exemplars for the prompt.
 */
function formatGoldenExemplars(pattern: GoldenOutputPattern): string {
  if (!pattern.exemplar_insights || pattern.exemplar_insights.length === 0) {
    return '';
  }
  return pattern.exemplar_insights
    .slice(0, 2) // Include 2 examples
    .map((ex, i) => `  Example ${i + 1}: "${ex}"`)
    .join('\n');
}

/**
 * Format forbidden patterns for the prompt.
 */
function formatForbiddenPatterns(config?: PillarInterpretationConfig): string {
  if (!config) return '';

  const patterns = [
    ...(config.pillar_forbidden_patterns || []),
  ];

  if (patterns.length === 0) return '';

  return `
FORBIDDEN PHRASES (will cause rejection):
${patterns.map(p => `- "${p}"`).join('\n')}
`;
}

/**
 * Format evidence ID guidance for the prompt.
 */
function formatEvidenceGuidance(): string {
  return `
EVIDENCE ID FORMAT:
When referencing data, use evidence IDs in brackets:
- [obj_forecasting] - Objective reference
- [prac_variance_analysis] - Practice reference
- [score_overall] - Score reference
- [gate_l2_passed] - Gate reference
- [critical_fpa_l1_q01] - Critical failure reference
- [imp_forecasting=4] - Importance calibration reference
- [ctx_industry] - Context reference

EVERY claim MUST have at least one evidence ID. No unsupported statements.
`;
}

export function buildGeneratorDraftPrompt(input: GeneratorInput): string {
  const cappedInfo = input.capped
    ? `Yes, by: ${input.capped_by_titles.join(', ')}`
    : 'No';

  const objectivesList = input.objectives
    .map(
      (o) =>
        `- [obj_${o.id}] ${o.name}: ${o.score}% (importance: ${o.importance}/5) ${o.has_critical_failure ? '[CRITICAL FAILURE]' : ''}`
    )
    .join('\n');

  const initiativesList = input.top_initiatives
    .map((i) => `- [${i.priority}] ${i.title}: ${i.recommendation}`)
    .join('\n');

  const pillarConfig = input.pillar_config;
  const goldenOutputs = pillarConfig?.golden_outputs || {};

  // Build section-specific guidance from golden outputs
  const sectionGuidance = Object.entries(goldenOutputs)
    .map(([sectionId, pattern]) => {
      const p = pattern as GoldenOutputPattern;
      return `
### ${sectionId.toUpperCase().replace(/_/g, ' ')}
Required evidence types: ${p.required_evidence_types.join(', ')}
Minimum evidence count: ${p.min_evidence_count}
${formatGoldenExemplars(p)}

Anti-patterns to AVOID:
${p.anti_patterns?.map(ap => `- "${ap}"`).join('\n') || 'None'}
`;
    })
    .join('\n');

  return `
You are writing a sharp, contextual analysis for a finance leader.

═══════════════════════════════════════════════════════════════════
CORE RULES (MANDATORY)
═══════════════════════════════════════════════════════════════════

1. EVIDENCE-BACKED: Every claim MUST cite evidence IDs in brackets.
   DO NOT make claims without evidence. If info is missing, mark [NEED: x].

2. CONTEXT ONLY: Every sentence must reference THIS company's specifics.
   DO NOT write generic statements that apply to any company.

3. NO SCORE DESCRIPTIONS: The user can see the numbers.
   DO NOT say "Your score is 35%".
   DO say "Your 3-person team managing 5 revenue streams explains why..."

4. SHARP & SHORT: Each section ~50-75 words. <25 words per sentence average.
   NO hedging words: "could", "might", "perhaps", "it may be beneficial"
   USE direct statements: "Finance must..." not "It would be advisable..."

${formatEvidenceGuidance()}

${formatForbiddenPatterns(pillarConfig)}

═══════════════════════════════════════════════════════════════════
WHAT YOU KNOW ABOUT THIS COMPANY
═══════════════════════════════════════════════════════════════════

Company: ${input.company_name} [ctx_company_name]
Industry: ${input.industry} [ctx_industry]
Team Size: ${input.team_size || '[NEED: FP&A team size]'}
Pain Points: ${input.pain_points?.join('; ') || '[NEED: stated pain points]'}
Systems: ${input.systems || '[NEED: current tools/systems]'}

═══════════════════════════════════════════════════════════════════
DIAGNOSTIC RESULTS (ABSOLUTE TRUTH — DO NOT DISPUTE)
═══════════════════════════════════════════════════════════════════

Execution Score: ${input.execution_score}% [score_overall]
Maturity Level: ${input.maturity_level} (${input.level_name}) [gate_l${input.maturity_level}_achieved]
Capped: ${cappedInfo}

Objectives:
${objectivesList}

═══════════════════════════════════════════════════════════════════
TONALITY INSTRUCTIONS (FOLLOW EXACTLY)
═══════════════════════════════════════════════════════════════════

${input.tonality_instructions}

Failure to follow tonality will result in a rejected draft.

═══════════════════════════════════════════════════════════════════
TOP INITIATIVES (What actions we're explaining)
═══════════════════════════════════════════════════════════════════

${initiativesList}

═══════════════════════════════════════════════════════════════════
SECTION-BY-SECTION GUIDANCE
═══════════════════════════════════════════════════════════════════
${sectionGuidance}

═══════════════════════════════════════════════════════════════════
OUTPUT FORMAT (JSON only, no markdown)
═══════════════════════════════════════════════════════════════════

{
  "executive_summary": "2-3 sentences: What the pattern means for THIS company. Include [score_overall] and [gate_] evidence.",

  "current_state": "2-3 sentences: Specific strengths and gaps with [obj_] and [prac_] evidence.",

  "critical_risks": "1-2 sentences: Critical failures if any, with [critical_] evidence. If none, state that clearly.",

  "opportunities": "2-3 sentences: Highest-value improvements with [imp_] and [obj_] evidence.",

  "priority_rationale": "2-3 sentences: Why the recommended actions matter for THIS company.",

  "evidence_ids_used": ["list all [xxx] evidence IDs referenced in the text"],

  "gaps_marked": ["list of [NEED: x] markers used, if any"]
}

TOTAL OUTPUT: ~300 words across all sections. Be sharp. Be specific. No filler.
`.trim();
}
