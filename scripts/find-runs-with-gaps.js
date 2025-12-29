/**
 * Find completed runs with gaps for VS-32d testing
 */

const API = 'https://cfodiagnosisv1-production.up.railway.app';
const TOKEN = process.env.AUTH_TOKEN;

async function findRunsWithGaps() {
  console.log('=== Finding Completed Runs with Gaps ===\n');

  const res = await fetch(API + '/diagnostic-runs', {
    headers: { 'Authorization': 'Bearer ' + TOKEN }
  });

  if (!res.ok) {
    console.log('Error:', res.status);
    return;
  }

  const runs = await res.json();
  const completed = runs.filter(r => r.status === 'completed' || r.status === 'locked');
  console.log('Total runs:', runs.length);
  console.log('Completed runs:', completed.length);

  // Check each completed run for gaps
  console.log('\nAnalyzing runs for gaps...\n');

  for (const run of completed.slice(0, 10)) {
    const detailRes = await fetch(API + '/diagnostic-runs/' + run.id, {
      headers: { 'Authorization': 'Bearer ' + TOKEN }
    });

    if (!detailRes.ok) continue;

    const detail = await detailRes.json();
    const inputs = detail.inputs || [];

    // Count gap answers (value 'a', false, or 'no')
    const gaps = inputs.filter(i => i.value === 'a' || i.value === false || i.value === 'no');
    const yeses = inputs.filter(i => i.value === 'c' || i.value === 'd' || i.value === true || i.value === 'yes');

    if (gaps.length > 0) {
      console.log('Run:', run.id);
      console.log('  Company:', detail.context?.company?.name || 'N/A');
      console.log('  Status:', run.status);
      console.log('  Total inputs:', inputs.length);
      console.log('  Gaps (No answers):', gaps.length);
      console.log('  Yes answers:', yeses.length);
      console.log('');
    }
  }

  console.log('\n--- Runs WITHOUT gaps ---');
  for (const run of completed.slice(0, 10)) {
    const detailRes = await fetch(API + '/diagnostic-runs/' + run.id, {
      headers: { 'Authorization': 'Bearer ' + TOKEN }
    });

    if (!detailRes.ok) continue;

    const detail = await detailRes.json();
    const inputs = detail.inputs || [];

    const gaps = inputs.filter(i => i.value === 'a' || i.value === false || i.value === 'no');

    if (gaps.length === 0 && inputs.length > 0) {
      console.log('Run:', run.id, '- No gaps (' + inputs.length + ' inputs, all Yes)');
    }
  }
}

findRunsWithGaps().catch(e => console.error('Error:', e.message));
