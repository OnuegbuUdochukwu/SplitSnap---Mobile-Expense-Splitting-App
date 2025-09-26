require('dotenv').config();
const fs = require('fs');
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

async function run() {
  try {
    const samplePath = 'scripts/sample-image.jpg';
    if (!fs.existsSync(samplePath)) {
      // Create a tiny placeholder image (1x1 pixel jpeg)
      const buf = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
      fs.writeFileSync(samplePath, buf);
    }

    const file = fs.readFileSync(samplePath);
    const fileName = `receipt_test_${Date.now()}.jpg`;
    const { data, error } = await supabase.storage
      .from('receipts')
      .upload(fileName, file);
    if (error) {
      console.error('Upload error:', error);
      process.exit(1);
    }

    const { data: signedData, error: signedError } = await supabase.storage
      .from('receipts')
      .createSignedUrl(fileName, 300);
    if (signedError) {
      console.error('Signed URL error:', signedError);
      process.exit(1);
    }

    console.log('Uploaded. signedUrl:', signedData.signedUrl);
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

run();
