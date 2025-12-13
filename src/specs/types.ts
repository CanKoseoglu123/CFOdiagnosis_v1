export interface SpecQuestion {
  id: string;
  pillar: string;
  weight: number;
}

export interface SpecPillar {
  id: string;
  weight: number;
}

export interface Spec {
  version: string;
  questions: SpecQuestion[];
  pillars: SpecPillar[];
}
