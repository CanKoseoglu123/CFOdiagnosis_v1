import { SPEC_v2_6_4 } from "./v2.6.4";

export type Spec = typeof SPEC_v2_6_4;

export const SpecRegistry = {
  get(version: string): Spec {
    switch (version) {
      case "v2.6.4":
        return SPEC_v2_6_4;

      default:
        throw new Error(`Unknown or unsupported SPEC version: ${version}`);
    }
  },
};
