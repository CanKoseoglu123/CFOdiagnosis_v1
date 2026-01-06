/**
 * Create 10 test users with random emails and passwords
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" node scripts/create-test-users.js
 *
 * Get your service role key from:
 *   Supabase Dashboard → Settings → API → service_role key (secret)
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ocyxlongqcyjpfqodgid.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.error('');
  console.error('Usage:');
  console.error('  SUPABASE_SERVICE_ROLE_KEY="your-key" node scripts/create-test-users.js');
  console.error('');
  console.error('Get your service role key from:');
  console.error('  Supabase Dashboard → Settings → API → service_role key');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Generate random string
function randomString(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate secure password
function generatePassword() {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*';

  // Ensure at least one of each type
  let password =
    upper[Math.floor(Math.random() * upper.length)] +
    lower[Math.floor(Math.random() * lower.length)] +
    numbers[Math.floor(Math.random() * numbers.length)] +
    special[Math.floor(Math.random() * special.length)];

  // Fill rest with random chars
  const all = upper + lower + numbers + special;
  for (let i = 0; i < 8; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  // Shuffle
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

async function createTestUsers(count = 10) {
  console.log(`\n=== Creating ${count} Test Users ===\n`);

  const users = [];
  const timestamp = Date.now();

  for (let i = 1; i <= count; i++) {
    const email = `testuser_${timestamp}_${i}@cfolens-test.com`;
    const password = generatePassword();

    console.log(`Creating user ${i}/${count}: ${email}`);

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,  // Auto-confirm email
      user_metadata: {
        full_name: `Test User ${i}`,
        created_by: 'test-script'
      }
    });

    if (error) {
      console.error(`  ERROR: ${error.message}`);
    } else {
      console.log(`  SUCCESS: ${data.user.id}`);
      users.push({
        id: data.user.id,
        email,
        password,
        created_at: data.user.created_at
      });
    }
  }

  // Summary
  console.log('\n=== Summary ===\n');
  console.log(`Created: ${users.length}/${count} users\n`);

  if (users.length > 0) {
    console.log('Credentials (save these!):\n');
    console.log('-'.repeat(80));
    users.forEach((u, i) => {
      console.log(`User ${i + 1}:`);
      console.log(`  Email:    ${u.email}`);
      console.log(`  Password: ${u.password}`);
      console.log(`  ID:       ${u.id}`);
      console.log('');
    });
    console.log('-'.repeat(80));

    // Also output as JSON for easy copying
    console.log('\nJSON format:\n');
    console.log(JSON.stringify(users, null, 2));
  }
}

createTestUsers(10).catch(console.error);
