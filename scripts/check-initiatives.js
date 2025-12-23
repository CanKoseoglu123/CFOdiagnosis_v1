// check-initiatives.js
const runId = '51348dc7-4201-4e8a-87b2-8494aa3e425e';
const API_BASE = 'https://cfodiagnosisv1-production.up.railway.app';
const AUTH_TOKEN = process.env.AUTH_TOKEN;

async function check() {
  const res = await fetch(`${API_BASE}/diagnostic-runs/${runId}/report`, {
    headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
  });
  const data = await res.json();

  console.log('=== GROUPED INITIATIVES ===\n');
  for (const init of data.grouped_initiatives || []) {
    console.log(`[${init.priority}] ${init.initiative_title}`);
    console.log(`    Theme: ${init.theme_id} | Score: ${init.total_score}`);
    console.log(`    ${init.initiative_description}`);
    console.log(`    Actions (${init.actions.length}):`);
    for (const a of init.actions) {
      console.log(`      - ${a.action_title || a.action_text} [L${a.level}]`);
    }
    console.log();
  }
}

check().catch(console.error);
