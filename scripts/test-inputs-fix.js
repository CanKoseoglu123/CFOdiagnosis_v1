// Test that inputs are now included in /report endpoint
const API = 'https://cfodiagnosisv1-production.up.railway.app';

async function testReportInputs() {
  // Test with a known completed run
  const runId = '1489d550-ed15-46a6-bba4-df525c1b00f4';  // Known completed run

  console.log('Testing /report endpoint for inputs field...\n');

  try {
    const res = await fetch(`${API}/diagnostic-runs/${runId}/report`);

    if (!res.ok) {
      console.log('Error:', res.status, await res.text());
      return;
    }

    const report = await res.json();

    console.log('Report Keys:', Object.keys(report).join(', '));
    console.log('');
    console.log('Has inputs field:', 'inputs' in report);
    console.log('Inputs count:', report.inputs?.length || 0);

    if (report.inputs && report.inputs.length > 0) {
      console.log('Sample input:', JSON.stringify(report.inputs[0]));
      console.log('');
      console.log('✅ FIX VERIFIED - inputs now included in report!');
    } else {
      console.log('');
      console.log('❌ Inputs still missing or empty');
    }
  } catch (err) {
    console.log('Fetch error:', err.message);
  }
}

testReportInputs();
