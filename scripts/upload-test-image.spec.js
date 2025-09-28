require('dotenv').config();
const fs = require('fs');
const { Buffer } = require('buffer');
const assert = require('assert');
const { createClient } = require('@supabase/supabase-js');

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anon) {
  console.error(
    'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in .env'
  );
  process.exit(1);
}

const supabase = createClient(url, serviceRole || anon);

async function testUpload() {
  const samplePath = 'scripts/sample-image.jpg';
  if (!fs.existsSync(samplePath)) {
    const buf = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
    fs.writeFileSync(samplePath, buf);
  }

  const file = fs.readFileSync(samplePath);
  const fileName = `receipt_test_spec_${Date.now()}.jpg`;
  const { data, error } = await supabase.storage
    .from('receipts')
    .upload(fileName, file);
  if (error) throw error;

  const { data: signedData, error: signedError } = await supabase.storage
    .from('receipts')
    .createSignedUrl(fileName, 60);
  if (signedError) throw signedError;

  assert(signedData && signedData.signedUrl, 'Signed URL was not returned');
  console.log('Test passed. signedUrl:', signedData.signedUrl);

  // Cleanup after test
  await supabase.storage.from('receipts').remove([data.path]);
}

(async () => {
  try {
    await testUpload();
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
})();
