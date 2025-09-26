require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing Supabase URL or key in .env');
  process.exit(1);
}

const supabase = createClient(url, key);

async function run() {
  try {
    // Try to list buckets (may require service role key)
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
      console.warn(
        'Could not list buckets with provided key:',
        error.message || error
      );
      console.log(
        'If you need to check buckets, provide SUPABASE_SERVICE_ROLE_KEY in .env'
      );
      process.exit(0);
    }
    console.log(
      'Buckets:',
      (data || []).map((b) => b.name)
    );
    const found = (data || []).some((b) => b.name === 'receipts');
    console.log("'receipts' bucket exists?", found);
  } catch (err) {
    console.error('Unexpected error listing buckets:', err);
    process.exit(1);
  }
}

run();
