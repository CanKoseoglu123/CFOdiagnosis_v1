// src/actions/index.ts
// Public API for the actions module

export { deriveActions } from "./derive";
export { deriveActionsFromObjectives } from "./deriveFromObjectives";  // VS20
export { prioritizeActions, groupActionsByInitiative } from "./prioritizeActions";  // V2.1
export type { ActionPlanItem, DerivedAction, PrioritizedAction, PrioritizedInitiative } from "./types";
