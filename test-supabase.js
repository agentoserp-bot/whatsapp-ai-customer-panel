const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...\n');
  
  // Check environment variables
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('📊 Environment Variables:');
  console.log(`URL: ${url ? '✅ Set' : '❌ Missing'}`);
  console.log(`Anon Key: ${anonKey ? '✅ Set' : '❌ Missing'}`);
  console.log(`Service Key: ${serviceKey ? '✅ Set' : '❌ Missing'}\n`);
  
  if (!url || !anonKey) {
    console.log('❌ Missing required Supabase credentials in .env file');
    console.log('Please update server/.env with your Supabase credentials');
    return;
  }
  
  try {
    // Test connection with anon key
    const supabase = createClient(url, anonKey);
    console.log('🔌 Testing connection...');
    
    // Try a simple query to test connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error && error.message.includes('relation "users" does not exist')) {
      console.log('⚠️  Connection successful but tables not created yet');
      console.log('📝 Next step: Run the SQL setup script in Supabase dashboard');
      console.log('📁 Copy content from: supabase-setup.sql');
    } else if (error) {
      console.log('❌ Connection error:', error.message);
    } else {
      console.log('✅ Supabase connection successful!');
      console.log('✅ Database tables are ready');
    }
    
  } catch (err) {
    console.log('❌ Connection failed:', err.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check if your SUPABASE_URL is correct');
    console.log('2. Check if your SUPABASE_ANON_KEY is correct');
    console.log('3. Ensure your Supabase project is active');
  }
}

testSupabaseConnection();
