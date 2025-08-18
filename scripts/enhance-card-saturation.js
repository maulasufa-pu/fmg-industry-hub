#!/usr/bin/env node

/**
 * Dark Mode Card Saturation Fix Script
 * 
 * Script untuk meningkatkan saturasi dan kegelapan cards
 * agar terlihat lebih baik di dark mode.
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

function enhanceCardSaturation(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Enhanced dark mode card colors with higher saturation
    const cardEnhancements = [
      {
        // Blue cards - make darker and more saturated
        pattern: /dark:from-blue-900\/40 dark:to-indigo-800\/40/g,
        replacement: 'dark:from-blue-900/70 dark:to-indigo-800/70'
      },
      {
        // Green cards
        pattern: /dark:from-emerald-900\/40 dark:to-green-800\/40/g,
        replacement: 'dark:from-emerald-900/70 dark:to-green-800/70'
      },
      {
        // Orange cards  
        pattern: /dark:from-orange-900\/40 dark:to-amber-800\/40/g,
        replacement: 'dark:from-orange-900/70 dark:to-amber-800/70'
      },
      {
        // Red cards
        pattern: /dark:from-red-900\/40 dark:to-rose-800\/40/g,
        replacement: 'dark:from-red-900/70 dark:to-rose-800/70'
      },
      {
        // Purple cards
        pattern: /dark:from-purple-900\/40 dark:to-violet-800\/40/g,
        replacement: 'dark:from-purple-900/70 dark:to-violet-800/70'
      },
      {
        // Gray cards
        pattern: /dark:from-gray-800\/60 dark:to-slate-700\/60/g,
        replacement: 'dark:from-gray-800/80 dark:to-slate-700/80'
      },
      {
        // Generic light cards - make them darker
        pattern: /bg-gray-50(?!\s+dark:)/g,
        replacement: 'bg-gray-50 dark:bg-gray-800/60'
      },
      {
        pattern: /bg-blue-50(?!\s+dark:)/g,
        replacement: 'bg-blue-50 dark:bg-blue-900/60'
      },
      {
        pattern: /bg-green-50(?!\s+dark:)/g,
        replacement: 'bg-green-50 dark:bg-green-900/60'
      },
      {
        pattern: /bg-red-50(?!\s+dark:)/g,
        replacement: 'bg-red-50 dark:bg-red-900/60'
      },
      {
        pattern: /bg-orange-50(?!\s+dark:)/g,
        replacement: 'bg-orange-50 dark:bg-orange-900/60'
      },
      {
        pattern: /bg-purple-50(?!\s+dark:)/g,
        replacement: 'bg-purple-50 dark:bg-purple-900/60'
      }
    ];

    cardEnhancements.forEach(({ pattern, replacement }) => {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        modified = true;
      }
    });

    // Enhance border colors too
    const borderEnhancements = [
      {
        pattern: /border-blue-200(?!\s+dark:)/g,
        replacement: 'border-blue-200 dark:border-blue-600'
      },
      {
        pattern: /border-green-200(?!\s+dark:)/g,
        replacement: 'border-green-200 dark:border-green-600'
      },
      {
        pattern: /border-red-200(?!\s+dark:)/g,
        replacement: 'border-red-200 dark:border-red-600'
      },
      {
        pattern: /border-orange-200(?!\s+dark:)/g,
        replacement: 'border-orange-200 dark:border-orange-600'
      },
      {
        pattern: /border-purple-200(?!\s+dark:)/g,
        replacement: 'border-purple-200 dark:border-purple-600'
      },
      {
        pattern: /border-gray-700/g,
        replacement: 'border-gray-600'
      }
    ];

    borderEnhancements.forEach(({ pattern, replacement }) => {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        modified = true;
      }
    });

    // Enhance icon colors for better visibility
    const iconEnhancements = [
      {
        pattern: /text-blue-600(?!\s+dark:)/g,
        replacement: 'text-blue-600 dark:text-blue-200'
      },
      {
        pattern: /text-green-600(?!\s+dark:)/g,
        replacement: 'text-green-600 dark:text-green-200'
      },
      {
        pattern: /text-red-600(?!\s+dark:)/g,
        replacement: 'text-red-600 dark:text-red-200'
      },
      {
        pattern: /text-orange-600(?!\s+dark:)/g,
        replacement: 'text-orange-600 dark:text-orange-200'
      },
      {
        pattern: /text-purple-600(?!\s+dark:)/g,
        replacement: 'text-purple-600 dark:text-purple-200'
      },
      {
        pattern: /text-gray-300/g,
        replacement: 'text-gray-200'
      }
    ];

    iconEnhancements.forEach(({ pattern, replacement }) => {
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

  console.log('🎨 Starting Card Saturation Enhancement...');
  console.log('📁 Processing directory:', srcPath);
  
  const allFiles = getAllFiles(srcPath);
  let enhancedCount = 0;

  // Focus on dashboard and UI component files
  const targetFiles = allFiles.filter(file => 
    file.includes('dashboard') || 
    file.includes('admin') ||
    file.includes('client') ||
    file.includes('ui') ||
    file.includes('component')
  );

  targetFiles.forEach(file => {
    if (enhanceCardSaturation(file)) {
      console.log(`✅ Enhanced: ${path.relative(process.cwd(), file)}`);
      enhancedCount++;
    }
  });

  console.log('\n🎉 Card Saturation Enhancement Complete!');
  console.log(`📊 Files processed: ${targetFiles.length}`);
  console.log(`🔧 Files enhanced: ${enhancedCount}`);
  
  if (enhancedCount === 0) {
    console.log('✨ Card colors are already optimized!');
  } else {
    console.log('\n🌈 Cards now have better saturation and darkness in dark mode!');
    console.log('💡 Switch to dark mode to see the enhanced colors.');
  }
}

if (require.main === module) {
  main();
}

module.exports = { enhanceCardSaturation };
