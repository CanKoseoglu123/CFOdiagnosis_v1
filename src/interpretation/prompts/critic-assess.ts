/**
 * VS-32: Critic Assess Prompt
 *
 * AI2 identifies gaps in the draft by checking against golden output patterns.
 * Validates evidence ID usage and forbidden pattern violations.
 */

import { CriticAssessInput } from '../types';
import { GoldenOutputPattern } from '../pillars/types';

/**
 * Format golden output requirements for validation.
 */
function formatGoldenOutputRequirements(
  goldenOutputs?: Record<string, GoldenOutputPattern>
): string {
  if (!goldenOutputs) {
    return 'No specific requirements configured.';
  }

  return Object.entries(goldenOutputs)
    .map(([sectionId, pattern]) => {
      const p = pattern as GoldenOutputPattern;
      return `
### ${sectionId.replace(/_/g, ' ').toUpperCase()}
- Required evidence types: ${p.required_evidence_types.join(', ')}
- Minimum evidence count: ${p.min_evidence_count}
- Must use context: ${p.context_weaving?.must_use?.join(', ') || 'None'}
- Forbidden patterns: ${p.forbidden_patterns?.slice(0, 3).join(', ') || 'None'}
`;
    })
    .join('\n');
}

export function buildCriticAssessPrompt(input: CriticAssessInput): string {
  const draftJson = JSON.stringify(input.draft, null, 2);
  const contextJson = JSON.stringify(
    {
      company_name: input.context.company_name,
      industry: input.context.industry,
      team_size: input.context.team_size,
      pain_points: input.context.pain_points,
      systems: input.context.systems,
      execution_score: input.context.execution_score,
      maturity_level: input.context.maturity_level,
      objectives: input.context.objectives.map((o) => ({
        id: o.id,
        name: o.name,
        score: o.score,
        has_critical_failure: o.has_critical_failure,
        importance: o.importance,
      })),
    },
    null,
    2
  );

  const goldenRequirements = formatGoldenOutputRequirements(
    input.pillar_config?.golden_outputs
  );

  const forbiddenPatterns = input.pillar_config?.pillar_forbidden_patterns || [];

  return `
You are identifying gaps in a draft report. Focus ONLY on what's missing or wrong.

═══════════════════════════════════════════════════════════════════
THE DRAFT TO ASSESS
═══════════════════════════════════════════════════════════════════

${draftJson}

═══════════════════════════════════════════════════════════════════
COMPANY CONTEXT AVAILABLE
═══════════════════════════════════════════════════════════════════

${contextJson}

═══════════════════════════════════════════════════════════════════
GOLDEN OUTPUT REQUIREMENTS (CHECK AGAINST THESE)
═══════════════════════════════════════════════════════════════════

${goldenRequirements}

═══════════════════════════════════════════════════════════════════
FORBIDDEN PATTERNS (FLAG IF FOUND)
═══════════════════════════════════════════════════════════════════

${forbiddenPatterns.length > 0 ? forbiddenPatterns.map(p => `- "${p}"`).join('\n') : 'None configured.'}

═══════════════════════════════════════════════════════════════════
ASSESSMENT CRITERIA
═══════════════════════════════════════════════════════════════════

Check for these issues and create gaps for each:

1. EVIDENCE GAPS
   - Sections missing required evidence types
   - Claims without evidence IDs
   - Insufficient evidence count per section

2. CONTEXT GAPS
   - [NEED: x] markers that weren't filled
   - Generic statements that should reference company specifics
   - Missing connections between pain points and findings

3. FORBIDDEN PATTERN VIOLATIONS
   - Any matches to forbidden patterns above
   - Hallucinated statistics or benchmarks
   - Generic industry claims without evidence

4. SPECIFICITY GAPS
   - Recommendations that could be more tailored
   - Vague language that lacks precision
   - Missing objective/practice references

SEVERITY SCALE:
- 5: Critical - Must fix before publish (forbidden pattern, major gap)
- 4: High - Strongly recommend fixing (missing key evidence)
- 3: Medium - Should fix if time permits (weak specificity)
- 2: Low - Nice to have (minor improvement)
- 1: Minor - Cosmetic only

═══════════════════════════════════════════════════════════════════
OUTPUT FORMAT (JSON only)
═══════════════════════════════════════════════════════════════════

{
  "gaps": [
    {
      "gap_id": "gap_1",
      "section": "executive_summary" | "current_state" | "critical_risks" | "opportunities" | "priority_rationale",
      "objective_id": "obj_..." (if applicable),
      "description": "What specific information is missing or wrong",
      "why_needed": "How filling this gap would improve the report",
      "related_evidence_ids": ["evidence IDs that could help"],
      "severity": 1-5
    }
  ],
  "forbidden_violations": [
    {
      "pattern": "The matched forbidden pattern",
      "location": "Where it appears in the draft",
      "suggestion": "How to fix it"
    }
  ],
  "evidence_coverage": {
    "executive_summary": { "count": 0, "types": [] },
    "current_state": { "count": 0, "types": [] },
    "critical_risks": { "count": 0, "types": [] },
    "opportunities": { "count": 0, "types": [] },
    "priority_rationale": { "count": 0, "types": [] }
  }
}

If no gaps found, return: { "gaps": [], "forbidden_violations": [], "evidence_coverage": {...} }
`.trim();
}
