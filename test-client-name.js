// Test script untuk check client_name column di project_summary view
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kwkchxcyicqdamdgjfxx.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3a2NoeGN5aWNxZGFtZGdqZnh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NTY2NzEsImV4cCI6MjA1MDUzMjY3MX0.8pZn58oG6vvlB2-xLa5kxQeKVWgqZL2N5mIGJ7aL7oE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testClientName() {
  try {
    console.log('Testing project_summary view schema...');
    
    // Test query with client_name
    const { data, error } = await supabase
      .from('project_summary')
      .select('project_id, title, client_id, client_name')
      .limit(1);
    
    if (error) {
      console.error('Error querying project_summary:', error.message);
      
      // Fallback: Check available columns
      const { data: schema, error: schemaError } = await supabase
        .from('project_summary')
        .select('*')
        .limit(1);
      
      if (schemaError) {
        console.error('Schema query error:', schemaError);
      } else {
        console.log('Available columns:', schema?.[0] ? Object.keys(schema[0]) : 'No data');
      }
    } else {
      console.log('Query successful!');
      console.log('Sample data:', data?.[0]);
      
      if (data?.[0]) {
        console.log('client_name available:', 'client_name' in data[0]);
        console.log('client_name value:', data[0].client_name);
      }
    }
  } catch (err) {
    console.error('Test failed:', err);
  }
}

testClientName();
