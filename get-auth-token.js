// Get a fresh auth token from Supabase
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://ocyxlongqcyjpfqodgid.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jeXhsb25ncWN5anBmcW9kZ2lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1ODk0MzksImV4cCI6MjA4MTE2NTQzOX0.4yGGz1UpnjX6AEwzFMTUxeqZ3uw4ZaM3GfdaH5zVM2c";

const email = process.env.TEST_EMAIL || "koseoglucan@gmail.com";
const password = process.env.TEST_PASSWORD;

if (!password) {
  console.log("Usage: TEST_PASSWORD=<password> node get-auth-token.js");
  process.exit(1);
}

async function getToken() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.error("Auth failed:", error.message);
    process.exit(1);
  }

  console.log("AUTH_TOKEN=" + data.session.access_token);
}

getToken();
