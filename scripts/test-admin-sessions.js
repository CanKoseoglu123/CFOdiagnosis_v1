// Quick test for admin sessions endpoint
const API = 'https://cfodiagnosisv1-production.up.railway.app';
const TOKEN = process.env.AUTH_TOKEN;

async function test() {
  const res = await fetch(`${API}/admin/sessions`, {
    headers: { Authorization: `Bearer ${TOKEN}` }
  });

  console.log('Status:', res.status);
  console.log('X-Admin-Debug:', res.headers.get('x-admin-debug'));

  const data = await res.json();
  console.log('Sessions count:', data.length);

  // Show first 5 sessions
  console.log('\nFirst 5 sessions:');
  data.slice(0, 5).forEach((s, i) => {
    console.log(`${i + 1}. ${s.user_email} | ${s.company_name || 'No company'} | ${s.status}`);
  });

  // Count unique users
  const emails = [...new Set(data.map(s => s.user_email))];
  console.log('\nUnique users:', emails.length);

  const withEmail = data.filter(s => s.user_email !== 'unknown').length;
  console.log('Sessions with real email:', withEmail, '/', data.length);
}

test().catch(console.error);
