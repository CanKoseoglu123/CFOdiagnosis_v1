import { SPEC as SPEC_264 } from "./v2.6.4";
import { Spec } from "./types";
import { buildSpecFromContent, buildSpecWithThemes } from "./loader";

export type SpecVersion = "v2.6.4" | "v2.7.0" | "v2.8.1";

export const DEFAULT_SPEC_VERSION: SpecVersion = "v2.8.1";

// Lazy-load v2.8.1 spec from JSON content
let _spec281: Spec | null = null;
function getSpec281(): Spec {
  if (!_spec281) {
    _spec281 = buildSpecFromContent();
  }
  return _spec281;
}

const REGISTRY: Record<SpecVersion, () => Spec> = {
  "v2.6.4": () => SPEC_264,
  "v2.7.0": () => getSpec281(), // v2.7.0 now aliases to v2.8.1
  "v2.8.1": () => getSpec281(),
};

export const SpecRegistry = {
  get(version: string): Spec {
    const specFn = REGISTRY[version as SpecVersion];
    if (!specFn) {
      throw new Error(`Spec version not found: ${version}`);
    }
    return specFn();
  },

  getDefault(): Spec {
    return REGISTRY[DEFAULT_SPEC_VERSION]();
  },

  // Returns spec with themes for API responses
  getWithThemes(version: string = DEFAULT_SPEC_VERSION) {
    if (version === "v2.7.0" || version === "v2.8.1") {
      return buildSpecWithThemes();
    }
    return this.get(version);
  }
};
