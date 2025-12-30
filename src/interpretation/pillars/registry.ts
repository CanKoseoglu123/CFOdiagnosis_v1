/**
 * VS-32: Pillar Pack Registry
 */

import { PillarPack, FPA_PACK } from './fpa/config';

const PACKS: Record<string, PillarPack> = {
  fpa: FPA_PACK,
};

export function getPillarPack(pillarId: string): PillarPack {
  const pack = PACKS[pillarId];
  if (!pack) {
    throw new Error(`Unknown pillar: ${pillarId}`);
  }
  return pack;
}

export type { PillarPack, SectionConfig } from './fpa/config';
