const supabase = require('./node-supabase-client');

async function run() {
  try {
    // Find a test user - this script assumes an existing user created by e2e tests
    const { data: users } = await supabase.from('users').select('*').limit(1);
    if (!users || users.length === 0) {
      console.error(
        'No users found in `users` table. Create a user first or run e2e-auth.'
      );
      process.exit(1);
    }
    const user = users[0];

    const bill = {
      creator_id: user.user_id,
      total_amount: 1200.0,
      status: 'pending',
    };

    const { data: billData, error: billError } = await supabase
      .from('bills')
      .insert(bill)
      .select('*')
      .single();
    if (billError) throw billError;

    console.log('Created bill:', billData);

    const items = [
      {
        bill_id: billData.bill_id,
        name: 'Jollof Rice',
        price: 500.0,
        quantity: 1,
      },
      { bill_id: billData.bill_id, name: 'Soda', price: 200.0, quantity: 2 },
    ];

    const { data: itemsData, error: itemsError } = await supabase
      .from('bill_items')
      .insert(items)
      .select('*');
    if (itemsError) throw itemsError;

    console.log('Created items:', itemsData);
  } catch (e) {
    console.error('Error during manual bill create test:', e);
    process.exitCode = 1;
  }
}

run();
