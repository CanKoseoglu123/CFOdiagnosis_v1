// Mock RPC responses matching SQL function return shapes

export const MOCK_OVERVIEW = {
  total_visitors: 467,
  total_page_views: 1523,
  unique_sessions: 347,
  today: 12,
  today_page_views: 23,
  period: 347,
  period_page_views: 1523,
  previous_period: 310,
  visitors_by_day: [
    { date: '2026-01-25', count: 45, unique_sessions: 32 },
    { date: '2026-01-26', count: 52, unique_sessions: 38 },
    { date: '2026-01-27', count: 48, unique_sessions: 35 },
  ],
  devices: { desktop: 612, mobile: 231, tablet: 49 },
  referrers: [
    { domain: 'google.com', count: 234 },
    { domain: 'linkedin.com', count: 89 },
  ],
  new_vs_returning: { new: 654, returning: 238 },
};

export const MOCK_FUNNEL = {
  steps: [
    { name: 'intro', count: 500, conversion_pct: null },
    { name: 'company_setup', count: 420, conversion_pct: 84.0 },
    { name: 'persona', count: 380, conversion_pct: 90.5 },
    { name: 'pillar_setup', count: 350, conversion_pct: 92.1 },
    { name: 'assessment', count: 280, conversion_pct: 80.0 },
    { name: 'calibration', count: 190, conversion_pct: 67.9 },
    { name: 'report', count: 160, conversion_pct: 84.2 },
    { name: 'finalized', count: 120, conversion_pct: 75.0 },
  ],
  completion_rate: 24.0,
  avg_time_to_complete: 4.5,
};

export const MOCK_ASSESSMENT = {
  persona_distribution: [
    { persona: 'Growth Navigator', count: 45 },
    { persona: 'Efficiency Architect', count: 38 },
    { persona: 'Risk Guardian', count: 22 },
  ],
  industry_distribution: [
    { industry: 'Technology', count: 67 },
    { industry: 'Manufacturing', count: 34 },
  ],
  revenue_distribution: [
    { range: '$10M-$50M', count: 42 },
    { range: '$50M-$200M', count: 31 },
  ],
  progress_distribution: [
    { bucket: '0-25', count: 120 },
    { bucket: '25-50', count: 85 },
    { bucket: '50-75', count: 60 },
    { bucket: '75-100', count: 45 },
  ],
  completion_rate: 14.5,
  avg_completion_time_hours: 3.2,
};

export const MOCK_GEO = {
  country_breakdown: [
    { country: 'United States', country_code: 'US', count: 523, unique_sessions: 312 },
    { country: 'United Kingdom', country_code: 'GB', count: 187, unique_sessions: 134 },
  ],
  city_breakdown: [
    { city: 'New York', region: 'New York', country: 'United States', count: 89 },
    { city: 'London', region: 'England', country: 'United Kingdom', count: 67 },
  ],
};

export const MOCK_SUBSCRIPTIONS = {
  total_users: 892,
  paid_users: 45,
  free_users: 832,
  override_users: 15,
  mrr: 225000,
  conversion_rate: 0.05,
  churn_count: 3,
  subscriptions_by_month: [
    { month: '2025-11', count: 8 },
    { month: '2025-12', count: 12 },
    { month: '2026-01', count: 15 },
  ],
};

export const MOCK_ACTIVITY = [
  { event_type: 'signup' as const, detail: 'user@example.com', created_at: '2026-01-31T14:30:00Z' },
  { event_type: 'run_created' as const, detail: 'user@example.com', created_at: '2026-01-31T14:25:00Z' },
  { event_type: 'visit' as const, detail: 'US - /diagnostic', created_at: '2026-01-31T14:20:00Z' },
];

// Empty versions for edge case testing
export const MOCK_OVERVIEW_EMPTY = {
  total_visitors: 0,
  total_page_views: 0,
  unique_sessions: 0,
  today: 0,
  today_page_views: 0,
  period: 0,
  period_page_views: 0,
  previous_period: 0,
  visitors_by_day: [],
  devices: { desktop: 0, mobile: 0, tablet: 0 },
  referrers: [],
  new_vs_returning: { new: 0, returning: 0 },
};

export const MOCK_FUNNEL_EMPTY = {
  steps: [],
  completion_rate: 0,
  avg_time_to_complete: null,
};
