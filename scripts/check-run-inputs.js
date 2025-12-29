/**
 * Check inputs for a specific run
 */

const API = 'https://cfodiagnosisv1-production.up.railway.app';
const TOKEN = process.env.AUTH_TOKEN;
const RUN_ID = '73dbc478-ffef-4bfa-9e43-b7ca0c9498a4';

async function checkRun() {
  console.log('=== Checking Run Inputs ===\n');
  console.log('Run ID:', RUN_ID);

  const res = await fetch(API + '/diagnostic-runs/' + RUN_ID, {
    headers: { 'Authorization': 'Bearer ' + TOKEN }
  });

  if (!res.ok) {
    console.log('Error:', res.status, await res.text());
    return;
  }

  const run = await res.json();
  console.log('Status:', run.status);
  console.log('Company:', run.context?.company?.name || 'N/A');
  console.log('Total inputs:', run.inputs?.length || 0);

  // Group inputs by value type
  const byValue = {};
  for (const input of (run.inputs || [])) {
    const val = input.value;
    const type = typeof val;
    const key = type + ':' + String(val);
    if (!byValue[key]) byValue[key] = [];
    byValue[key].push(input.question_id);
  }

  console.log('\nInputs by value type:');
  for (const [key, ids] of Object.entries(byValue)) {
    console.log('  ' + key + ': ' + ids.length + ' questions');
    if (ids.length <= 5) {
      console.log('    ' + ids.join(', '));
    }
  }

  // Show sample inputs
  console.log('\nSample inputs:');
  (run.inputs || []).slice(0, 5).forEach(i => {
    console.log('  ' + i.question_id + ': ' + JSON.stringify(i.value) + ' (' + typeof i.value + ')');
  });
}

checkRun().catch(e => console.error('Error:', e.message));
