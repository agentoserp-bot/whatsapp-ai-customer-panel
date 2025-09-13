const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testAfterFix() {
  console.log('🔍 Testing Supabase after RLS fix...\n');
  
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !anonKey || !url.includes('supabase') || !anonKey.startsWith('eyJ')) {
    console.log('❌ Invalid Supabase credentials in .env file');
    return;
  }
  
  try {
    // Test with service role key first (bypasses RLS)
    const adminClient = createClient(url, serviceKey);
    console.log('🔌 Testing admin connection (service role)...');
    
    const { data: adminData, error: adminError } = await adminClient
      .from('users')
      .select('count')
      .limit(1);
    
    if (adminError) {
      if (adminError.message.includes('relation "users" does not exist')) {
        console.log('⚠️  Database connected but tables not created');
        console.log('📝 Run the main supabase-setup.sql script first');
        return;
      } else {
        console.log('❌ Admin connection failed:', adminError.message);
        return;
      }
    }
    
    console.log('✅ Admin connection successful');
    
    // Test with anon key (uses RLS policies)
    const anonClient = createClient(url, anonKey);
    console.log('🔌 Testing user connection (anon key)...');
    
    const { data: anonData, error: anonError } = await anonClient
      .from('users')
      .select('count')
      .limit(1);
    
    if (anonError) {
      if (anonError.message.includes('infinite recursion')) {
        console.log('❌ RLS policies still have recursion - fix not applied yet');
        console.log('📝 Please run the supabase-fix.sql script in Supabase dashboard');
      } else {
        console.log('✅ No recursion error - RLS policies fixed!');
        console.log('ℹ️  Error is expected (no authenticated user):', anonError.message);
      }
    } else {
      console.log('✅ Anon connection successful - RLS working correctly');
    }
    
    // Test policies existence
    const { data: policies, error: policyError } = await adminClient
      .rpc('sql', { 
        query: `SELECT COUNT(*) as count FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users'` 
      });
    
    if (!policyError && policies) {
      console.log(`✅ Found ${policies[0]?.count || 0} RLS policies for users table`);
    }
    
    console.log('\n🎉 Supabase configuration test completed!');
    
  } catch (err) {
    console.log('❌ Connection failed:', err.message);
  }
}

testAfterFix();
