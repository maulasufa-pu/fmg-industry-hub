// Test remove assignment with detailed error logging
const testRemoveAssignment = async () => {
  const projectId = 'proj_prd2025_0006';
  const role = 'anr';

  console.log('Testing remove assignment...');
  console.log('Project ID:', projectId);
  console.log('Role:', role);

  try {
    const response = await fetch(`http://localhost:3000/api/assignments?project_id=${projectId}&role=${role}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('Response status:', response.status);
    
    const result = await response.json();
    console.log('Response body:', JSON.stringify(result, null, 2));

    if (!response.ok) {
      console.error('Request failed:', result);
    } else {
      console.log('Success:', result);
    }

  } catch (error) {
    console.error('Network/fetch error:', error);
  }
};

testRemoveAssignment();
