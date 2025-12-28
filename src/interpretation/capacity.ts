/**
 * VS-32: Capacity Calculation
 *
 * Calculates team capacity band based on team size and bandwidth.
 * Used to determine how many initiatives can be realistically pursued.
 */

import { CapacityBand, CapacityConfig, PlanningContext } from './pillars/types';

// ============================================================
// DEFAULT CAPACITY CONFIGURATION
// ============================================================

export const DEFAULT_CAPACITY_CONFIG: CapacityConfig = {
  team_size_thresholds: {
    small: 5,   // <= 5 people = small team
    medium: 15, // <= 15 people = medium team
    // > 15 people = large team
  },

  bandwidth_levels: ['minimal', 'limited', 'moderate', 'significant'],

  // Matrix: team_size × bandwidth → capacity_band
  capacity_matrix: {
    small: {
      minimal: 'constrained',
      limited: 'constrained',
      moderate: 'moderate',
      significant: 'moderate',
    },
    medium: {
      minimal: 'constrained',
      limited: 'moderate',
      moderate: 'moderate',
      significant: 'resourced',
    },
    large: {
      minimal: 'moderate',
      limited: 'moderate',
      moderate: 'resourced',
      significant: 'resourced',
    },
  },

  // Maximum initiatives per capacity band per horizon
  max_initiatives: {
    constrained: {
      '6m': 2,
      '12m': 3,
      '24m': 5,
    },
    moderate: {
      '6m': 3,
      '12m': 5,
      '24m': 8,
    },
    resourced: {
      '6m': 5,
      '12m': 8,
      '24m': 12,
    },
  },
};

// ============================================================
// CAPACITY CALCULATION FUNCTIONS
// ============================================================

/**
 * Determine team size category.
 */
export function getTeamSizeCategory(
  teamSize: number,
  config: CapacityConfig = DEFAULT_CAPACITY_CONFIG
): 'small' | 'medium' | 'large' {
  if (teamSize <= config.team_size_thresholds.small) {
    return 'small';
  } else if (teamSize <= config.team_size_thresholds.medium) {
    return 'medium';
  }
  return 'large';
}

/**
 * Calculate capacity band from team size and bandwidth.
 */
export function calculateCapacityBand(
  teamSize: number,
  bandwidth: 'minimal' | 'limited' | 'moderate' | 'significant',
  config: CapacityConfig = DEFAULT_CAPACITY_CONFIG
): CapacityBand {
  const sizeCategory = getTeamSizeCategory(teamSize, config);
  return config.capacity_matrix[sizeCategory][bandwidth];
}

/**
 * Get maximum initiatives for a capacity band and time horizon.
 */
export function getMaxInitiatives(
  capacityBand: CapacityBand,
  timeHorizon: '6m' | '12m' | '24m',
  config: CapacityConfig = DEFAULT_CAPACITY_CONFIG
): number {
  return config.max_initiatives[capacityBand][timeHorizon];
}

/**
 * Build complete planning context with calculated capacity.
 */
export function buildPlanningContext(
  targetLevel: number,
  bandwidth: 'minimal' | 'limited' | 'moderate' | 'significant',
  teamSize: number,
  focusAreas: string[],
  timeHorizon: '6m' | '12m' | '24m',
  constraints?: string
): PlanningContext {
  const capacityBand = calculateCapacityBand(teamSize, bandwidth);

  return {
    target_level: targetLevel,
    bandwidth,
    team_size: teamSize,
    focus_areas: focusAreas,
    time_horizon: timeHorizon,
    constraints,
    capacity_band: capacityBand,
  };
}

// ============================================================
// CAPACITY ANALYSIS
// ============================================================

/**
 * Detailed capacity analysis for planning.
 */
export interface CapacityAnalysis {
  /** Calculated capacity band */
  capacity_band: CapacityBand;

  /** Team size category */
  team_size_category: 'small' | 'medium' | 'large';

  /** Maximum initiatives by horizon */
  max_initiatives: {
    '6m': number;
    '12m': number;
    '24m': number;
  };

  /** Recommended initiative distribution */
  recommended_distribution: {
    quick_wins: number;
    short_term: number;
    medium_term: number;
    strategic: number;
  };

  /** Capacity utilization guidance */
  guidance: string;

  /** Risk factors based on capacity */
  risk_factors: string[];
}

/**
 * Generate comprehensive capacity analysis.
 */
export function analyzeCapacity(
  teamSize: number,
  bandwidth: 'minimal' | 'limited' | 'moderate' | 'significant',
  timeHorizon: '6m' | '12m' | '24m',
  config: CapacityConfig = DEFAULT_CAPACITY_CONFIG
): CapacityAnalysis {
  const capacityBand = calculateCapacityBand(teamSize, bandwidth, config);
  const teamSizeCategory = getTeamSizeCategory(teamSize, config);

  const maxInit = {
    '6m': getMaxInitiatives(capacityBand, '6m', config),
    '12m': getMaxInitiatives(capacityBand, '12m', config),
    '24m': getMaxInitiatives(capacityBand, '24m', config),
  };

  // Calculate recommended distribution based on horizon
  let distribution: CapacityAnalysis['recommended_distribution'];
  const totalMax = maxInit[timeHorizon];

  if (timeHorizon === '6m') {
    distribution = {
      quick_wins: Math.ceil(totalMax * 0.6),
      short_term: Math.floor(totalMax * 0.4),
      medium_term: 0,
      strategic: 0,
    };
  } else if (timeHorizon === '12m') {
    distribution = {
      quick_wins: Math.ceil(totalMax * 0.3),
      short_term: Math.ceil(totalMax * 0.4),
      medium_term: Math.floor(totalMax * 0.3),
      strategic: 0,
    };
  } else {
    distribution = {
      quick_wins: Math.ceil(totalMax * 0.2),
      short_term: Math.ceil(totalMax * 0.25),
      medium_term: Math.ceil(totalMax * 0.3),
      strategic: Math.floor(totalMax * 0.25),
    };
  }

  // Generate guidance based on capacity
  let guidance: string;
  const riskFactors: string[] = [];

  if (capacityBand === 'constrained') {
    guidance = 'Focus on high-impact quick wins. Avoid overcommitting. Sequential implementation recommended.';
    riskFactors.push('Limited capacity for parallel initiatives');
    riskFactors.push('Change fatigue risk if overloaded');
    riskFactors.push('Consider external support for major initiatives');
  } else if (capacityBand === 'moderate') {
    guidance = 'Balance quick wins with strategic initiatives. Some parallel execution possible with careful prioritization.';
    riskFactors.push('Risk of spreading resources too thin');
    riskFactors.push('Need clear prioritization framework');
  } else {
    guidance = 'Capacity supports ambitious transformation agenda. Can pursue multiple tracks in parallel.';
    riskFactors.push('Coordination complexity with multiple initiatives');
    riskFactors.push('Risk of scope creep without strong governance');
  }

  // Add bandwidth-specific risks
  if (bandwidth === 'minimal' || bandwidth === 'limited') {
    riskFactors.push('Limited bandwidth may delay initiative progress');
    riskFactors.push('Consider phased approach with clear milestones');
  }

  return {
    capacity_band: capacityBand,
    team_size_category: teamSizeCategory,
    max_initiatives: maxInit,
    recommended_distribution: distribution,
    guidance,
    risk_factors: riskFactors,
  };
}

// ============================================================
// INITIATIVE FEASIBILITY CHECK
// ============================================================

/**
 * Check if a proposed initiative count is feasible.
 */
export function checkInitiativeFeasibility(
  proposedCount: number,
  capacityBand: CapacityBand,
  timeHorizon: '6m' | '12m' | '24m',
  config: CapacityConfig = DEFAULT_CAPACITY_CONFIG
): {
  feasible: boolean;
  maxAllowed: number;
  utilizationPercent: number;
  recommendation: string;
} {
  const maxAllowed = getMaxInitiatives(capacityBand, timeHorizon, config);
  const utilizationPercent = Math.round((proposedCount / maxAllowed) * 100);

  let recommendation: string;
  let feasible: boolean;

  if (proposedCount <= maxAllowed * 0.7) {
    feasible = true;
    recommendation = 'Healthy capacity buffer. Room for unexpected priorities or scope expansion.';
  } else if (proposedCount <= maxAllowed) {
    feasible = true;
    recommendation = 'Near capacity limit. Recommend strict scope control and regular capacity reviews.';
  } else {
    feasible = false;
    recommendation = `Exceeds capacity by ${proposedCount - maxAllowed} initiative(s). Consider reducing scope, extending timeline, or adding resources.`;
  }

  return {
    feasible,
    maxAllowed,
    utilizationPercent: Math.min(utilizationPercent, 100),
    recommendation,
  };
}

// ============================================================
// CAPACITY BAND DESCRIPTIONS
// ============================================================

/**
 * Get human-readable description of capacity band.
 */
export function getCapacityBandDescription(band: CapacityBand): {
  name: string;
  description: string;
  characteristics: string[];
} {
  const descriptions: Record<CapacityBand, ReturnType<typeof getCapacityBandDescription>> = {
    constrained: {
      name: 'Constrained',
      description: 'Limited capacity for new initiatives. Focus on essentials.',
      characteristics: [
        'Sequential implementation preferred',
        'Maximum 2-3 active initiatives',
        'Heavy reliance on quick wins',
        'External support may be needed for major changes',
      ],
    },
    moderate: {
      name: 'Moderate',
      description: 'Balanced capacity with room for selective investment.',
      characteristics: [
        'Some parallel execution possible',
        'Can handle 4-5 active initiatives',
        'Mix of quick wins and strategic projects',
        'Regular prioritization reviews recommended',
      ],
    },
    resourced: {
      name: 'Well-Resourced',
      description: 'Strong capacity to pursue ambitious transformation agenda.',
      characteristics: [
        'Multiple parallel workstreams feasible',
        'Can handle 6+ active initiatives',
        'Full spectrum from quick wins to strategic transformation',
        'Governance becomes critical success factor',
      ],
    },
  };

  return descriptions[band];
}
