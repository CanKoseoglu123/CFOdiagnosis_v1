/**
 * VS-32c: Test Script for Spec Registry Version Normalization
 *
 * Run with: node scripts/test-vs32c-spec-registry.js
 */

const { SpecRegistry } = require('../dist/specs/registry');

console.log('='.repeat(60));
console.log('VS-32c: Spec Registry Version Normalization Tests');
console.log('='.repeat(60));

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
    passed++;
  } catch (e) {
    console.log(`❌ FAIL: ${name}`);
    console.log(`   Error: ${e.message}`);
    failed++;
  }
}

function assertEqual(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(`${msg}: expected ${expected}, got ${actual}`);
  }
}

function assertDefined(value, msg) {
  if (value === undefined || value === null) {
    throw new Error(`${msg}: expected defined value`);
  }
}

function assertThrows(fn, expectedMsg, testName) {
  try {
    fn();
    throw new Error(`Expected error but none was thrown`);
  } catch (e) {
    if (!e.message.includes(expectedMsg)) {
      throw new Error(`Expected error containing "${expectedMsg}", got: ${e.message}`);
    }
  }
}

// Test: Load spec WITH 'v' prefix
test('Load spec with v prefix (v2.9.0)', () => {
  const spec = SpecRegistry.get('v2.9.0');
  assertDefined(spec, 'spec should be defined');
  assertDefined(spec.questions, 'spec.questions should be defined');
});

// Test: Load spec WITHOUT 'v' prefix (the bug fix)
test('Load spec without v prefix (2.9.0) - BUG FIX', () => {
  const spec = SpecRegistry.get('2.9.0');
  assertDefined(spec, 'spec should be defined');
  assertDefined(spec.questions, 'spec.questions should be defined');
});

// Test: v2.7.0 with prefix
test('Load spec v2.7.0 (with prefix)', () => {
  const spec = SpecRegistry.get('v2.7.0');
  assertDefined(spec, 'spec should be defined');
});

// Test: 2.7.0 without prefix
test('Load spec 2.7.0 (without prefix)', () => {
  const spec = SpecRegistry.get('2.7.0');
  assertDefined(spec, 'spec should be defined');
});

// Test: v2.8.1 with prefix
test('Load spec v2.8.1 (with prefix)', () => {
  const spec = SpecRegistry.get('v2.8.1');
  assertDefined(spec, 'spec should be defined');
});

// Test: 2.8.1 without prefix
test('Load spec 2.8.1 (without prefix)', () => {
  const spec = SpecRegistry.get('2.8.1');
  assertDefined(spec, 'spec should be defined');
});

// Test: v2.6.4 with prefix
test('Load spec v2.6.4 (with prefix)', () => {
  const spec = SpecRegistry.get('v2.6.4');
  assertDefined(spec, 'spec should be defined');
});

// Test: 2.6.4 without prefix
test('Load spec 2.6.4 (without prefix)', () => {
  const spec = SpecRegistry.get('2.6.4');
  assertDefined(spec, 'spec should be defined');
});

// Test: Invalid version throws error
test('Invalid version throws error', () => {
  assertThrows(
    () => SpecRegistry.get('v9.9.9'),
    'Spec version not found',
    'invalid version'
  );
});

// Test: Error message includes normalized version
test('Error message includes normalized version', () => {
  try {
    SpecRegistry.get('3.0.0');
    throw new Error('Should have thrown');
  } catch (e) {
    if (!e.message.includes('normalized: v3.0.0')) {
      throw new Error(`Expected error to include normalized version, got: ${e.message}`);
    }
  }
});

// Summary
console.log('\n' + '='.repeat(60));
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log('='.repeat(60));

if (failed > 0) {
  process.exit(1);
}
