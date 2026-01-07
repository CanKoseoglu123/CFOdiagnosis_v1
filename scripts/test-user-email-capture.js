// Test that user_email is now captured when creating runs
const email = 'koseoglucan@gmail.com';
const password = process.env.TEST_PASSWORD || '123456';

async function test() {
  // Login to get fresh token
  console.log('1. Logging in...');
  const loginRes = await fetch('https://ocyxlongqcyjpfqodgid.supabase.co/auth/v1/token?grant_type=password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jeXhsb25ncWN5anBmcW9kZ2lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1ODk0MzksImV4cCI6MjA4MTE2NTQzOX0.4yGGz1UpnjX6AEwzFMTUxeqZ3uw4ZaM3GfdaH5zVM2c'
    },
    body: JSON.stringify({ email, password })
  });

  const loginData = await loginRes.json();
  if (!loginData.access_token) {
    console.log('Login failed:', loginData);
    return;
  }
  const TOKEN = loginData.access_token;
  console.log('   Logged in as:', loginData.user?.email);

  // Create a new run (should capture email)
  console.log('\n2. Creating new diagnostic run...');
  const createRes = await fetch('https://cfodiagnosisv1-production.up.railway.app/diagnostic-runs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + TOKEN
    }
  });

  const run = await createRes.json();
  console.log('   Run ID:', run.id);
  console.log('   user_email in response:', run.user_email || 'not in response');

  // Check admin sessions to verify email shows
  console.log('\n3. Fetching admin sessions...');
  const sessionsRes = await fetch('https://cfodiagnosisv1-production.up.railway.app/admin/sessions', {
    headers: { 'Authorization': 'Bearer ' + TOKEN }
  });

  console.log('   Status:', sessionsRes.status);
  const sessions = await sessionsRes.json();

  // Find our new run
  const newRun = sessions.find(s => s.id === run.id);
  if (newRun) {
    console.log('\n4. New run in admin sessions:');
    console.log('   user_email:', newRun.user_email);
    console.log('   user_name:', newRun.user_name);
    console.log('   Result:', newRun.user_email === email ? '✅ SUCCESS!' : '❌ Email not captured');
  } else {
    console.log('   Run not found in sessions list');
  }

  // Show first 5 sessions
  console.log('\n5. First 5 sessions in admin:');
  sessions.slice(0, 5).forEach((s, i) => {
    console.log('   ' + (i+1) + '. ' + s.user_email + ' | ' + (s.company_name || 'No company') + ' | ' + s.status);
  });
}

test().catch(console.error);
