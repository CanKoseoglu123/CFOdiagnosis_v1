/**
 * VS-32: Fallback - Template-based output when AI fails heuristics
 */

import { OverviewSection, InterpretationInput } from './types';
import { PillarPack } from '../pillars/registry';

export function generateFallback(
  input: InterpretationInput,
  pack: PillarPack
): OverviewSection[] {
  return pack.sections.map(config => {
    const template = pack.fallback_templates[config.id];
    const result = template
      ? template(input)
      : { content: `${config.title} unavailable.`, evidence_ids: [] };

    // Inject evidence tags into content
    const contentWithEvidence = result.evidence_ids.length > 0
      ? `${result.content} [[${result.evidence_ids[0]}]]`
      : result.content;

    return {
      id: config.id,
      title: config.title,
      content: contentWithEvidence,
    };
  });
}
