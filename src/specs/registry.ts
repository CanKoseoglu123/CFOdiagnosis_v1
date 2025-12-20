import { SPEC as SPEC_264 } from "./v2.6.4";
import { SPEC as SPEC_270, specV270WithThemes } from "./v2.7.0";
import { Spec } from "./types";

export type SpecVersion = "v2.6.4" | "v2.7.0";

export const DEFAULT_SPEC_VERSION: SpecVersion = "v2.7.0";

const REGISTRY: Record<SpecVersion, Spec> = {
  "v2.6.4": SPEC_264,
  "v2.7.0": SPEC_270,
};

export const SpecRegistry = {
  get(version: string): Spec {
    const spec = REGISTRY[version as SpecVersion];
    if (!spec) {
      throw new Error(`Spec version not found: ${version}`);
    }
    return spec;
  },

  getDefault(): Spec {
    return REGISTRY[DEFAULT_SPEC_VERSION];
  },

  // Returns spec with themes for API responses
  getWithThemes(version: string = DEFAULT_SPEC_VERSION) {
    if (version === "v2.7.0") {
      return specV270WithThemes;
    }
    return this.get(version);
  }
};
