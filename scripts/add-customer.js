require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addCustomer(phoneNumber, name, email, accountStatus = 'active', metadata = {}) {
  try {
    console.log(`Adding customer: ${name} (${phoneNumber})`);

    const { data, error } = await supabase
      .from('customers')
      .insert({
        phone_number: phoneNumber,
        name: name,
        email: email,
        account_status: accountStatus,
        metadata: metadata,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        console.error('Error: Customer with this phone number already exists');
        
        // Try to update instead
        const { data: updated, error: updateError } = await supabase
          .from('customers')
          .update({
            name: name,
            email: email,
            account_status: accountStatus,
            metadata: metadata,
          })
          .eq('phone_number', phoneNumber)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        console.log('✓ Customer updated successfully!');
        console.log(updated);
        return updated;
      }
      throw error;
    }

    console.log('✓ Customer added successfully!');
    console.log(data);
    return data;
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

async function listCustomers() {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log('\n📋 Current Customers:');
    console.log('─────────────────────────────────────────');
    if (data.length === 0) {
      console.log('No customers found.');
    } else {
      data.forEach((customer, index) => {
        console.log(`${index + 1}. ${customer.name}`);
        console.log(`   Phone: ${customer.phone_number}`);
        console.log(`   Email: ${customer.email || 'N/A'}`);
        console.log(`   Status: ${customer.account_status}`);
        console.log(`   Tier: ${customer.metadata?.tier || 'standard'}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('Error listing customers:', error.message);
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args[0] === 'list') {
    await listCustomers();
    return;
  }

  if (args.length < 2) {
    console.log('Usage:');
    console.log('  node scripts/add-customer.js <phone> <name> [email] [status] [tier]');
    console.log('  node scripts/add-customer.js list');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/add-customer.js "+12545365989" "Ryan Johnson" "ryan@gmail.com" "premium" "gold"');
    console.log('  node scripts/add-customer.js "+11234567890" "Sarah Smith"');
    console.log('  node scripts/add-customer.js list');
    process.exit(1);
  }

  const phoneNumber = args[0];
  const name = args[1];
  const email = args[2] || null;
  const accountStatus = args[3] || 'active';
  const tier = args[4] || 'standard';

  await addCustomer(phoneNumber, name, email, accountStatus, { tier });
  console.log('');
  await listCustomers();
}

main();

