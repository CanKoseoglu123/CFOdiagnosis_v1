/**
 * VS-32: Shared Patterns Across All Pillars
 *
 * Forbidden patterns and anti-patterns that apply universally.
 * Individual pillars can add to these but not remove from them.
 */

// ============================================================
// SHARED FORBIDDEN PATTERNS
// ============================================================

/**
 * Regex patterns that indicate hallucination or fabrication.
 * If any of these match, the content is flagged as potentially hallucinated.
 */
export const SHARED_FORBIDDEN_PATTERNS: string[] = [
  // Made-up statistics
  'according to (?:recent )?(?:studies|research|surveys|reports)',
  'industry (benchmarks?|standards?|averages?) (?:show|indicate|suggest)',
  '\\d+% of (companies|organizations|businesses|CFOs|finance teams)',
  'research (?:shows|indicates|suggests|reveals)',
  'best-in-class organizations',
  'leading companies',
  'top performers',
  'world-class',

  // Generic consultant speak
  'synergy',
  'paradigm shift',
  'move the needle',
  'low-hanging fruit',
  'boil the ocean',
  'circle back',
  'take offline',
  'bandwidth',  // unless in actual capacity context
  'ecosystem',
  'holistic',
  'leverage.*capabilities',
  'unlock.*value',
  'drive.*transformation',
  'best practices',  // too generic without evidence
  'industry-leading',

  // Unsupported claims
  'guaranteed',
  'will definitely',
  'always results in',
  'never fails',
  'proven to',
  'scientifically proven',

  // Time-specific claims we can't verify
  'in (?:recent|the past|last) (?:years?|months?|quarters?)',
  '(?:current|latest|newest) trends',
  'emerging trends',
  'the market is',

  // Specific numbers we can't verify
  '\\$\\d+(?:\\.\\d+)?\\s*(?:million|billion|M|B)',
  '\\d+(?:\\.\\d+)?x (?:return|improvement|increase)',

  // False certainty
  'it is clear that',
  'obviously',
  'clearly',
  'undoubtedly',
  'without question',
  'there is no doubt',
];

// ============================================================
// SHARED ANTI-PATTERNS
// ============================================================

/**
 * Anti-patterns in report writing.
 * These are patterns that indicate low-quality output.
 */
export const SHARED_ANTI_PATTERNS: string[] = [
  // Generic statements
  'Your organization',  // Should use actual company name
  'Your company',       // Should use actual company name
  'your industry',      // Should use actual industry
  'various areas',
  'multiple factors',
  'several aspects',
  'different ways',
  'many organizations',
  'some companies',

  // Hedging without substance
  'could potentially',
  'might possibly',
  'may or may not',
  'it depends',
  'in some cases',

  // Empty transitions
  'that being said',
  'having said that',
  'in other words',
  'to put it another way',
  'as mentioned earlier',
  'as we discussed',

  // Repetitive filler
  'it is important to note',
  'it should be noted',
  'it is worth mentioning',
  'it goes without saying',

  // Over-promising
  'transform your',
  'revolutionize your',
  'dramatically improve',
  'significantly enhance',

  // Under-delivering
  'consider looking into',
  'you might want to think about',
  'it could be beneficial',
  'there may be opportunities',
];

// ============================================================
// CONTEXT STUFFING PATTERNS
// ============================================================

/**
 * Patterns that indicate "context stuffing" - cramming context
 * references into one sentence to game quality metrics.
 */
export const CONTEXT_STUFFING_PATTERNS: string[] = [
  // Multiple context items in one phrase
  'as a .* company in the .* industry with .* employees',
  'given your .* and .* and .*',
  'considering .*, .*, and .*',

  // Forced context insertion
  'speaking of .*,',
  'on the topic of .*,',
  'regarding .*,',
];

// ============================================================
// QUALITY SIGNAL PATTERNS
// ============================================================

/**
 * Positive patterns that indicate quality writing.
 * Used to validate good outputs, not flag bad ones.
 */
export const QUALITY_SIGNALS: string[] = [
  // Evidence-based statements
  'based on your response to',
  'your answer indicates',
  'the assessment shows',
  'your score of \\d+%',

  // Specific references
  'in the area of',
  'specifically in',
  'particularly around',

  // Concrete next steps
  'as a first step',
  'to begin',
  'starting with',
  'the immediate priority',

  // Grounded recommendations
  'given the current',
  'building on your existing',
  'addressing the gap in',
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Check if text contains any forbidden patterns.
 * @returns Array of matched patterns (empty if clean)
 */
export function checkForbiddenPatterns(text: string): string[] {
  const matches: string[] = [];

  for (const pattern of SHARED_FORBIDDEN_PATTERNS) {
    const regex = new RegExp(pattern, 'gi');
    if (regex.test(text)) {
      matches.push(pattern);
    }
  }

  return matches;
}

/**
 * Check if text contains anti-patterns.
 * @returns Array of matched anti-patterns (empty if clean)
 */
export function checkAntiPatterns(text: string): string[] {
  const matches: string[] = [];

  for (const pattern of SHARED_ANTI_PATTERNS) {
    if (text.toLowerCase().includes(pattern.toLowerCase())) {
      matches.push(pattern);
    }
  }

  return matches;
}

/**
 * Check for context stuffing.
 * @returns true if context stuffing detected
 */
export function detectContextStuffing(text: string): boolean {
  for (const pattern of CONTEXT_STUFFING_PATTERNS) {
    const regex = new RegExp(pattern, 'gi');
    if (regex.test(text)) {
      return true;
    }
  }
  return false;
}

/**
 * Count quality signals in text.
 * @returns Number of quality signals found
 */
export function countQualitySignals(text: string): number {
  let count = 0;

  for (const pattern of QUALITY_SIGNALS) {
    const regex = new RegExp(pattern, 'gi');
    const matches = text.match(regex);
    if (matches) {
      count += matches.length;
    }
  }

  return count;
}

/**
 * Comprehensive text quality check.
 * @returns Quality assessment object
 */
export function assessTextQuality(text: string): {
  forbidden_matches: string[];
  anti_pattern_matches: string[];
  has_context_stuffing: boolean;
  quality_signal_count: number;
  overall_quality: 'good' | 'acceptable' | 'poor';
} {
  const forbidden = checkForbiddenPatterns(text);
  const antiPatterns = checkAntiPatterns(text);
  const stuffing = detectContextStuffing(text);
  const signals = countQualitySignals(text);

  let quality: 'good' | 'acceptable' | 'poor' = 'good';

  if (forbidden.length > 0 || stuffing) {
    quality = 'poor';
  } else if (antiPatterns.length > 3 || signals < 2) {
    quality = 'acceptable';
  }

  return {
    forbidden_matches: forbidden,
    anti_pattern_matches: antiPatterns,
    has_context_stuffing: stuffing,
    quality_signal_count: signals,
    overall_quality: quality,
  };
}
