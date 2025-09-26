require('dotenv').config();
const fetch = require('node-fetch');

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRole) {
  console.error(
    'Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env'
  );
  process.exit(1);
}

const base = url.replace(/\/$/, '');

async function run() {
  try {
    const res = await fetch(`${base}/storage/v1/bucket`, {
      method: 'POST',
      headers: {
        apikey: serviceRole,
        Authorization: `Bearer ${serviceRole}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'receipts',
        public: false,
      }),
    });

    const text = await res.text();
    if (!res.ok) {
      console.error('Failed to create bucket:', res.status, text);
      process.exit(1);
    }
    console.log('Bucket created:', text);
  } catch (err) {
    console.error('Error creating bucket:', err);
    process.exit(1);
  }
}

run();
