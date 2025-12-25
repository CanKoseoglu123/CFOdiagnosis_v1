/**
 * VS-24 Content Integrity Tests
 *
 * Validates JSON content files and cross-references.
 * Ensures build fails on invalid content.
 */

import {
  loadQuestions,
  loadPractices,
  loadInitiatives,
  loadObjectives,
  loadGates,
  validateCrossReferences,
  getCriticalQuestions,
  getQuestionsByLevel
} from '../specs/loader';

// ============================================================
// Test Utilities
// ============================================================

let passed = 0;
let failed = 0;

function assertEqual<T>(actual: T, expected: T, testName: string): void {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);

  if (actualStr === expectedStr) {
    console.log(`✅ ${testName}`);
    passed++;
  } else {
    console.log(`❌ ${testName}`);
    console.log(`   Expected: ${expectedStr}`);
    console.log(`   Actual:   ${actualStr}`);
    failed++;
  }
}

function assertTrue(condition: boolean, testName: string): void {
  if (condition) {
    console.log(`✅ ${testName}`);
    passed++;
  } else {
    console.log(`❌ ${testName}`);
    failed++;
  }
}

function assertNoThrow(fn: () => void, testName: string): void {
  try {
    fn();
    console.log(`✅ ${testName}`);
    passed++;
  } catch (e) {
    console.log(`❌ ${testName}`);
    console.log(`   Error: ${(e as Error).message}`);
    failed++;
  }
}

// ============================================================
// Tests
// ============================================================

console.log('');
console.log('========================================');
console.log('VS-24 Content Integrity Tests');
console.log('========================================');
console.log('');

// --- Content Loading ---
console.log('--- Content Loading ---');

const questions = loadQuestions();
assertEqual(questions.length, 48, 'Loads exactly 48 questions');

const practices = loadPractices();
assertEqual(practices.length, 28, 'Loads exactly 28 practices');  // VS-26: Expanded

const initiatives = loadInitiatives();
assertEqual(initiatives.length, 9, 'Loads exactly 9 initiatives');

const objectives = loadObjectives();
assertEqual(objectives.length, 9, 'Loads exactly 9 objectives');  // VS-26: Expanded

const gates = loadGates();
assertEqual(gates.critical_gates.l1_to_l2.length, 4, 'L1→L2 gate has 4 critical questions');
assertEqual(gates.critical_gates.l2_to_l3.length, 4, 'L2→L3 gate has 4 critical questions');

// --- Unique IDs ---
console.log('');
console.log('--- Unique IDs ---');

const questionIds = questions.map(q => q.id);
assertEqual(new Set(questionIds).size, questionIds.length, 'No duplicate question IDs');

const practiceIds = practices.map(p => p.id);
assertEqual(new Set(practiceIds).size, practiceIds.length, 'No duplicate practice IDs');

const initiativeIds = initiatives.map(i => i.id);
assertEqual(new Set(initiativeIds).size, initiativeIds.length, 'No duplicate initiative IDs');

const objectiveIds = objectives.map(o => o.id);
assertEqual(new Set(objectiveIds).size, objectiveIds.length, 'No duplicate objective IDs');

// --- Cross-References ---
console.log('');
console.log('--- Cross-References ---');

assertNoThrow(() => validateCrossReferences(), 'All cross-references are valid');

// --- Critical Questions ---
console.log('');
console.log('--- Critical Questions ---');

const criticals = getCriticalQuestions();
assertEqual(criticals.length, 8, 'Exactly 8 critical questions');

const l1Criticals = criticals.filter(q => q.maturity_level === 1);
assertEqual(l1Criticals.length, 4, 'L1 has 4 critical questions');

const l2Criticals = criticals.filter(q => q.maturity_level === 2);
assertEqual(l2Criticals.length, 4, 'L2 has 4 critical questions');

const l3Criticals = criticals.filter(q => q.maturity_level === 3);
assertEqual(l3Criticals.length, 0, 'L3 has 0 critical questions');

const l4Criticals = criticals.filter(q => q.maturity_level === 4);
assertEqual(l4Criticals.length, 0, 'L4 has 0 critical questions');

// --- Question Distribution by Level ---
console.log('');
console.log('--- Question Distribution by Level ---');

const l1Questions = getQuestionsByLevel(1);
assertEqual(l1Questions.length, 9, 'L1 has 9 questions');

const l2Questions = getQuestionsByLevel(2);
assertEqual(l2Questions.length, 14, 'L2 has 14 questions');

const l3Questions = getQuestionsByLevel(3);
assertEqual(l3Questions.length, 15, 'L3 has 15 questions');

const l4Questions = getQuestionsByLevel(4);
assertEqual(l4Questions.length, 10, 'L4 has 10 questions');

// --- Practice Distribution by Objective ---
// VS-26: Practices no longer have level, they link to objectives
console.log('');
console.log('--- Practice Distribution by Objective ---');

// Just verify we have practices and they all have valid objective references
const allPracticesHaveObjective = practices.every(p => p.objective_id.startsWith('obj_'));
assertTrue(allPracticesHaveObjective, 'All practices reference valid objectives');

// VS-26: Practices now have 28 entries (expanded from 21)
assertTrue(practices.length >= 20, `Practices count >= 20 (got ${practices.length})`);
assertTrue(practices.length <= 35, `Practices count <= 35 (got ${practices.length})`);

// --- Initiative Theme Distribution ---
console.log('');
console.log('--- Initiative Theme Distribution ---');

const foundationInits = initiatives.filter(i => i.theme_id === 'foundation');
assertEqual(foundationInits.length, 3, 'Foundation theme has 3 initiatives');

const futureInits = initiatives.filter(i => i.theme_id === 'future');
assertEqual(futureInits.length, 2, 'Future theme has 2 initiatives');

const intelligenceInits = initiatives.filter(i => i.theme_id === 'intelligence');
assertEqual(intelligenceInits.length, 4, 'Intelligence theme has 4 initiatives');

// --- Schema Validation ---
console.log('');
console.log('--- Schema Validation ---');

// Question ID format
const validIdFormat = questions.every(q => /^fpa_l[1-4]_q\d{2}$/.test(q.id));
assertTrue(validIdFormat, 'All question IDs match format fpa_l[1-4]_q##');

// Impact/Complexity in range
const validImpact = questions.every(q => q.impact >= 1 && q.impact <= 5);
assertTrue(validImpact, 'All impact values in range 1-5');

const validComplexity = questions.every(q => q.complexity >= 1 && q.complexity <= 5);
assertTrue(validComplexity, 'All complexity values in range 1-5');

// Expert action types
const validActionTypes = questions.every(q =>
  ['quick_win', 'structural', 'behavioral', 'governance'].includes(q.expert_action.type)
);
assertTrue(validActionTypes, 'All expert action types are valid');

// VS-26: Objectives no longer have thresholds - verify theme_id instead
const validObjectiveThemes = objectives.every(o =>
  ['foundation', 'future', 'intelligence'].includes(o.theme_id)
);
assertTrue(validObjectiveThemes, 'All objectives have valid theme_id');

// --- Summary ---
console.log('');
console.log('========================================');
console.log(`RESULTS: ${passed} passed, ${failed} failed`);
console.log('========================================');
console.log('');

if (failed > 0) {
  process.exit(1);
}
