/**
 * Script to create 20 test diagnostic runs
 * Usage: npx ts-node scripts/create-test-runs.ts
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { SpecRegistry, DEFAULT_SPEC_VERSION } from '../src/specs/registry';
import { L1_CRITICALS, L2_CRITICALS } from '../src/gates';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface Question {
  id: string;
  level: number;
}

// Test scenario definitions
const scenarios = [
  {
    id: 'perfect_l4',
    name: 'Perfect L4',
    description: 'All questions answered yes - should achieve L4 Optimized',
    generateAnswers: (questions: Question[]) => {
      return questions.map(q => ({ id: q.id, value: true }));
    },
  },
  {
    id: 'failing_l1',
    name: 'Failing L1',
    description: 'All questions no - should fail at L1 Emerging',
    generateAnswers: (questions: Question[]) => {
      return questions.map(q => ({ id: q.id, value: false }));
    },
  },
  {
    id: 'l2_ceiling',
    name: 'L2 Ceiling',
    description: 'Pass L1/L2 gates but fail L3 - tests L2 to L3 transition',
    generateAnswers: (questions: Question[]) => {
      return questions.map(q => {
        if (L1_CRITICALS.includes(q.id) || L2_CRITICALS.includes(q.id)) {
          return { id: q.id, value: true };
        }
        if (q.level <= 2) {
          return { id: q.id, value: Math.random() < 0.9 };
        }
        return { id: q.id, value: Math.random() < 0.3 };
      });
    },
  },
  {
    id: 'l3_ceiling',
    name: 'L3 Ceiling',
    description: 'Pass L1-L3 gates but fail L4 - tests L3 to L4 transition',
    generateAnswers: (questions: Question[]) => {
      return questions.map(q => {
        if (L1_CRITICALS.includes(q.id) || L2_CRITICALS.includes(q.id)) {
          return { id: q.id, value: true };
        }
        if (q.level <= 2) {
          return { id: q.id, value: Math.random() < 0.95 };
        }
        if (q.level === 3) {
          return { id: q.id, value: Math.random() < 0.75 };
        }
        return { id: q.id, value: Math.random() < 0.4 };
      });
    },
  },
  {
    id: 'critical_block',
    name: 'Critical Block',
    description: 'High scores but fail L1 criticals - tests gate blocking',
    generateAnswers: (questions: Question[]) => {
      return questions.map(q => {
        if (L1_CRITICALS.includes(q.id)) {
          return { id: q.id, value: false };
        }
        return { id: q.id, value: Math.random() < 0.85 };
      });
    },
  },
  {
    id: 'realistic',
    name: 'Realistic',
    description: 'Randomized realistic mix simulating typical responses',
    generateAnswers: (questions: Question[]) => {
      return questions.map(q => {
        const prob = q.level === 1 ? 0.7
          : q.level === 2 ? 0.55
          : q.level === 3 ? 0.35
          : 0.15;
        return { id: q.id, value: Math.random() < prob };
      });
    },
  },
];

const calibrationProfiles = [
  { obj_budget_discipline: 5, obj_financial_controls: 5, obj_performance_monitoring: 5, obj_forecasting_agility: 5, obj_driver_based_planning: 5, obj_scenario_modeling: 5, obj_strategic_influence: 5, obj_decision_support: 5, obj_operational_excellence: 5 },
  { obj_budget_discipline: 1, obj_financial_controls: 1, obj_performance_monitoring: 1, obj_forecasting_agility: 1, obj_driver_based_planning: 1, obj_scenario_modeling: 1, obj_strategic_influence: 1, obj_decision_support: 1, obj_operational_excellence: 1 },
  { obj_budget_discipline: 4, obj_financial_controls: 4, obj_performance_monitoring: 3, obj_forecasting_agility: 4, obj_driver_based_planning: 3, obj_scenario_modeling: 3, obj_strategic_influence: 3, obj_decision_support: 4, obj_operational_excellence: 3 },
  { obj_budget_discipline: 3, obj_financial_controls: 3, obj_performance_monitoring: 3, obj_forecasting_agility: 3, obj_driver_based_planning: 3, obj_scenario_modeling: 3, obj_strategic_influence: 3, obj_decision_support: 3, obj_operational_excellence: 3 },
];

async function createTestRun(scenario: typeof scenarios[0], runNumber: number): Promise<string | null> {
  const spec = SpecRegistry.get(DEFAULT_SPEC_VERSION);
  const answers = scenario.generateAnswers(spec.questions as any);
  const calibration = calibrationProfiles[runNumber % calibrationProfiles.length];

  // 1. Create diagnostic run
  const { data: run, error: runError } = await supabase
    .from('diagnostic_runs')
    .insert({
      status: 'created',
      spec_version: DEFAULT_SPEC_VERSION,
      context: {
        company: {
          name: `Test #${runNumber + 1} - ${scenario.name}`,
          industry: 'Technology',
          revenue_range: '$10M - $50M',
          employee_count: '51-200',
        },
        pillar: {
          model_count: 5,
          finance_ftes: 3,
          erp_system: 'QuickBooks',
          planning_tool: 'Excel',
        },
      },
      calibration: {
        importance_map: calibration,
        locked: [],
      },
    })
    .select()
    .single();

  if (runError || !run) {
    console.error(`Failed to create run ${runNumber + 1}:`, runError?.message);
    return null;
  }

  const runId = run.id;

  // 2. Insert all diagnostic inputs
  const inputs = answers.map(a => ({
    run_id: runId,
    question_id: a.id,
    value: a.value,
  }));

  const { error: inputError } = await supabase.from('diagnostic_inputs').insert(inputs);

  if (inputError) {
    console.error(`Failed to insert inputs for run ${runNumber + 1}:`, inputError.message);
    await supabase.from('diagnostic_runs').delete().eq('id', runId);
    return null;
  }

  // 3. Mark as completed
  const { error: completeError } = await supabase
    .from('diagnostic_runs')
    .update({ status: 'completed' })
    .eq('id', runId);

  if (completeError) {
    console.error(`Failed to complete run ${runNumber + 1}:`, completeError.message);
    return null;
  }

  // 4. Trigger scoring
  const scoreResponse = await fetch(`${process.env.VITE_API_URL || 'http://localhost:3000'}/diagnostic-runs/${runId}/score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!scoreResponse.ok) {
    console.warn(`Scoring may have failed for run ${runNumber + 1} (will work on report view)`);
  }

  return runId;
}

async function main() {
  console.log('Creating 20 test diagnostic runs...\n');

  const createdRuns: { id: string; name: string; url: string }[] = [];
  const baseUrl = 'https://cfodiagnosisv1.vercel.app';

  // Create 20 runs cycling through scenarios
  for (let i = 0; i < 20; i++) {
    const scenario = scenarios[i % scenarios.length];
    console.log(`Creating run ${i + 1}/20: ${scenario.name}...`);

    const runId = await createTestRun(scenario, i);

    if (runId) {
      createdRuns.push({
        id: runId,
        name: `Test #${i + 1} - ${scenario.name}`,
        url: `${baseUrl}/report/${runId}`,
      });
      console.log(`  ✓ Created: ${baseUrl}/report/${runId}`);
    } else {
      console.log(`  ✗ Failed`);
    }
  }

  console.log('\n========================================');
  console.log('CREATED TEST RUNS:');
  console.log('========================================\n');

  createdRuns.forEach((run, i) => {
    console.log(`${i + 1}. ${run.name}`);
    console.log(`   ${run.url}\n`);
  });

  console.log('========================================');
  console.log(`Total: ${createdRuns.length} runs created`);
  console.log('========================================');
}

main().catch(console.error);
