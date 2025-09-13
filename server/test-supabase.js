const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...\n');
  
  // Check environment variables
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('📊 Environment Variables:');
  console.log(`URL: ${url ? (url.includes('supabase') ? '✅ Set' : '❌ Invalid format') : '❌ Missing'}`);
  console.log(`Anon Key: ${anonKey ? (anonKey.startsWith('eyJ') ? '✅ Set' : '❌ Invalid format') : '❌ Missing'}`);
  console.log(`Service Key: ${serviceKey ? (serviceKey.startsWith('eyJ') ? '✅ Set' : '❌ Invalid format') : '❌ Missing'}\n`);
  
  if (!url || !anonKey || !url.includes('supabase') || !anonKey.startsWith('eyJ')) {
    console.log('❌ Please update your .env file with real Supabase credentials');
    console.log('\n🔧 How to get credentials:');
    console.log('1. Go to https://supabase.com and create a project');
    console.log('2. Go to Settings → API');
    console.log('3. Copy Project URL and anon/public key');
    console.log('4. Update server/.env file\n');
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
      console.log('📁 Copy content from: ../supabase-setup.sql');
    } else if (error) {
      console.log('❌ Connection error:', error.message);
    } else {
      console.log('✅ Supabase connection successful!');
      console.log('✅ Database tables are ready');
    }
    
  } catch (err) {
    console.log('❌ Connection failed:', err.message);
  }
}

testSupabaseConnection();
