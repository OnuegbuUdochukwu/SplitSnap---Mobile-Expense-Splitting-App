const supabase = require('./node-supabase-client');
const fs = require('fs');

async function run() {
  const sessionPath = '.tmp/session.json';
  if (!fs.existsSync(sessionPath)) {
    console.error(
      'No session found. Run scripts/e2e-auth-save-session.js first.'
    );
    process.exit(1);
  }
  const session = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
  const userId = session.user_id;
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', userId)
    .limit(1);
  if (error) {
    console.error('Error querying users table:', error);
    process.exit(1);
  }
  console.log(
    'User profile for session user:',
    data && data.length ? data[0] : 'none'
  );
}

run();
