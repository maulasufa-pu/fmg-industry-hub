// API route for debug profiles
import { getSupabaseClient } from '@/lib/supabase/client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    
    console.log('🔍 [API] Fetching profiles...');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, staff_role, main_role')
      .limit(10);
    
    if (error) {
      console.error('❌ [API] Error:', error);
      return NextResponse.json({ 
        error: error.message,
        details: error 
      }, { status: 500 });
    }
    
    console.log(`✅ [API] Found ${data?.length || 0} profiles`);
    
    const roleCount: { [key: string]: number } = { anr: 0, composer: 0, producer: 0, engineer: 0 };
    const processedProfiles = data?.map((profile: any) => {
      let staffRoles: string[] = [];
      if (Array.isArray(profile.staff_role)) {
        staffRoles = profile.staff_role;
      } else if (typeof profile.staff_role === 'string') {
        staffRoles = [profile.staff_role];
      }
      
      staffRoles.forEach((role: string) => {
        if (roleCount[role] !== undefined) {
          roleCount[role]++;
        }
      });
      
      return {
        ...profile,
        staff_role_processed: staffRoles,
        staff_role_type: typeof profile.staff_role
      };
    });
    
    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      profiles: processedProfiles,
      roleCount
    });
    
  } catch (err: any) {
    console.error('❌ [API] Unexpected error:', err);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: err?.message || 'Unknown error'
    }, { status: 500 });
  }
}
