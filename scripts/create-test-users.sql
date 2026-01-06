-- Create 10 test users directly in Supabase
-- Run this in: Supabase Dashboard → SQL Editor → New Query

-- Note: This creates users in auth.users table
-- Passwords are hashed using Supabase's crypt function

DO $$
DECLARE
  i INT;
  user_email TEXT;
  user_password TEXT;
  ts TEXT := EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT;
BEGIN
  FOR i IN 1..10 LOOP
    user_email := 'testuser_' || ts || '_' || i || '@cfolens-test.com';
    user_password := 'TestPass' || i || '!';  -- Simple passwords: TestPass1!, TestPass2!, etc.

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      confirmation_token,
      raw_user_meta_data
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      user_email,
      crypt(user_password, gen_salt('bf')),
      NOW(),  -- Auto-confirm email
      NOW(),
      NOW(),
      '',
      jsonb_build_object('full_name', 'Test User ' || i)
    );

    RAISE NOTICE 'Created: % / %', user_email, user_password;
  END LOOP;
END $$;

-- Verify users were created
SELECT id, email, created_at
FROM auth.users
WHERE email LIKE '%@cfolens-test.com'
ORDER BY created_at DESC
LIMIT 10;
