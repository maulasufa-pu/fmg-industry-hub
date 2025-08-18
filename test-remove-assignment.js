// Test remove assignment API endpoint
const fetch = require('node-fetch');

async function testRemoveAssignment() {
  console.log("Testing remove assignment API...");
  
  const projectId = "7f163957-9e5a-4729-936d-c4ebb0cbd034";
  const role = "producer"; // Remove producer assignment
  
  try {
    console.log(`Removing ${role} assignment for project ${projectId}...`);
    
    const response = await fetch(`http://localhost:3000/api/assignments?project_id=${projectId}&role=${role}`, {
      method: 'DELETE',
    });
    
    console.log(`Response status: ${response.status}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log("Success:", result);
    } else {
      const errorData = await response.json();
      console.error("API Error:", errorData);
    }

  } catch (error) {
    console.error("Test error:", error);
  }
}

testRemoveAssignment();
