import { SPEC as SPEC_264 } from "./v2.6.4";
import { Spec } from "./types";

export type SpecVersion = "v2.6.4";

const REGISTRY: Record<SpecVersion, Spec> = {
  "v2.6.4": SPEC_264,
};

export const SpecRegistry = {
  get(version: string): Spec {
    const spec = REGISTRY[version as SpecVersion];
    if (!spec) {
      throw new Error(`Spec version not found: ${version}`);
    }
    return spec;
  },
};
