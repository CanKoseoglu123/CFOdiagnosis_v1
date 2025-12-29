/**
 * VS-32c: FP&A Question Exemplars
 *
 * These are STYLE GUIDANCE for the Critic to generate clarifying questions.
 * The Critic generates fresh questions per gap — these are NOT a selection bank.
 */

import { QuestionExemplar } from '../../types';

export const FPA_QUESTION_EXEMPLARS: QuestionExemplar[] = [
  {
    context_type: 'team_capacity',
    yes_no_example:
      'Is your FP&A team able to take on improvement projects alongside day-to-day operations?',
    when_to_ask: "When draft mentions execution challenges but doesn't explain capacity constraints",
  },

  {
    context_type: 'team_bandwidth',
    yes_no_example: 'Does your team regularly work overtime during close and forecast cycles?',
    when_to_ask: 'When recommending initiatives but unsure if team is already stretched',
  },

  {
    context_type: 'forecast_frequency',
    yes_no_example: 'Does your team update forecasts at least monthly?',
    mcq_example: {
      question: 'How frequently does your team update forecasts?',
      options: ['Monthly or more', 'Quarterly', 'Annually', 'No regular cadence'],
    },
    when_to_ask: "When forecasting score is low but draft doesn't explain process maturity",
  },

  {
    context_type: 'tool_barrier',
    yes_no_example: 'Is spreadsheet reliance a barrier to improving your forecasting?',
    mcq_example: {
      question: 'What primarily prevents driver-based forecasting?',
      options: ['Tool limitations', 'Data availability', 'Skills gap', 'Time/bandwidth', 'Not a priority'],
    },
    when_to_ask: 'When a gap exists but root cause would change the recommendation',
  },

  {
    context_type: 'erp_status',
    yes_no_example: 'Is an ERP implementation or upgrade currently in progress?',
    when_to_ask: 'When recommendations involve system changes without knowing current initiatives',
  },

  {
    context_type: 'improvement_priority',
    yes_no_example: 'Is improving forecasting accuracy a stated priority for leadership?',
    when_to_ask: 'When assessing whether low-scoring objective aligns with business priority',
  },

  {
    context_type: 'data_quality',
    yes_no_example: 'Do data quality issues regularly delay your close or reporting?',
    when_to_ask: 'When variance or reporting scores are low but cause is unclear',
  },

  {
    context_type: 'scenario_planning',
    yes_no_example: 'Has your team performed scenario analysis in the past 12 months?',
    when_to_ask: "When scenario modeling scores low but it's unclear if this is capability vs priority",
  },

  {
    context_type: 'stakeholder_demand',
    yes_no_example: 'Do business partners frequently request ad-hoc analyses?',
    when_to_ask: 'When evaluating team bandwidth and capacity for structured improvements',
  },

  {
    context_type: 'centralization',
    yes_no_example: 'Is FP&A centralized or distributed across business units?',
    mcq_example: {
      question: 'How is FP&A organized in your company?',
      options: [
        'Fully centralized',
        'Centralized with embedded partners',
        'Federated/distributed',
        'Mixed/transitioning',
      ],
    },
    when_to_ask: 'When recommendations depend on organizational structure',
  },

  {
    context_type: 'analytics_maturity',
    yes_no_example: 'Does your team use any predictive or advanced analytics tools?',
    when_to_ask: 'When Level 4 recommendations might be premature',
  },

  {
    context_type: 'process_documentation',
    yes_no_example: 'Are your key FP&A processes documented?',
    when_to_ask: 'When controls or consistency issues are flagged but cause is unclear',
  },
];

/**
 * Get exemplars for a specific context type
 */
export function getExemplarByType(contextType: string): QuestionExemplar | null {
  return FPA_QUESTION_EXEMPLARS.find((e) => e.context_type === contextType) || null;
}

/**
 * Get all context types for prompt injection
 */
export function getAllContextTypes(): string[] {
  return FPA_QUESTION_EXEMPLARS.map((e) => e.context_type);
}

/**
 * Format exemplars for prompt injection
 */
export function formatExemplarsForPrompt(): string {
  return FPA_QUESTION_EXEMPLARS.map(
    (e) => `• ${e.context_type}: "${e.yes_no_example}"`
  ).join('\n');
}
