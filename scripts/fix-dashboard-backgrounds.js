#!/usr/bin/env node

/**
 * Dashboard Background Fix Script
 * 
 * Script khusus untuk memperbaiki background dashboard
 * yang masih menggunakan warna terang di dark mode.
 */

const fs = require('fs');
const path = require('path');

const validExtensions = ['.tsx', '.jsx', '.ts', '.js'];

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    
    if (fs.statSync(fullPath).isDirectory()) {
      if (!['node_modules', '.next', '.git', 'coverage'].includes(file)) {
        arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
      }
    } else if (validExtensions.includes(path.extname(file))) {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

function fixDashboardBackgrounds(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Fix specific dashboard background patterns
    const dashboardFixes = [
      {
        // Main dashboard container backgrounds
        pattern: /bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100(?!\s+dark:)/g,
        replacement: 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700'
      },
      {
        // Gradient cards
        pattern: /bg-gradient-to-br from-white to-gray-50(?!\s+dark:)/g,
        replacement: 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700'
      },
      {
        // Loading skeletons
        pattern: /bg-gradient-to-r from-gray-300 to-gray-200(?!\s+dark:)/g,
        replacement: 'bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-600 dark:to-gray-500'
      },
      {
        pattern: /bg-gradient-to-r from-gray-400 to-gray-300(?!\s+dark:)/g,
        replacement: 'bg-gradient-to-r from-gray-400 to-gray-300 dark:from-gray-500 dark:to-gray-400'
      },
      {
        pattern: /bg-gradient-to-r from-gray-200 to-gray-100(?!\s+dark:)/g,
        replacement: 'bg-gradient-to-r from-gray-200 to-gray-100 dark:from-gray-700 dark:to-gray-600'
      },
      {
        // Blue loading elements
        pattern: /bg-gradient-to-r from-blue-300 to-blue-200(?!\s+dark:)/g,
        replacement: 'bg-gradient-to-r from-blue-300 to-blue-200 dark:from-blue-600 dark:to-blue-500'
      },
      {
        // White panels
        pattern: /bg-white(?!\s+dark:)(?=\s|")/g,
        replacement: 'bg-white dark:bg-gray-800'
      },
      {
        // Gray light backgrounds
        pattern: /bg-gray-50(?!\s+dark:)(?=\s|")/g,
        replacement: 'bg-gray-50 dark:bg-gray-800'
      },
      {
        // Text gradients
        pattern: /bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-600(?!\s+dark:)/g,
        replacement: 'bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-600 dark:from-gray-100 dark:via-blue-200 dark:to-indigo-300'
      },
      {
        // Error banners
        pattern: /bg-gradient-to-r from-red-50 to-rose-50(?!\s+dark:)/g,
        replacement: 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30'
      },
      {
        // Shimmer effects
        pattern: /via-white(?!\s+dark:)/g,
        replacement: 'via-white dark:via-gray-300'
      }
    ];

    dashboardFixes.forEach(({ pattern, replacement }) => {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        modified = true;
      }
    });

    // Fix border colors that often go with backgrounds
    const borderFixes = [
      {
        pattern: /border-gray-100(?!\s+dark:)/g,
        replacement: 'border-gray-100 dark:border-gray-600'
      },
      {
        pattern: /border-gray-200(?!\s+dark:)(?=\s|")/g,
        replacement: 'border-gray-200 dark:border-gray-600'
      },
      {
        pattern: /border-white(?!\s+dark:)/g,
        replacement: 'border-white dark:border-gray-600'
      }
    ];

    borderFixes.forEach(({ pattern, replacement }) => {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        modified = true;
      }
    });

    // Fix text colors
    const textFixes = [
      {
        pattern: /text-gray-500(?!\s+dark:)/g,
        replacement: 'text-gray-500 dark:text-gray-400'
      },
      {
        pattern: /text-gray-600(?!\s+dark:)/g,
        replacement: 'text-gray-600 dark:text-gray-300'
      },
      {
        pattern: /text-gray-700(?!\s+dark:)/g,
        replacement: 'text-gray-700 dark:text-gray-200'
      },
      {
        pattern: /text-gray-900(?!\s+dark:)(?=\s|")/g,
        replacement: 'text-gray-900 dark:text-white'
      }
    ];

    textFixes.forEach(({ pattern, replacement }) => {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
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

  console.log('🎨 Starting Dashboard Background Fix...');
  console.log('📁 Processing directory:', srcPath);
  
  const allFiles = getAllFiles(srcPath);
  let fixedCount = 0;

  // Focus on dashboard and main UI files
  const dashboardFiles = allFiles.filter(file => 
    file.includes('dashboard') || 
    file.includes('page.tsx') ||
    file.includes('layout.tsx') ||
    file.includes('Admin') ||
    file.includes('Client')
  );

  dashboardFiles.forEach(file => {
    if (fixDashboardBackgrounds(file)) {
      console.log(`✅ Fixed: ${path.relative(process.cwd(), file)}`);
      fixedCount++;
    }
  });

  console.log('\n🎉 Dashboard Background Fix Complete!');
  console.log(`📊 Files processed: ${dashboardFiles.length}`);
  console.log(`🔧 Files fixed: ${fixedCount}`);
  
  if (fixedCount === 0) {
    console.log('✨ No dashboard background issues found!');
  } else {
    console.log('\n🌙 Dashboard backgrounds now properly support dark mode!');
    console.log('💡 Try switching to dark mode to see the improvements.');
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixDashboardBackgrounds };
