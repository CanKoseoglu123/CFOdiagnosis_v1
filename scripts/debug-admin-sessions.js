// Debug script to check admin sessions user lookup
const email = 'koseoglucan@gmail.com';
const password = process.env.TEST_PASSWORD || '123456';

async function test() {
  // Login
  console.log('Logging in...');
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

  console.log('Login success, user ID:', loginData.user?.id);

  // Test admin sessions
  console.log('\nFetching admin sessions...');
  const res = await fetch('https://cfodiagnosisv1-production.up.railway.app/admin/sessions', {
    headers: { Authorization: 'Bearer ' + loginData.access_token }
  });

  console.log('Status:', res.status);
  console.log('X-Admin-Debug:', res.headers.get('x-admin-debug'));

  if (!res.ok) {
    console.log('Error:', await res.text());
    return;
  }

  const data = await res.json();
  console.log('Sessions count:', data.length);

  // Check unique owner_ids
  const ownerIds = [...new Set(data.map(s => s.owner_id))];
  console.log('Unique owner IDs:', ownerIds.length);

  // Check how many have unknown email
  const unknownCount = data.filter(s => s.user_email === 'unknown').length;
  console.log('Sessions with unknown email:', unknownCount, 'of', data.length);

  if (data.length > 0) {
    console.log('\nFirst 5 sessions:');
    data.slice(0, 5).forEach((s, i) => {
      console.log(`${i+1}. owner_id=${s.owner_id?.slice(0,8)}... email=${s.user_email} name=${s.user_name}`);
    });
  }
}

test().catch(console.error);
