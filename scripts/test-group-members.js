require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function main() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    console.error(
      'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in .env'
    );
    process.exit(1);
  }

  const supabase = createClient(url, anonKey);
  const email = `e2e_test_${Date.now()}@example.com`;
  const password = 'TestPass123!';

  console.log('Signing up test user:', email);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });
  if (signUpError) {
    console.error('signUp error:', signUpError);
    process.exit(1);
  }
  console.log('signUp data:', signUpData);

  console.log('Attempting signInWithPassword...');
  const { data: signInData, error: signInError } =
    await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    console.error('signIn error:', signInError);
    console.log(
      'If email confirmation is required, please either confirm the email in the test inbox or run this script with a service role key creating a user directly.'
    );
    process.exit(1);
  }

  const sessionUser = signInData?.user;
  const accessToken = signInData?.session?.access_token;
  console.log('Signed in user id:', sessionUser?.id);

  // Create a supabase client that includes the user's access token so requests run under that user
  const supabaseUser = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  console.log('Querying group_members for user...');
  const { data, error } = await supabaseUser
    .from('group_members')
    .select('*')
    .eq('user_id', sessionUser.id);

  console.log('Result:');
  console.log(JSON.stringify({ data, error }, null, 2));

  // Clean up: attempt to sign out
  try {
    await supabase.auth.signOut();
  } catch (_e) {
    // ignore
  }
}

main().catch((err) => {
  console.error('Unhandled error', err);
  process.exit(1);
});
