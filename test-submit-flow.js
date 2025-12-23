// Quick test of submit flow against production API
const API = "https://cfodiagnosisv1-production.up.railway.app";

async function testFlow(token) {
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };

  console.log("\n1. Creating run...");
  const createRes = await fetch(`${API}/diagnostic-runs`, { method: "POST", headers });
  if (!createRes.ok) {
    console.log("❌ Failed to create run:", await createRes.text());
    return;
  }
  const { id: runId } = await createRes.json();
  console.log("✅ Created run:", runId);

  console.log("\n2. Saving setup...");
  const setupRes = await fetch(`${API}/diagnostic-runs/${runId}/setup`, {
    method: "POST",
    headers,
    body: JSON.stringify({ company_name: "Test Corp", industry: "Technology" })
  });
  if (!setupRes.ok) {
    console.log("❌ Failed to save setup:", await setupRes.text());
    return;
  }
  console.log("✅ Setup saved");

  console.log("\n3. Getting spec...");
  const specRes = await fetch(`${API}/api/spec`);
  const spec = await specRes.json();
  console.log(`✅ Spec loaded: ${spec.questions.length} questions`);

  console.log("\n4. Submitting all answers (YES)...");
  for (const q of spec.questions) {
    const inputRes = await fetch(`${API}/diagnostic-inputs`, {
      method: "POST",
      headers,
      body: JSON.stringify({ run_id: runId, question_id: q.id, value: true })
    });
    if (!inputRes.ok) {
      console.log(`❌ Failed to save ${q.id}:`, await inputRes.text());
      return;
    }
  }
  console.log(`✅ Submitted ${spec.questions.length} answers`);

  console.log("\n5. Completing run...");
  const completeRes = await fetch(`${API}/diagnostic-runs/${runId}/complete`, { method: "POST", headers });
  if (!completeRes.ok) {
    const err = await completeRes.text();
    console.log("❌ Failed to complete run:", err);
    return;
  }
  console.log("✅ Run completed");

  console.log("\n6. Scoring run...");
  const scoreRes = await fetch(`${API}/diagnostic-runs/${runId}/score`, { method: "POST", headers });
  if (!scoreRes.ok) {
    console.log("❌ Failed to score run:", await scoreRes.text());
    return;
  }
  console.log("✅ Run scored");

  console.log("\n7. Getting report...");
  const reportRes = await fetch(`${API}/diagnostic-runs/${runId}/report`, { headers });
  if (!reportRes.ok) {
    console.log("❌ Failed to get report:", await reportRes.text());
    return;
  }
  const report = await reportRes.json();
  console.log("✅ Report received:");
  console.log(`   - Overall Score: ${Math.round(report.overall_score * 100)}%`);
  console.log(`   - Maturity Level: ${report.maturity.achieved_level} (${report.maturity.achieved_label})`);
  console.log(`   - Critical Risks: ${report.critical_risks.length}`);
  console.log(`   - Actions: ${report.derived_actions?.length || report.actions.length}`);

  console.log("\n========================================");
  console.log("✅ FULL FLOW TEST PASSED");
  console.log("========================================\n");
}

// Get token from environment or command line
const token = process.env.AUTH_TOKEN || process.argv[2];
if (!token) {
  console.log("Usage: AUTH_TOKEN=<token> node test-submit-flow.js");
  console.log("   or: node test-submit-flow.js <token>");
  process.exit(1);
}

testFlow(token).catch(console.error);
