// Test script untuk format client name logic
console.log('🧪 Testing Client Name Formatting Logic\n');

// Mock data seperti yang akan datang dari database
const mockProfiles = [
  { id: 'user1', first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
  { id: 'user2', first_name: 'Jane', last_name: null, email: 'jane@example.com' },
  { id: 'user3', first_name: null, last_name: 'Smith', email: 'smith@example.com' },
  { id: 'user4', first_name: null, last_name: null, email: 'noprofile@example.com' },
  { id: 'user5', first_name: 'Very Long First Name', last_name: 'Very Long Last Name Also', email: 'long@example.com' }
];

// Simulate formatClientName function
function formatClientName(profile, maxLength = 25) {
  if (!profile) return '-';
  
  const firstName = profile.first_name?.trim() || "";
  const lastName = profile.last_name?.trim() || "";
  
  let fullName = "";
  if (firstName && lastName) {
    fullName = `${firstName} ${lastName}`;
  } else if (firstName) {
    fullName = firstName;
  } else if (lastName) {
    fullName = lastName;
  } else {
    fullName = profile.email || `User ${profile.id.slice(-8)}`;
  }
  
  // Apply clipping with ellipsis if too long
  if (fullName.length > maxLength) {
    return fullName.substring(0, maxLength - 3) + "...";
  }
  
  return fullName;
}

console.log('📊 Test Results:');
console.log('================');

mockProfiles.forEach((profile, index) => {
  const result = formatClientName(profile);
  console.log(`${index + 1}. Input:  ${JSON.stringify(profile, null, 2)}`);
  console.log(`   Output: "${result}"`);
  console.log(`   Length: ${result.length} chars`);
  console.log('');
});

console.log('✅ All tests completed!');
