// Debug script untuk melihat data profiles
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function debugProfiles() {
  console.log('🔍 Debugging profiles data...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase config missing');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    console.log('📡 Fetching profiles...');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, staff_role, main_role')
      .limit(10);
    
    if (error) {
      console.error('❌ Error:', error);
      return;
    }
    
    console.log(`✅ Found ${data?.length || 0} profiles`);
    
    if (data && data.length > 0) {
      data.forEach((profile, index) => {
        console.log(`\n👤 Profile ${index + 1}:`);
        console.log(`   ID: ${profile.id}`);
        console.log(`   Name: ${profile.first_name} ${profile.last_name}`);
        console.log(`   Email: ${profile.email}`);
        console.log(`   Main Role: ${profile.main_role}`);
        console.log(`   Staff Role: ${JSON.stringify(profile.staff_role)} (${typeof profile.staff_role})`);
      });
      
      // Count by role
      const roleCount = {
        anr: 0,
        composer: 0,
        producer: 0,
        engineer: 0
      };
      
      data.forEach(profile => {
        if (profile.main_role === 'client') return;
        
        let staffRoles = [];
        if (Array.isArray(profile.staff_role)) {
          staffRoles = profile.staff_role;
        } else if (typeof profile.staff_role === 'string') {
          staffRoles = [profile.staff_role];
        }
        
        staffRoles.forEach(role => {
          if (roleCount[role] !== undefined) {
            roleCount[role]++;
          }
        });
      });
      
      console.log('\n📊 Role Distribution:');
      console.log(`   A&R: ${roleCount.anr}`);
      console.log(`   Composer: ${roleCount.composer}`);
      console.log(`   Producer: ${roleCount.producer}`);
      console.log(`   Engineer: ${roleCount.engineer}`);
    } else {
      console.log('❌ No profiles found');
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

debugProfiles();
