/*
  Cleanup E2E test users created by `scripts/e2e-auth-test.js`.

  Usage:
    # dry run (list matches)
    node scripts/cleanup-e2e-users.js --dry-run

    # actually delete matched users (use with care)
    node scripts/cleanup-e2e-users.js --confirm

  Requirements:
    - SUPABASE_SERVICE_ROLE_KEY environment variable set (service role key)
    - EXPO_PUBLIC_SUPABASE_URL set

  This script only removes users whose email starts with `e2e_test_` to avoid accidental deletion.
*/

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const argv = require('minimist')(process.argv.slice(2));

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRole) {
  console.error(
    'Please set EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment.'
  );
  process.exit(2);
}

const supabase = createClient(url, serviceRole, {
  auth: { persistSession: false },
});

async function run() {
  console.log('Searching for e2e test users (email starts with e2e_test_)...');

  // Query auth.users via the Admin API
  const { data: users, error } = await supabase
    .from('auth.users')
    .select('id, email')
    .like('email', 'e2e_test_%');

  if (error) {
    console.error('Error querying auth.users:', error.message || error);
    process.exit(1);
  }

  if (!users || users.length === 0) {
    console.log('No e2e test users found.');
    return;
  }

  console.log(`Found ${users.length} test users:`);
  users.forEach((u) => console.log(` - ${u.id} ${u.email}`));

  if (!argv.confirm) {
    console.log(
      '\nNo destructive actions taken. To delete these users run with --confirm.'
    );
    return;
  }

  // Delete users one-by-one
  for (const u of users) {
    try {
      console.log(`Deleting auth user ${u.id} <${u.email}>...`);
      const { error: delErr } = await supabase.auth.admin.deleteUser(u.id);
      if (delErr) {
        console.error('Failed to delete auth user:', delErr.message || delErr);
      } else {
        console.log('Deleted auth user', u.id);
      }

      // Also attempt to remove profile rows in `users` table
      const { error: pErr } = await supabase
        .from('users')
        .delete()
        .eq('user_id', u.id);

      if (pErr) {
        console.error(
          'Failed to delete profile row for',
          u.id,
          pErr.message || pErr
        );
      } else {
        console.log('Deleted profile row for', u.id);
      }
    } catch (err) {
      console.error('Unexpected error deleting user', u.id, err);
    }
  }

  console.log('Cleanup complete.');
}

run().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
