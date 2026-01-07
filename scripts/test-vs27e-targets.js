/**
 * VS-27e: Test targets endpoint
 * Usage: AUTH_TOKEN="..." node scripts/test-vs27e-targets.js
 */

const API = 'https://cfodiagnosisv1-production.up.railway.app';
const TOKEN = process.env.AUTH_TOKEN;

if (!TOKEN) {
  console.error('Missing AUTH_TOKEN environment variable');
  process.exit(1);
}

async function test() {
  console.log('=== VS-27e Targets Endpoint Test ===\n');

  // Step 1: Create a new diagnostic run
  console.log('1. Creating diagnostic run...');
  const runRes = await fetch(API + '/diagnostic-runs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + TOKEN
    }
  });

  if (!runRes.ok) {
    console.log('   FAILED:', await runRes.text());
    return;
  }

  const run = await runRes.json();
  console.log('   Run ID:', run.id);

  // Step 2: Create company profile with classification
  console.log('\n2. Creating company profile with classification...');
  const profileRes = await fetch(API + '/api/company-profiles', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + TOKEN
    },
    body: JSON.stringify({
      context: {
        name: 'VS-27e Test Corp',
        industry: 'saas',
        revenue_range: '50m_250m',
        employee_count: '201_1000',
        finance_structure: 'hybrid',
        ownership_structure: 'pe_backed', // Should trigger PE modifier
        change_appetite: 'transform',
        // Additional required classification fields
        legal_entities: '11_25',
        revenue_trajectory: 'growth_20_50',
        debt_pressure: 'moderate',
        ma_intensity: 'active',
        gross_margin_band: 'above_50',
        audit_rigor: 'big4',
        erp_strategy: 'tier1'
      },
      diagnostic_run_id: run.id
    })
  });

  if (!profileRes.ok) {
    console.log('   FAILED:', await profileRes.text());
    return;
  }

  const profile = await profileRes.json();
  console.log('   Profile ID:', profile.id);
  console.log('   Persona:', profile.classification?.persona);
  console.log('   Confidence:', profile.classification?.confidence);

  // Step 3: Test the targets endpoint
  console.log('\n3. Testing /diagnostic-runs/:id/targets endpoint...');
  const targetsRes = await fetch(API + '/diagnostic-runs/' + run.id + '/targets', {
    headers: { Authorization: 'Bearer ' + TOKEN }
  });

  console.log('   Status:', targetsRes.status);

  if (!targetsRes.ok) {
    console.log('   FAILED:', await targetsRes.text());
    return;
  }

  const targets = await targetsRes.json();
  console.log('   Persona:', targets.persona);
  console.log('   Modifiers Applied:', targets.modifiersApplied);
  console.log('   Objective Targets:', targets.objectiveTargets?.length);
  console.log('   Practice Targets:', targets.practiceTargets?.length);

  // Show a few objective targets
  console.log('\n   Sample Objective Targets:');
  targets.objectiveTargets?.slice(0, 3).forEach(t => {
    console.log(`     ${t.objective_id}: base=${t.baseTarget}, adjusted=${t.adjustedTarget}`);
  });

  // Show a few practice targets
  console.log('\n   Sample Practice Targets:');
  targets.practiceTargets?.slice(0, 3).forEach(t => {
    const constraint = t.constrainedBy ? ` (constrained: ${t.constrainedBy})` : '';
    console.log(`     ${t.practice_id}: ${t.target}${constraint}`);
  });

  // Validate PE modifier applied
  console.log('\n=== Validation ===');
  const peModifierApplied = targets.modifiersApplied?.includes('pe_vc_velocity');
  console.log('PE/VC Velocity Modifier Applied:', peModifierApplied ? 'YES' : 'NO');

  if (peModifierApplied) {
    // Check that some objectives got boosted
    const boosted = targets.objectiveTargets?.filter(t => t.adjustedTarget > t.baseTarget);
    console.log('Objectives with Boosted Targets:', boosted?.length || 0);
  }

  console.log('\n=== TEST PASSED ===');
  console.log('\nRun ID for manual testing:', run.id);
}

test().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
