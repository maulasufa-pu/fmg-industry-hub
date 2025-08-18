// src/scripts/check-user-role.mjs
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

// Create admin client
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkUserRoles() {
  try {
    console.log('🔍 Checking all users and their roles...\n');
    
    // Get all profiles
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('❌ Error fetching profiles:', error);
      return;
    }
    
    if (!profiles || profiles.length === 0) {
      console.log('📝 No profiles found in database');
      return;
    }
    
    console.log(`📊 Found ${profiles.length} profiles:\n`);
    
    profiles.forEach((profile, index) => {
      console.log(`${index + 1}. Profile:`);
      console.log(`   ID: ${profile.id}`);
      console.log(`   Name: ${profile.name || 'null'}`);
      console.log(`   Email: ${profile.email || 'null'}`);
      console.log(`   Role: ${profile.role || 'null'}`);
      console.log(`   Created: ${profile.created_at}`);
      console.log(`   Can Access Admin: ${profile.role === 'admin' || profile.role === 'owner' ? '✅ YES' : '❌ NO'}`);
      console.log('');
    });
    
    // Check for owner role specifically
    const owners = profiles.filter(p => p.role === 'owner');
    const admins = profiles.filter(p => p.role === 'admin');
    
    console.log(`👑 Owners: ${owners.length}`);
    console.log(`🛡️  Admins: ${admins.length}`);
    console.log(`👤 Clients: ${profiles.length - owners.length - admins.length}`);
    
    if (owners.length === 0) {
      console.log('⚠️  WARNING: No owner found! This might be the issue.');
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

checkUserRoles();
