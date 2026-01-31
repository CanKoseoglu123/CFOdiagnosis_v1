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
      max_words: 100,
    },
    {
      id: 'strengths',
      title: 'Strengths',
      guidance: 'Top performing objectives with specific practice examples. What is working.',
      max_words: 120,
    },
    {
      id: 'constraints',
      title: 'Constraints',
      guidance: 'What caps maturity. Gate blockers, specific weak practices. Reference pain points if relevant.',
      max_words: 150,
    },
    {
      id: 'opportunity_areas',
      title: 'Opportunity Areas',
      guidance: 'Priority misalignments: which practices to focus on, and why it matters for this company type.',
      max_words: 180,
    },
    {
      id: 'path_forward',
      title: 'Path Forward',
      guidance: 'Sequenced recommendation with specific practice areas. Reference company context.',
      max_words: 150,
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
    executive_snapshot: (input) => {
      const strongCount = input.objectives.filter(o => o.score >= 65).length;
      const weakCount = input.objectives.filter(o => o.score < 50).length;
      const capNote = input.is_capped ? ` Maturity is currently capped due to unresolved gate requirements.` : '';
      return {
        content: `${input.company_name} is assessed at Level ${input.maturity_level} (${input.maturity_name}) with an execution score of ${input.overall_score}%. Across ${input.objectives.length} objectives, ${strongCount} show established capability while ${weakCount} require focused attention.${capNote}`,
        evidence_ids: ['score_overall', `level_${input.maturity_level}`, input.is_capped ? 'cap_active' : 'cap_none'],
      };
    },
    strengths: (input) => {
      const top = input.objectives.filter(o => o.score >= 65).sort((a, b) => b.score - a.score).slice(0, 2);
      return {
        content: top.length > 0
          ? `The organization demonstrates established capability in ${top.map(o => `${o.name} (${o.score}%)`).join(' and ')}. These objectives provide a solid foundation for advancing maturity across the FP&A function.`
          : 'The organization is building foundational capabilities across objectives. No individual objective has yet reached the established threshold of 65%, indicating an early-stage function with broad room for development.',
        evidence_ids: top.length > 0 ? top.map(o => `obj_${o.id}`) : ['score_overall'],
      };
    },
    constraints: (input) => {
      const criticalNames = [...new Set(input.critical_failures.map(c => c.objective_name))];
      if (input.critical_failures.length > 0) {
        return {
          content: `Maturity is constrained by ${input.critical_failures.length} critical failure${input.critical_failures.length > 1 ? 's' : ''} in ${criticalNames.join(', ')}. These gate blockers prevent advancement beyond the current level and represent the highest-priority items to resolve.`,
          evidence_ids: input.critical_failures.map(c => `critical_${c.question_id}`),
        };
      }
      if (input.is_capped) {
        return {
          content: `Maturity is limited by unresolved gaps in ${input.capped_by.join(', ')}. While no single critical failure blocks progress, the cumulative effect of these gaps caps the achievable maturity level.`,
          evidence_ids: ['cap_active'],
        };
      }
      return {
        content: 'No critical constraints currently limit maturity advancement. The function is positioned to progress by strengthening existing capabilities.',
        evidence_ids: ['cap_none'],
      };
    },
    opportunity_areas: (input) => {
      const misaligned = input.priority_misalignments.slice(0, 2);
      const lowest = input.objectives.sort((a, b) => a.score - b.score).slice(0, 2);
      if (misaligned.length > 0) {
        return {
          content: `Priority focus areas include ${misaligned.map(m => `${m.objective_name} (${m.score}%, importance ${m.importance}/5)`).join(' and ')}. These objectives carry high strategic weight but currently underperform, representing the largest return on improvement effort.`,
          evidence_ids: lowest.map(o => `obj_${o.id}`),
        };
      }
      return {
        content: `The lowest-scoring objectives are ${lowest.map(o => `${o.name} (${o.score}%)`).join(' and ')}. Targeted investment in these areas will have the most significant impact on overall maturity advancement.`,
        evidence_ids: lowest.map(o => `obj_${o.id}`),
      };
    },
    path_forward: (input) => {
      if (input.failed_gates.length > 0) {
        const gate = input.failed_gates[0];
        return {
          content: `The immediate priority is resolving Level ${gate.level} gate blockers to unlock advancement to Level ${gate.level + 1}. Focus on the ${gate.blocking_questions.length} blocking requirement${gate.blocking_questions.length > 1 ? 's' : ''} before expanding scope to broader capability building.`,
          evidence_ids: [`gate_L${gate.level}_blocked`],
        };
      }
      const lowest = input.objectives.sort((a, b) => a.score - b.score)[0];
      return {
        content: `Continue strengthening ${lowest?.name || 'lowest-scoring objectives'} to advance overall maturity. With no critical gate blockers, the function can pursue a balanced improvement strategy across the weakest capability areas.`,
        evidence_ids: ['path_optimization'],
      };
    },
  },
};
