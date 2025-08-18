// Test remove assignment with better error handling
const testRemoveAssignment = async () => {
  try {
    console.log('Testing remove assignment...');
    
    // Use the correct project ID from browser
    const url = 'http://localhost:3000/api/assignments?project_id=7f163957-9e5a-4729-936d-c4ebb0cbd034&role=anr';
    console.log('URL:', url);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const text = await response.text();
    console.log('Response:', text);
    
    if (response.ok) {
      console.log('✅ Remove assignment successful!');
    } else {
      console.log('❌ Remove assignment failed');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

testRemoveAssignment();
