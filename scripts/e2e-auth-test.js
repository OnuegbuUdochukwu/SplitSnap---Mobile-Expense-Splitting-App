/*
  Simple E2E auth test script using Supabase JS to sign up, sign in, and verify profile row.
  Usage: node scripts/e2e-auth-test.js

  It reads EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY from environment (.env).
*/

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error(
    'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in environment.'
  );
  process.exit(2);
}

const supabase = createClient(url, anonKey);

async function run() {
  const random = Math.floor(Math.random() * 100000);
  const email = `e2e_test_${random}@example.com`;
  const password = 'TestPass123!';

  console.log('Signing up test user:', email);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });
  if (signUpError) {
    console.error('Sign up error:', signUpError.message || signUpError);
    process.exit(1);
  }
  console.log('Sign up response:', signUpData);

  // Attempt sign in
  console.log('Signing in test user...');
  const { data: signInData, error: signInError } =
    await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    console.error('Sign in error:', signInError.message || signInError);
    process.exit(1);
  }
  console.log('Sign in response (session):', !!signInData.session);

  // Check users table for profile - adjust table name if using different schema
  console.log('Querying users table for profile row...');
  // Some schemas use `user_id` as the PK (this project uses `user_id`),
  // so try that first and fall back to `id` if not found.
  let profiles = null;
  let profileError = null;

  const tryQuery = async (col) => {
    const res = await supabase
      .from('users')
      .select('*')
      .eq(col, signInData.user.id)
      .limit(1);
    return res;
  };

  ({ data: profiles, error: profileError } = await tryQuery('user_id'));
  if (profileError) {
    // If the column doesn't exist, try `id`
    if (
      profileError.message &&
      profileError.message.includes('column') &&
      profileError.message.includes('does not exist')
    ) {
      ({ data: profiles, error: profileError } = await tryQuery('id'));
    }
  }

  if (profileError) {
    console.error('Profile query error:', profileError.message || profileError);
    process.exit(1);
  }

  console.log(
    'Profile rows found:',
    profiles && profiles.length ? profiles[0] : 'none'
  );
  console.log('E2E auth test complete.');
}

run().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
