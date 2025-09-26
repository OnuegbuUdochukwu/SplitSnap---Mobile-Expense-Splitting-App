require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

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

  console.log('Signing in test user...');
  const { data: signInData, error: signInError } =
    await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    console.error('Sign in error:', signInError.message || signInError);
    process.exit(1);
  }

  const session = signInData.session;
  if (!session) {
    console.error('No session returned');
    process.exit(1);
  }

  // Ensure a profile exists in `users` table. Use service role key if available.
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  let adminClient = null;
  if (serviceRole) {
    const { createClient } = require('@supabase/supabase-js');
    adminClient = createClient(url, serviceRole);
  }

  try {
    const profileClient = adminClient || supabase;
    const { data: existing } = await profileClient
      .from('users')
      .select('*')
      .eq('user_id', session.user.id)
      .limit(1);
    if (!existing || existing.length === 0) {
      const fullName = session.user.email;
      const { data: inserted, error: insertError } = await profileClient
        .from('users')
        .insert({ user_id: session.user.id, full_name: fullName })
        .select('*')
        .single();
      if (insertError) {
        console.warn(
          'Could not insert profile row automatically:',
          insertError.message || insertError
        );
      } else {
        console.log('Inserted profile row for user:', inserted.user_id);
      }
    } else {
      console.log('Profile row already exists for user.');
    }
  } catch (err) {
    console.warn('Profile creation check failed:', err);
  }

  const out = { access_token: session.access_token, user_id: session.user.id };
  fs.mkdirSync('.tmp', { recursive: true });
  fs.writeFileSync('.tmp/session.json', JSON.stringify(out, null, 2));
  console.log('Saved session to .tmp/session.json');
}

run().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
