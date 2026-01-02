/**
 * Context Adapter - Backward Compatibility Layer
 *
 * Handles transformation between old flat format and new v1 structured format.
 * Old runs: { company_name: "X", industry: "Y" }
 * New runs: { version: "v1", company: { name: "X", ... }, pillar: { ... } }
 */

export interface NormalizedCompany {
  name: string;
  industry: string | null;
  revenue_range: string | null;
  employee_count: string | null;
  finance_ftes: string | null;
  legal_entities: string | null;
  finance_structure: string | null;
  ownership_structure: string | null;
  change_appetite: string | null;
}

// VS26: Tool with effectiveness rating
export interface ToolWithEffectiveness {
  tool: string;
  effectiveness: 'low' | 'medium' | 'high';
}

export interface NormalizedPillar {
  tools: string[];                          // Legacy: tool names only
  tools_with_effectiveness: ToolWithEffectiveness[];  // VS26: full tool data
  other_tool: string | null;
  team_size: string | null;
  forecast_frequency: string | null;
  budget_process: string[];
  pain_points: string[];
  other_pain_point: string | null;
  user_role: string | null;
  other_role: string | null;
  additional_context: string | null;
}

export interface NormalizedContext {
  version: 'v1';
  company: NormalizedCompany;
  pillar: NormalizedPillar | null;
}

/**
 * Normalize any context format to v1 structure.
 * Safe to call on already-normalized contexts.
 */
export function normalizeContext(raw: unknown): NormalizedContext {
  // Handle null/undefined
  if (!raw || typeof raw !== 'object') {
    return createEmptyContext();
  }

  const ctx = raw as Record<string, unknown>;

  // Already v1 format - return as-is (with null coalescing for safety)
  if (ctx.version === 'v1') {
    return {
      version: 'v1',
      company: normalizeCompany(ctx.company),
      pillar: ctx.pillar ? normalizePillar(ctx.pillar) : null
    };
  }

  // Old flat format → transform
  return {
    version: 'v1',
    company: {
      name: asString(ctx.company_name) || asString(ctx.name) || 'Unknown',
      industry: asString(ctx.industry),
      revenue_range: asString(ctx.revenue_range),
      employee_count: asString(ctx.employee_count),
      finance_ftes: asString(ctx.finance_ftes) || asString(ctx.team_size),
      legal_entities: asString(ctx.legal_entities),
      finance_structure: asString(ctx.finance_structure),
      ownership_structure: asString(ctx.ownership_structure),
      change_appetite: asString(ctx.change_appetite)
    },
    pillar: ctx.systems || ctx.tools || ctx.pain_points ? {
      tools: ctx.tools
        ? (Array.isArray(ctx.tools) ? ctx.tools.filter((v: unknown): v is string => typeof v === 'string') : [String(ctx.tools)])
        : ctx.systems
          ? (Array.isArray(ctx.systems) ? ctx.systems.filter((v: unknown): v is string => typeof v === 'string') : [String(ctx.systems)])
          : [],
      other_tool: asString(ctx.other_tool),
      team_size: asString(ctx.team_size),
      forecast_frequency: asString(ctx.forecast_frequency),
      budget_process: asStringArray(ctx.budget_process) || [],
      pain_points: ctx.pain_points
        ? (Array.isArray(ctx.pain_points) ? ctx.pain_points.filter((v: unknown): v is string => typeof v === 'string') : [String(ctx.pain_points)])
        : [],
      other_pain_point: asString(ctx.other_pain_point),
      user_role: asString(ctx.user_role),
      other_role: asString(ctx.other_role),
      additional_context: asString(ctx.additional_context) || asString(ctx.ongoing_projects)
    } : null
  };
}

/**
 * Normalize company object with null safety
 */
function normalizeCompany(raw: unknown): NormalizedCompany {
  if (!raw || typeof raw !== 'object') {
    return {
      name: 'Unknown',
      industry: null,
      revenue_range: null,
      employee_count: null,
      finance_ftes: null,
      legal_entities: null,
      finance_structure: null,
      ownership_structure: null,
      change_appetite: null
    };
  }

  const c = raw as Record<string, unknown>;
  return {
    name: asString(c.name) || 'Unknown',
    industry: asString(c.industry),
    revenue_range: asString(c.revenue_range),
    employee_count: asString(c.employee_count),
    finance_ftes: asString(c.finance_ftes),
    legal_entities: asString(c.legal_entities),
    finance_structure: asString(c.finance_structure),
    ownership_structure: asString(c.ownership_structure),
    change_appetite: asString(c.change_appetite)
  };
}

/**
 * Normalize pillar object with null safety
 * VS26: Handles both old (string[]) and new ({tool, effectiveness}[]) tool formats
 */
function normalizePillar(raw: unknown): NormalizedPillar {
  if (!raw || typeof raw !== 'object') {
    return {
      tools: [],
      tools_with_effectiveness: [],
      other_tool: null,
      team_size: null,
      forecast_frequency: null,
      budget_process: [],
      pain_points: [],
      other_pain_point: null,
      user_role: null,
      other_role: null,
      additional_context: null
    };
  }

  const p = raw as Record<string, unknown>;

  // VS26: Parse tools - handle both formats
  const rawTools = p.tools || p.systems;
  let tools: string[] = [];
  let toolsWithEffectiveness: ToolWithEffectiveness[] = [];

  if (Array.isArray(rawTools) && rawTools.length > 0) {
    if (typeof rawTools[0] === 'object' && rawTools[0] !== null && 'tool' in rawTools[0]) {
      // New format: [{tool: 'excel', effectiveness: 'medium'}, ...]
      toolsWithEffectiveness = rawTools
        .filter((t): t is { tool: string; effectiveness?: string } =>
          typeof t === 'object' && t !== null && typeof t.tool === 'string'
        )
        .map(t => ({
          tool: t.tool,
          effectiveness: (t.effectiveness === 'low' || t.effectiveness === 'high' ? t.effectiveness : 'medium') as 'low' | 'medium' | 'high'
        }));
      tools = toolsWithEffectiveness.map(t => t.tool);
    } else {
      // Old format: ['excel', 'datarails', ...]
      tools = rawTools.filter((v): v is string => typeof v === 'string');
      toolsWithEffectiveness = tools.map(t => ({ tool: t, effectiveness: 'medium' as const }));
    }
  }

  return {
    tools,
    tools_with_effectiveness: toolsWithEffectiveness,
    other_tool: asString(p.other_tool),
    team_size: asString(p.team_size),
    forecast_frequency: asString(p.forecast_frequency),
    budget_process: asStringArray(p.budget_process) || [],
    pain_points: asStringArray(p.pain_points) || [],
    other_pain_point: asString(p.other_pain_point),
    user_role: asString(p.user_role),
    other_role: asString(p.other_role),
    additional_context: asString(p.additional_context)
  };
}

/**
 * Create empty context with defaults
 */
function createEmptyContext(): NormalizedContext {
  return {
    version: 'v1',
    company: {
      name: 'Unknown',
      industry: null,
      revenue_range: null,
      employee_count: null,
      finance_ftes: null,
      legal_entities: null,
      finance_structure: null,
      ownership_structure: null,
      change_appetite: null
    },
    pillar: null
  };
}

/**
 * Safe string extraction
 */
function asString(val: unknown): string | null {
  if (typeof val === 'string' && val.trim()) {
    return val;
  }
  return null;
}

/**
 * Safe string array extraction
 */
function asStringArray(val: unknown): string[] | null {
  if (Array.isArray(val)) {
    return val.filter((v): v is string => typeof v === 'string');
  }
  if (typeof val === 'string' && val.trim()) {
    return [val];
  }
  return null;
}
