#!/usr/bin/env node

/**
 * Dark Mode Auto-Converter Script
 * 
 * Script ini secara otomatis menambahkan dark mode classes ke komponen-komponen
 * yang sudah ada tanpa mengubah fungsionalitas asli.
 */

const fs = require('fs');
const path = require('path');

// Mapping common light mode classes to dark mode equivalents
const darkModeMapping = {
  // Background colors
  'bg-white': 'bg-white dark:bg-gray-900',
  'bg-gray-50': 'bg-gray-50 dark:bg-gray-800',
  'bg-gray-100': 'bg-gray-100 dark:bg-gray-800',
  'bg-gray-200': 'bg-gray-200 dark:bg-gray-700',
  'bg-gray-300': 'bg-gray-300 dark:bg-gray-600',
  'bg-blue-50': 'bg-blue-50 dark:bg-blue-900/20',
  'bg-green-50': 'bg-green-50 dark:bg-green-900/20',
  'bg-red-50': 'bg-red-50 dark:bg-red-900/20',
  'bg-yellow-50': 'bg-yellow-50 dark:bg-yellow-900/20',
  
  // Text colors
  'text-gray-900': 'text-gray-900 dark:text-white',
  'text-gray-800': 'text-gray-800 dark:text-gray-100',
  'text-gray-700': 'text-gray-700 dark:text-gray-200',
  'text-gray-600': 'text-gray-600 dark:text-gray-300',
  'text-gray-500': 'text-gray-500 dark:text-gray-400',
  'text-black': 'text-black dark:text-white',
  
  // Border colors
  'border-gray-200': 'border-gray-200 dark:border-gray-700',
  'border-gray-300': 'border-gray-300 dark:border-gray-600',
  'border-white': 'border-white dark:border-gray-700',
  
  // Ring colors
  'ring-gray-300': 'ring-gray-300 dark:ring-gray-600',
  
  // Shadow
  'shadow': 'shadow dark:shadow-gray-800/25',
  'shadow-sm': 'shadow-sm dark:shadow-gray-800/25',
  'shadow-md': 'shadow-md dark:shadow-gray-800/25',
  'shadow-lg': 'shadow-lg dark:shadow-gray-800/25',
  
  // Custom variables
  'bg-defaultwhite': 'bg-defaultwhite dark:bg-gray-900',
  'bg-[var(--card)]': 'bg-[var(--card)]', // Already using CSS variables
  'border-[var(--border)]': 'border-[var(--border)]', // Already using CSS variables
};

// File extensions to process
const validExtensions = ['.tsx', '.jsx', '.ts', '.js'];

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    
    if (fs.statSync(fullPath).isDirectory()) {
      // Skip node_modules and .next directories
      if (!['node_modules', '.next', '.git', 'coverage'].includes(file)) {
        arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
      }
    } else if (validExtensions.includes(path.extname(file))) {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

function convertFileToDarkMode(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Apply dark mode mappings
    Object.entries(darkModeMapping).forEach(([lightClass, darkClass]) => {
      const regex = new RegExp(`\\b${lightClass}\\b`, 'g');
      if (regex.test(content)) {
        content = content.replace(regex, darkClass);
        modified = true;
      }
    });

    // Save if modified
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Converted: ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  const srcPath = path.join(process.cwd(), 'src');
  
  if (!fs.existsSync(srcPath)) {
    console.error('❌ src directory not found!');
    process.exit(1);
  }

  console.log('🌙 Starting Dark Mode Auto-Conversion...');
  console.log('📁 Processing directory:', srcPath);
  
  const allFiles = getAllFiles(srcPath);
  let convertedCount = 0;

  allFiles.forEach(file => {
    if (convertFileToDarkMode(file)) {
      convertedCount++;
    }
  });

  console.log('\n🎉 Dark Mode Conversion Complete!');
  console.log(`📊 Files processed: ${allFiles.length}`);
  console.log(`✨ Files converted: ${convertedCount}`);
  console.log('\n🔧 Next steps:');
  console.log('1. Test your application in both light and dark mode');
  console.log('2. Fine-tune any styling that needs adjustment');
  console.log('3. Add custom dark mode styles where needed');
}

if (require.main === module) {
  main();
}
