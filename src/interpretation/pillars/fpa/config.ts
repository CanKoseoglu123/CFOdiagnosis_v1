/**
 * VS-32: FP&A Pillar Pack Configuration
 */

import { InterpretationInput } from '../../engine/types';

export interface SectionConfig {
  id: string;
  title: string;
  guidance: string;
  max_words: number;
}

export interface PillarPack {
  pillar_id: string;
  pillar_name: string;
  sections: SectionConfig[];
  forbidden_phrases: string[];
  fallback_templates: Record<string, (input: InterpretationInput) => { content: string; evidence_ids: string[] }>;
}

export const FPA_PACK: PillarPack = {
  pillar_id: 'fpa',
  pillar_name: 'FP&A',

  sections: [
    {
      id: 'executive_snapshot',
      title: 'Executive Snapshot',
      guidance: 'Score, level, and overall state. High-level only.',
      max_words: 80,
    },
    {
      id: 'strengths',
      title: 'Strengths',
      guidance: 'Top performing objectives. What is working.',
      max_words: 80,
    },
    {
      id: 'constraints',
      title: 'Constraints',
      guidance: 'What caps maturity. Gate blockers, critical failures.',
      max_words: 100,
    },
    {
      id: 'opportunity_areas',
      title: 'Opportunity Areas',
      guidance: 'Priority misalignments. What to fix and why.',
      max_words: 120,
    },
    {
      id: 'path_forward',
      title: 'Path Forward',
      guidance: 'Sequenced recommendation. What to do first.',
      max_words: 100,
    },
  ],

  forbidden_phrases: [
    'your score is',
    'you scored',
    'based on your responses',
    'the assessment shows',
    'room for improvement',
    'opportunities to enhance',
    'areas for development',
    'it is recommended',
    'you may want to consider',
    'best-in-class',
    'world-class',
    'digital transformation journey',
  ],

  fallback_templates: {
    executive_snapshot: (input) => ({
      content: `${input.company_name} is assessed at Level ${input.maturity_level} (${input.maturity_name}) with an execution score of ${input.overall_score}%.`,
      evidence_ids: ['score_overall', `level_${input.maturity_level}`],
    }),
    strengths: (input) => {
      const top = input.objectives.filter(o => o.score >= 65).slice(0, 2);
      return {
        content: top.length > 0
          ? `The organization demonstrates capability in ${top.map(o => o.name).join(' and ')}.`
          : 'The organization is building foundational capabilities across objectives.',
        evidence_ids: top.map(o => `obj_${o.id}`),
      };
    },
    constraints: (input) => ({
      content: input.critical_failures.length > 0
        ? `Maturity is constrained by critical gaps in ${input.critical_failures.map(c => c.objective_name).join(', ')}.`
        : input.is_capped
          ? `Maturity is limited by gaps in ${input.capped_by.join(', ')}.`
          : 'No critical constraints currently limit maturity advancement.',
      evidence_ids: input.critical_failures.length > 0
        ? input.critical_failures.map(c => `critical_${c.question_id}`)
        : input.is_capped ? ['cap_active'] : ['cap_none'],
    }),
    opportunity_areas: (input) => {
      const misaligned = input.priority_misalignments.slice(0, 2);
      return {
        content: misaligned.length > 0
          ? `Priority focus areas include ${misaligned.map(m => `${m.objective_name} (${m.score}%)`).join(' and ')}.`
          : 'Current priorities align with performance levels.',
        evidence_ids: misaligned.map(m => `obj_${m.objective_name.toLowerCase().replace(/\s+/g, '_')}`),
      };
    },
    path_forward: (input) => ({
      content: input.failed_gates.length > 0
        ? `Address gate requirements for Level ${input.failed_gates[0].level + 1} advancement.`
        : 'Continue strengthening lowest-scoring objectives to advance maturity.',
      evidence_ids: input.failed_gates.length > 0
        ? [`gate_L${input.failed_gates[0].level}_blocked`]
        : ['path_optimization'],
    }),
  },
};
