/**
 * VS-32: FP&A Question Exemplars
 *
 * Style guide for AI-generated clarifying questions.
 * Provides examples of good question formats specific to FP&A context.
 */

import { QuestionExemplar } from '../types';

/**
 * FP&A-specific question style exemplars.
 */
export const FPA_QUESTION_EXEMPLARS: QuestionExemplar[] = [
  // ============================================================
  // CAPACITY & RESOURCE QUESTIONS
  // ============================================================
  {
    context_type: 'team_capacity',
    yes_no_example: 'Is your FP&A team able to dedicate at least 20% of their time to new initiatives over the next 6 months?',
    mcq_example: {
      question: 'What best describes your team\'s current bandwidth for improvement initiatives?',
      options: [
        'Fully committed to daily operations',
        'Can spare 1-2 days per month',
        'Can dedicate 1-2 days per week',
        'Have dedicated improvement capacity',
      ],
    },
    when_to_ask: 'When the report needs to calibrate recommendation intensity based on resource availability.',
    resolves_evidence_types: ['ctx_'],
  },

  {
    context_type: 'tool_availability',
    yes_no_example: 'Do you currently have access to a planning tool beyond Excel (e.g., Adaptive, Anaplan, Workday)?',
    mcq_example: {
      question: 'Which planning tools does your team currently use?',
      options: [
        'Primarily Excel/Google Sheets',
        'Excel plus a visualization tool (Power BI, Tableau)',
        'Dedicated planning tool (Adaptive, Anaplan, etc.)',
        'Integrated ERP planning module',
      ],
    },
    when_to_ask: 'When assessing readiness for advanced planning practices.',
    resolves_evidence_types: ['ctx_', 'prac_'],
  },

  // ============================================================
  // PROCESS MATURITY QUESTIONS
  // ============================================================
  {
    context_type: 'forecast_process',
    yes_no_example: 'Does your organization update the forecast at least quarterly?',
    mcq_example: {
      question: 'How frequently does your team update the financial forecast?',
      options: [
        'Annually with the budget',
        'Quarterly',
        'Monthly',
        'Weekly or rolling',
      ],
    },
    when_to_ask: 'When the forecast maturity score seems inconsistent with described practices.',
    resolves_evidence_types: ['prac_', 'obj_'],
  },

  {
    context_type: 'variance_analysis',
    yes_no_example: 'Are your monthly variance analyses completed within 5 business days of month-end close?',
    when_to_ask: 'When variance analysis practice needs context on cycle time.',
    resolves_evidence_types: ['prac_', 'q_'],
  },

  // ============================================================
  // STRATEGIC INTENT QUESTIONS
  // ============================================================
  {
    context_type: 'transformation_priority',
    yes_no_example: 'Is improving forecast accuracy a top-3 priority for your CFO this year?',
    mcq_example: {
      question: 'Which area is the highest priority for FP&A improvement?',
      options: [
        'Reducing close and reporting cycle time',
        'Improving forecast accuracy',
        'Implementing driver-based planning',
        'Enhancing business partnership',
      ],
    },
    when_to_ask: 'When prioritizing recommendations across multiple improvement areas.',
    resolves_evidence_types: ['ctx_', 'imp_'],
  },

  {
    context_type: 'stakeholder_alignment',
    yes_no_example: 'Does your executive team actively use FP&A outputs for decision-making?',
    when_to_ask: 'When assessing the strategic impact of FP&A improvements.',
    resolves_evidence_types: ['ctx_', 'obj_'],
  },

  // ============================================================
  // CONTEXT CLARIFICATION QUESTIONS
  // ============================================================
  {
    context_type: 'critical_gap_context',
    yes_no_example: 'Is the gap in variance analysis processes due to resource constraints rather than process design?',
    mcq_example: {
      question: 'What is the primary barrier to implementing more structured variance analysis?',
      options: [
        'Lack of time/resources',
        'No clear process ownership',
        'Data availability issues',
        'Tool limitations',
      ],
    },
    when_to_ask: 'When a critical gap needs context to frame appropriate recommendations.',
    resolves_evidence_types: ['critical_', 'prac_'],
  },

  {
    context_type: 'industry_specific',
    yes_no_example: 'Does your industry have specific regulatory requirements that affect FP&A processes?',
    when_to_ask: 'When industry context might significantly impact recommendations.',
    resolves_evidence_types: ['ctx_'],
  },

  // ============================================================
  // IMPLEMENTATION READINESS QUESTIONS
  // ============================================================
  {
    context_type: 'change_readiness',
    yes_no_example: 'Has your organization successfully completed a finance transformation initiative in the past 2 years?',
    mcq_example: {
      question: 'How would you describe your organization\'s appetite for process change?',
      options: [
        'Conservative - prefer incremental changes',
        'Moderate - open to change with proven ROI',
        'Progressive - actively seeking improvements',
        'Aggressive - pursuing major transformation',
      ],
    },
    when_to_ask: 'When calibrating the aggressiveness of recommendations.',
    resolves_evidence_types: ['ctx_'],
  },
];

// ============================================================
// QUESTION RULES
// ============================================================

/**
 * Rules for generating clarifying questions.
 * These are enforced in the Critic agent prompt.
 */
export const CLARIFYING_QUESTION_RULES = {
  // Format preferences
  format: {
    prefer_yes_no: true,
    yes_no_ratio: 0.7,  // 70% should be Yes/No
    max_mcq_options: 4,
    include_other_option: true,  // MCQs should have "Other" option
  },

  // Content rules
  content: {
    never_repeat_diagnostic_questions: true,
    must_explain_rationale: true,
    must_cite_related_evidence: true,
    focus_on_gaps_not_validation: true,
  },

  // Limits
  limits: {
    max_per_round: 3,
    max_total: 5,
    min_severity_to_ask: 3,  // Only ask about gaps with severity >= 3
  },

  // Question quality checks
  quality: {
    max_words: 25,  // Questions should be concise
    must_be_actionable: true,  // Answer should inform the report
    no_leading_questions: true,
    no_compound_questions: true,
  },
};

/**
 * Get a random exemplar for a given context type.
 */
export function getExemplarByType(contextType: string): QuestionExemplar | null {
  return FPA_QUESTION_EXEMPLARS.find(e => e.context_type === contextType) || null;
}

/**
 * Get all exemplars that help resolve a given evidence type.
 */
export function getExemplarsByEvidenceType(evidenceType: string): QuestionExemplar[] {
  return FPA_QUESTION_EXEMPLARS.filter(
    e => e.resolves_evidence_types?.includes(evidenceType as any)
  );
}

/**
 * Format question exemplars for inclusion in AI prompt.
 */
export function formatExemplarsForPrompt(): string {
  const lines: string[] = [
    '## Question Style Examples',
    '',
    'When generating clarifying questions, follow these style examples:',
    '',
  ];

  for (const exemplar of FPA_QUESTION_EXEMPLARS) {
    lines.push(`### ${exemplar.context_type}`);
    lines.push(`Yes/No: "${exemplar.yes_no_example}"`);

    if (exemplar.mcq_example) {
      lines.push(`MCQ: "${exemplar.mcq_example.question}"`);
      lines.push('Options:');
      exemplar.mcq_example.options.forEach((opt, i) => {
        lines.push(`  ${i + 1}. ${opt}`);
      });
    }

    lines.push(`When to ask: ${exemplar.when_to_ask}`);
    lines.push('');
  }

  lines.push('## Question Rules');
  lines.push('- Prefer Yes/No questions (70% of questions)');
  lines.push('- MCQs should have exactly 4 options plus "Other"');
  lines.push('- NEVER repeat questions from the diagnostic assessment');
  lines.push('- Each question must explain WHY it is being asked');
  lines.push('- Questions must be under 25 words');
  lines.push('- Avoid leading questions');
  lines.push('- Avoid compound questions (one topic per question)');

  return lines.join('\n');
}
