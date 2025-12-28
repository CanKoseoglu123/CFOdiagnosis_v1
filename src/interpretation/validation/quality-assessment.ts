/**
 * VS-25: Quality Assessment (Heuristic, Not Blocking)
 *
 * Quality checks are heuristics, not laws. They warn, not block.
 * Only hard contradictions trigger RED status.
 */

import { DraftReport, DiagnosticData, HeuristicResult, CriterionResult } from '../types';
import { QUALITY_THRESHOLDS } from '../config';

/**
 * Assess draft quality using heuristics.
 * Returns traffic light status: green | yellow | red
 */
export function assessHeuristics(
  draft: DraftReport,
  data: DiagnosticData
): HeuristicResult {
  const accurate = checkAccurate(draft, data);
  const contextual = checkContextual(draft, data);
  const actionable = checkActionable(draft);
  const complete = checkComplete(draft, data);

  const allWarnings = [
    ...accurate.warnings,
    ...contextual.warnings,
    ...actionable.warnings,
    ...complete.warnings,
  ];

  // Traffic Light Protocol
  const overall = determineOverallStatus(accurate, contextual, actionable, complete);

  return {
    overall,
    criteria: { accurate, contextual, actionable, complete },
    heuristic_warnings: allWarnings,
    publish_anyway: overall !== 'red', // Yellow still publishes
  };
}

/**
 * Determine overall status from criteria results.
 */
function determineOverallStatus(
  accurate: CriterionResult,
  contextual: CriterionResult,
  actionable: CriterionResult,
  complete: CriterionResult
): 'green' | 'yellow' | 'red' {
  // RED: Hard score contradictions OR data too sparse
  const hasContradictions = accurate.warnings.some((w) =>
    w.includes('contradiction')
  );
  if (hasContradictions) return 'red';

  // GREEN: All criteria pass
  const allPassed = [accurate, contextual, actionable, complete].every(
    (c) => c.passed
  );
  if (allPassed) return 'green';

  // YELLOW: Some warnings but no hard failures
  return 'yellow';
}

/**
 * ACCURATE: Check for score contradictions and fact accuracy.
 * Soft-fails on word choice issues, hard-fails on true contradictions.
 * VS-32: Enhanced with numeric, initiative, and maturity fact checking.
 */
function checkAccurate(draft: DraftReport, data: DiagnosticData): CriterionResult {
  const warnings: string[] = [];
  const text = JSON.stringify(draft).toLowerCase();

  const POSITIVE_WORDS = ['excellent', 'outstanding', 'exceptional', 'impressive'];
  const NEGATIVE_WORDS = ['poor', 'weak', 'failing', 'inadequate'];

  for (const obj of data.objectives) {
    for (const word of POSITIVE_WORDS) {
      if (text.includes(word) && text.includes(obj.name.toLowerCase()) && obj.score < 70) {
        // WARNING, not failure
        warnings.push(
          `heuristic_warning: "${word}" used for ${obj.name} (score: ${obj.score}%)`
        );
      }
    }
    for (const word of NEGATIVE_WORDS) {
      if (text.includes(word) && text.includes(obj.name.toLowerCase()) && obj.score > 60) {
        warnings.push(
          `heuristic_warning: "${word}" used for ${obj.name} (score: ${obj.score}%)`
        );
      }
    }
  }

  // VS-32: Enhanced fact checking
  const numericWarnings = checkNumericFacts(draft, data);
  const initiativeWarnings = checkInitiativeReferences(draft, data);
  const maturityWarnings = checkMaturityClaims(draft, data);

  warnings.push(...numericWarnings);
  warnings.push(...initiativeWarnings);
  warnings.push(...maturityWarnings);

  // Only TRUE contradiction (not just word choice) triggers hard fail
  const hasHardContradiction = detectHardContradiction(draft, data);

  // VS-32: Maturity claims that are wrong are also hard contradictions
  const hasMaturityContradiction = maturityWarnings.length > 0;

  return {
    passed: !hasHardContradiction && !hasMaturityContradiction,
    warnings,
  };
}

/**
 * Detect hard contradictions: AI says opposite of what score shows.
 */
function detectHardContradiction(draft: DraftReport, data: DiagnosticData): boolean {
  const text = JSON.stringify(draft).toLowerCase();

  for (const obj of data.objectives) {
    const objNameLower = obj.name.toLowerCase();

    // Example: "Your forecasting is your biggest strength" when score is 20%
    const strengthClaims = [
      `${objNameLower} is your biggest strength`,
      `${objNameLower} is a key strength`,
      `excel at ${objNameLower}`,
      `${objNameLower} is excellent`,
      `strong ${objNameLower}`,
    ];

    for (const claim of strengthClaims) {
      if (text.includes(claim) && obj.score < 40) {
        return true; // This IS a hard contradiction
      }
    }

    // Reverse: claiming weakness when score is high
    const weaknessClaims = [
      `${objNameLower} is your biggest weakness`,
      `${objNameLower} is failing`,
      `critical gap in ${objNameLower}`,
    ];

    for (const claim of weaknessClaims) {
      if (text.includes(claim) && obj.score > 80 && !obj.has_critical_failure) {
        return true;
      }
    }
  }

  return false;
}

/**
 * VS-32: Enhanced fact checking - verify numeric claims match actual data.
 */
function checkNumericFacts(draft: DraftReport, data: DiagnosticData): string[] {
  const warnings: string[] = [];
  const text = JSON.stringify(draft);

  // Extract all percentage claims (e.g., "75%", "at 75 percent")
  const percentageRegex = /(\d{1,3})(?:\s*%|(?:\s+percent))/gi;
  const matches = text.matchAll(percentageRegex);

  for (const match of matches) {
    const claimedPercent = parseInt(match[1], 10);

    // Check if this percentage matches any actual score
    const validScores = [
      data.execution_score,
      ...data.objectives.map((o) => o.score),
    ];

    // Allow +/- 5% tolerance for rounding
    const isValid = validScores.some(
      (score) => Math.abs(score - claimedPercent) <= 5
    );

    // If percentage doesn't match any score and isn't a generic benchmark
    const genericBenchmarks = [100, 50, 25, 75, 0]; // Common reference points
    if (!isValid && !genericBenchmarks.includes(claimedPercent)) {
      warnings.push(
        `fact_check: Claimed ${claimedPercent}% doesn't match any actual score`
      );
    }
  }

  return warnings;
}

/**
 * VS-32: Verify initiative references exist in actual data.
 */
function checkInitiativeReferences(draft: DraftReport, data: DiagnosticData): string[] {
  const warnings: string[] = [];
  const text = JSON.stringify(draft).toLowerCase();

  // Known initiative keywords that should map to actual initiatives
  const initiativeKeywords = [
    'driver-based', 'scenario modeling', 'forecasting', 'budgeting',
    'variance analysis', 'financial close', 'reporting', 'analytics',
    'planning', 'consolidation', 'cash flow', 'working capital'
  ];

  // Extract initiative names from actual data
  const actualInitiatives = data.initiatives.map((i) => i.title.toLowerCase());
  const actualObjectives = data.objectives.map((o) => o.name.toLowerCase());

  // Check for initiative mentions that don't exist in data
  for (const keyword of initiativeKeywords) {
    if (text.includes(keyword)) {
      const matchesInitiative = actualInitiatives.some((i) => i.includes(keyword));
      const matchesObjective = actualObjectives.some((o) => o.includes(keyword));

      if (!matchesInitiative && !matchesObjective) {
        // Check if it's mentioned as a recommendation (acceptable)
        const isRecommendation = text.includes(`implement ${keyword}`) ||
          text.includes(`consider ${keyword}`) ||
          text.includes(`adopt ${keyword}`);

        if (!isRecommendation) {
          warnings.push(
            `fact_check: "${keyword}" mentioned but not in actual initiatives/objectives`
          );
        }
      }
    }
  }

  return warnings;
}

/**
 * VS-32: Verify maturity level claims match actual data.
 */
function checkMaturityClaims(draft: DraftReport, data: DiagnosticData): string[] {
  const warnings: string[] = [];
  const text = JSON.stringify(draft).toLowerCase();

  const levelNames = ['emerging', 'defined', 'managed', 'optimized'];
  const actualLevel = data.maturity_level;
  const actualLevelName = data.level_name?.toLowerCase() || levelNames[actualLevel - 1] || '';

  // Check if draft claims wrong maturity level
  for (let i = 0; i < levelNames.length; i++) {
    const levelName = levelNames[i];
    const levelNum = i + 1;

    // Look for claims like "at level 3" or "you are managed"
    const levelClaim = text.includes(`level ${levelNum}`) ||
      text.includes(`at ${levelName}`) ||
      text.includes(`you are ${levelName}`);

    if (levelClaim && levelNum !== actualLevel) {
      warnings.push(
        `fact_check: Claims Level ${levelNum} (${levelName}) but actual is Level ${actualLevel} (${actualLevelName})`
      );
    }
  }

  return warnings;
}

/**
 * CONTEXTUAL: Check for context distribution.
 * Anti-gaming: context must be distributed, not stuffed.
 */
function checkContextual(draft: DraftReport, data: DiagnosticData): CriterionResult {
  const warnings: string[] = [];

  const contextSignals = [
    data.company_name?.toLowerCase(),
    data.industry?.toLowerCase(),
    ...(data.pain_points || []).map((p) => p.toLowerCase()),
    data.team_size ? `${data.team_size}` : null,
    data.systems?.toLowerCase(),
  ].filter(Boolean) as string[];

  // RULE 1: Minimum density
  const allText = JSON.stringify(draft).toLowerCase();
  const foundSignals = contextSignals.filter((signal) => allText.includes(signal));

  if (foundSignals.length < QUALITY_THRESHOLDS.minContextSignals) {
    warnings.push(
      `Only ${foundSignals.length} context references (need ${QUALITY_THRESHOLDS.minContextSignals}+)`
    );
  }

  // RULE 2: Each section needs context
  const sections = [
    { name: 'synthesis', text: draft.synthesis },
    { name: 'priority_rationale', text: draft.priority_rationale },
    { name: 'key_insight', text: draft.key_insight },
  ];

  for (const section of sections) {
    const sectionText = section.text?.toLowerCase() || '';
    const hasContext = contextSignals.some((s) => sectionText.includes(s));
    if (!hasContext) {
      warnings.push(`"${section.name}" has no context reference`);
    }
  }

  // RULE 3: ANTI-GAMING - Context must be distributed across sentences
  for (const section of sections) {
    const sentences = (section.text || '').split(/[.!?]+/).filter((s) => s.trim());
    const signalsPerSentence = sentences.map((sentence) =>
      contextSignals.filter((signal) => sentence.toLowerCase().includes(signal)).length
    );

    // Flag "context stuffing": >3 signals in one sentence, 0 in others
    const maxInOneSentence = Math.max(...signalsPerSentence, 0);
    const sentencesWithContext = signalsPerSentence.filter((c) => c > 0).length;

    if (maxInOneSentence >= 3 && sentencesWithContext === 1 && sentences.length > 1) {
      warnings.push(`anti_gaming: Context stuffing detected in ${section.name}`);
    }
  }

  // RULE 4: Unresolved markers
  const needMarkers = allText.match(/\[need:/gi) || [];
  if (needMarkers.length > 0) {
    warnings.push(`${needMarkers.length} unresolved [NEED:] markers`);
  }

  // Pass if no critical failures (warnings are logged but don't block)
  const criticalFailures = warnings.filter(
    (w) => !w.startsWith('heuristic_warning') && !w.startsWith('anti_gaming')
  );

  return {
    passed: criticalFailures.length === 0,
    warnings,
  };
}

/**
 * ACTIONABLE: Check for concrete next steps.
 */
function checkActionable(draft: DraftReport): CriterionResult {
  const warnings: string[] = [];
  const hasNextSteps = draft.priority_rationale && draft.priority_rationale.length > 50;

  if (!hasNextSteps) {
    warnings.push('Missing or insufficient priority rationale');
  }

  // Check for hedging language
  const hedgingWords = ['could', 'might', 'perhaps', 'maybe', 'possibly', 'it may be beneficial'];
  const text = (draft.priority_rationale || '').toLowerCase();

  for (const word of hedgingWords) {
    if (text.includes(word)) {
      warnings.push(`heuristic_warning: Hedging word "${word}" found in priority_rationale`);
    }
  }

  return { passed: !!hasNextSteps, warnings };
}

/**
 * COMPLETE: Check that critical objectives are mentioned.
 */
function checkComplete(draft: DraftReport, data: DiagnosticData): CriterionResult {
  const warnings: string[] = [];
  const text = JSON.stringify(draft).toLowerCase();

  for (const obj of data.objectives) {
    if (obj.has_critical_failure || obj.score < 50) {
      if (!text.includes(obj.name.toLowerCase())) {
        warnings.push(`Critical objective "${obj.name}" not mentioned`);
      }
    }
  }

  return { passed: warnings.length === 0, warnings };
}

/**
 * Count words in a draft.
 */
export function countWords(draft: DraftReport): number {
  const allText = [
    draft.synthesis,
    draft.priority_rationale,
    draft.key_insight,
  ]
    .filter(Boolean)
    .join(' ');

  return allText.split(/\s+/).filter(Boolean).length;
}

/**
 * Check if draft exceeds word limit.
 */
export function checkWordLimit(draft: DraftReport): boolean {
  return countWords(draft) <= QUALITY_THRESHOLDS.maxWordCount;
}
