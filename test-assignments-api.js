// Test assignment API endpoint
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://fxowjbbfsemnwchzfxdf.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4b3dqYmJmc2VtbndjaHpmeGRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU5ODA4NCwiZXhwIjoyMDcwMTc0MDg0fQ.vyP5D_TZu1tw457DJmmm4Y4E9wPrOEVT25ivXZfic2I";

async function testAssignmentsAPI() {
  console.log("Testing assignments API...");
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const projectId = "7f163957-9e5a-4729-936d-c4ebb0cbd034";

  try {
    console.log("1. Testing direct Supabase query...");
    
    const { data: assignments, error } = await supabase
      .from('assignments')
      .select(`
        user_id,
        role,
        active,
        assigned_at,
        profiles!assignments_user_id_fkey(id, first_name, last_name, email)
      `)
      .eq('project_id', projectId)
      .eq('active', true);

    if (error) {
      console.error('Supabase query error:', error);
      return;
    }

    console.log('Found assignments:', assignments?.length || 0);
    if (assignments) {
      assignments.forEach(assignment => {
        const profile = assignment.profiles;
        const firstName = profile.first_name?.trim() || "";
        const lastName = profile.last_name?.trim() || "";
        const displayName = (firstName || lastName) 
          ? `${firstName} ${lastName}`.trim() 
          : profile.email || "";
        
        console.log(`- ${assignment.role}: ${displayName} (ID: ${assignment.user_id})`);
      });
    }

    console.log("\n2. Testing API endpoint...");
    
    // Test API endpoint
    const response = await fetch(`http://localhost:3002/api/assignments?project_id=${projectId}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log("API Response:", result);
    } else {
      console.error("API Error:", response.status, await response.text());
    }

  } catch (error) {
    console.error("Test error:", error);
  }
}

testAssignmentsAPI();
