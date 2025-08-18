// Debug URL Generator untuk GitHub Copilot
console.log('🤖 GitHub Copilot Debug Access URLs');
console.log('=====================================\n');

const baseUrl = 'http://localhost:3000';
const debugKey = 'copilot-debug-2025-fmg-industry-hub';

const adminPages = [
  { name: 'Admin Projects', path: '/admin/projects' },
  { name: 'Admin Users', path: '/admin/users' },
  { name: 'Admin Dashboard', path: '/admin/dashboard' },
  { name: 'Admin Settings', path: '/admin/settings' }
];

console.log('🔗 Admin Pages dengan Debug Bypass:');
console.log('-----------------------------------');
adminPages.forEach((page, index) => {
  const debugUrl = `${baseUrl}${page.path}?debug_key=${debugKey}`;
  console.log(`${index + 1}. ${page.name}:`);
  console.log(`   ${debugUrl}\n`);
});

console.log('🛡️  Security Notes:');
console.log('- Debug key hanya bekerja di development mode');
console.log('- Key ini HARUS dihapus sebelum production');
console.log('- Hanya untuk debugging GitHub Copilot\n');

console.log('🔧 Usage:');
console.log('1. Copy URL di atas');
console.log('2. Paste ke browser');
console.log('3. Debug authentication akan di-bypass');
console.log('4. Anda bisa akses halaman admin tanpa login\n');

console.log('✅ Debug URLs ready!');
