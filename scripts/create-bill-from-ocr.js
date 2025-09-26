const fs = require('fs');
require('dotenv').config();

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

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
  const token = session.access_token;

  const sample = process.argv[2] || 'scripts/sample-parsed.json';
  if (!fs.existsSync(sample)) {
    console.error('Sample parsed file not found:', sample);
    process.exit(1);
  }
  const parsed = JSON.parse(fs.readFileSync(sample, 'utf8'));

  // Insert bill via Supabase REST API as the authenticated user (Authorization: Bearer <token>)
  const billRes = await fetch(`${url}/rest/v1/bills`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      creator_id: userId,
      total_amount: parsed.total,
      status: 'pending',
    }),
  });

  if (!billRes.ok) {
    const text = await billRes.text();
    throw new Error(`Bill insert failed: ${billRes.status} ${text}`);
  }
  const billData = (await billRes.json())[0];

  const items = (parsed.items || []).map((it) => ({
    bill_id: billData.bill_id,
    name: it.name,
    price: it.price,
    quantity: it.quantity || 1,
  }));

  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  let itemsRes;
  if (serviceRole) {
    // Use service role key to bypass RLS for item insertion (safe for test envs)
    itemsRes = await fetch(`${url}/rest/v1/bill_items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
        apikey: serviceRole,
        Authorization: `Bearer ${serviceRole}`,
      },
      body: JSON.stringify(items),
    });
  } else {
    itemsRes = await fetch(`${url}/rest/v1/bill_items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
        apikey: anonKey,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(items),
    });
  }

  if (!itemsRes.ok) {
    const text = await itemsRes.text();
    throw new Error(`Items insert failed: ${itemsRes.status} ${text}`);
  }
  const itemsData = await itemsRes.json();

  console.log('Created bill and items via REST:', {
    bill: billData,
    items: itemsData,
  });
}

run().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
