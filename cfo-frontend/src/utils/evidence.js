/**
 * VS-32: Evidence utilities for interpretation content
 *
 * The AI interpretation engine uses [[evidence_id]] tags inline to ground
 * statements to specific data points. The frontend strips these before display.
 */

/**
 * Strip [[evidence_id]] tags from content for clean display
 * @param {string} content - Content with potential [[tags]]
 * @returns {string} - Content without tags
 */
export function stripEvidenceTags(content) {
  if (!content) return '';
  return content.replace(/\[\[[^\]]+\]\]/g, '').trim();
}

/**
 * Extract evidence IDs from content
 * @param {string} content - Content with [[evidence_id]] tags
 * @returns {string[]} - Array of evidence IDs
 */
export function extractEvidenceIds(content) {
  if (!content) return [];
  const matches = content.match(/\[\[([^\]]+)\]\]/g) || [];
  return matches.map(m => m.replace(/\[\[|\]\]/g, ''));
}

/**
 * Process all sections in an interpretation report
 * @param {Array<{id: string, title: string, content: string}>} sections
 * @returns {Array<{id: string, title: string, content: string, evidenceIds: string[]}>}
 */
export function processInterpretationSections(sections) {
  if (!sections) return [];
  return sections.map(section => ({
    ...section,
    evidenceIds: extractEvidenceIds(section.content),
    content: stripEvidenceTags(section.content),
  }));
}
