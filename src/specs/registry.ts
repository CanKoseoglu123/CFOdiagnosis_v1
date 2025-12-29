import { SPEC as SPEC_264 } from "./v2.6.4";
import { Spec } from "./types";
import { buildSpecFromContent, buildSpecWithThemes } from "./loader";

export type SpecVersion = "v2.6.4" | "v2.7.0" | "v2.8.1" | "v2.9.0";

export const DEFAULT_SPEC_VERSION: SpecVersion = "v2.9.0";

// Lazy-load v2.9.0 spec from JSON content
let _spec290: Spec | null = null;
function getSpec290(): Spec {
  if (!_spec290) {
    _spec290 = buildSpecFromContent();
  }
  return _spec290;
}

const REGISTRY: Record<SpecVersion, () => Spec> = {
  "v2.6.4": () => SPEC_264,
  "v2.7.0": () => getSpec290(), // v2.7.0+ now aliases to v2.9.0
  "v2.8.1": () => getSpec290(), // v2.8.1 aliases to v2.9.0
  "v2.9.0": () => getSpec290(),
};

export const SpecRegistry = {
  get(version: string): Spec {
    // Normalize version: add 'v' prefix if missing
    let normalizedVersion = version;
    if (version && !version.startsWith('v')) {
      normalizedVersion = `v${version}`;
    }

    const specFn = REGISTRY[normalizedVersion as SpecVersion];
    if (!specFn) {
      throw new Error(`Spec version not found: ${version} (normalized: ${normalizedVersion})`);
    }
    return specFn();
  },

  getDefault(): Spec {
    return REGISTRY[DEFAULT_SPEC_VERSION]();
  },

  // Returns spec with themes for API responses
  getWithThemes(version: string = DEFAULT_SPEC_VERSION) {
    if (version === "v2.7.0" || version === "v2.8.1" || version === "v2.9.0") {
      return buildSpecWithThemes();
    }
    return this.get(version);
  }
};
