/**
 * VS-32d: Capacity Calculation
 *
 * Calculates action capacity based on team size and bandwidth.
 * Used to set maximum actions per timeline horizon.
 */

import { CapacityResult } from './types';

const CAPACITY_CAPS = {
  low:    { '6m': 3,  '12m': 5,  '24m': 8  },
  medium: { '6m': 5,  '12m': 8,  '24m': 12 },
  high:   { '6m': 7,  '12m': 12, '24m': 18 },
};

export function calculateCapacity(
  teamSize: number | null,
  bandwidth: 'limited' | 'moderate' | 'available' | null
): CapacityResult {
  // If both unknown, default to medium
  if (!teamSize && !bandwidth) {
    return {
      band: 'medium',
      max_actions: CAPACITY_CAPS.medium,
      assumed: true,
    };
  }

  // Base capacity from team size
  let baseBand: 'low' | 'medium' | 'high';
  if (!teamSize || teamSize <= 2) baseBand = 'low';
  else if (teamSize <= 5) baseBand = 'medium';
  else baseBand = 'high';

  // Adjust for stated bandwidth
  let effectiveBand = baseBand;
  if (bandwidth === 'limited' && baseBand !== 'low') {
    effectiveBand = baseBand === 'high' ? 'medium' : 'low';
  } else if (bandwidth === 'available' && baseBand !== 'high') {
    effectiveBand = baseBand === 'low' ? 'medium' : 'high';
  }

  return {
    band: effectiveBand,
    max_actions: CAPACITY_CAPS[effectiveBand],
    assumed: false,
  };
}

export { CAPACITY_CAPS };
