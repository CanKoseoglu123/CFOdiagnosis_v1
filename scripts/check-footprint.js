// Quick script to check maturity_footprint in a report
const runId = process.argv[2] || '76a71a86-7b01-4685-abc8-ea3d3ab15ee0';
const token = process.env.AUTH_TOKEN;

if (!token) {
  console.error('AUTH_TOKEN required');
  process.exit(1);
}

async function main() {
  const res = await fetch(`https://cfodiagnosisv1-production.up.railway.app/diagnostic-runs/${runId}/report`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();
  const fp = data.maturity_footprint;

  if (!fp) {
    console.log('maturity_footprint: NOT FOUND');
    return;
  }

  console.log('=== MATURITY FOOTPRINT ===\n');
  console.log('Summary:', fp.summary_text);
  console.log('\nLevels:');

  for (const level of fp.levels) {
    console.log(`  L${level.level} ${level.name}: ${level.proven_count}/${level.total_count} proven, ${level.partial_count} partial`);
    console.log(`    Practices: ${level.practices.map(p => p.title).join(', ')}`);
  }

  console.log('\nFocus Next:');
  for (let i = 0; i < fp.focus_next.length; i++) {
    const item = fp.focus_next[i];
    console.log(`  ${i+1}. ${item.practice_title} (L${item.level}, ${item.reason}, score=${item.priority_score})`);
  }
}

main().catch(console.error);
