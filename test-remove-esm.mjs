// Simple Node.js test for remove assignment API
import fetch from 'node-fetch';

const testRemove = async () => {
  try {
    console.log('Testing remove assignment API...');
    
    const response = await fetch('http://localhost:3000/api/assignments?project_id=proj_prd2025_0006&role=anr', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status:', response.status);
    const result = await response.text();
    console.log('Response:', result);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
};

testRemove();
