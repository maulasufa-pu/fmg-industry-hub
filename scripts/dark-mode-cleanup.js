#!/usr/bin/env node

/**
 * Dark Mode Class Cleanup Script
 * 
 * Script ini membersihkan duplikasi class dark mode dan memastikan
 * background styling berfungsi dengan baik.
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

function cleanupDuplicateClasses(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Fix duplicate dark: classes
    const duplicatePatterns = [
      /dark:bg-gray-900\s+dark:bg-gray-900/g,
      /dark:bg-gray-800\s+dark:bg-gray-800/g,
      /dark:text-white\s+dark:text-white/g,
      /dark:text-gray-200\s+dark:text-gray-200/g,
      /dark:shadow-gray-800\/25\s+dark:shadow\s+dark:shadow-gray-800\/25-lg/g,
      /dark:shadow\s+dark:shadow-gray-800\/25-gray-800\/25-lg/g,
      /border-\[var\(--border\)\]\s+border-\[var\(--border\)\]/g,
    ];

    const replacements = [
      'dark:bg-gray-900',
      'dark:bg-gray-800', 
      'dark:text-white',
      'dark:text-gray-200',
      'dark:shadow-lg',
      'dark:shadow-lg',
      'border-[var(--border)]',
    ];

    duplicatePatterns.forEach((pattern, index) => {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacements[index]);
        modified = true;
      }
    });

    // Add missing dark mode classes for common light backgrounds
    const backgroundFixes = [
      {
        pattern: /className="([^"]*\bbg-white\b[^"]*)"(?!\s+dark:)/g,
        replacement: (match, classes) => {
          if (!classes.includes('dark:')) {
            return `className="${classes} dark:bg-gray-900"`;
          }
          return match;
        }
      },
      {
        pattern: /className="([^"]*\bbg-gray-50\b[^"]*)"(?!\s+dark:)/g,
        replacement: (match, classes) => {
          if (!classes.includes('dark:bg-')) {
            return `className="${classes} dark:bg-gray-800"`;
          }
          return match;
        }
      },
      {
        pattern: /className="([^"]*\btext-gray-900\b[^"]*)"(?!\s+dark:)/g,
        replacement: (match, classes) => {
          if (!classes.includes('dark:text-')) {
            return `className="${classes} dark:text-white"`;
          }
          return match;
        }
      }
    ];

    backgroundFixes.forEach(({ pattern, replacement }) => {
      const newContent = content.replace(pattern, replacement);
      if (newContent !== content) {
        content = newContent;
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

  console.log('🧹 Starting Dark Mode Cleanup...');
  console.log('📁 Processing directory:', srcPath);
  
  const allFiles = getAllFiles(srcPath);
  let fixedCount = 0;

  allFiles.forEach(file => {
    if (cleanupDuplicateClasses(file)) {
      console.log(`✅ Fixed: ${path.relative(process.cwd(), file)}`);
      fixedCount++;
    }
  });

  console.log('\n🎉 Dark Mode Cleanup Complete!');
  console.log(`📊 Files processed: ${allFiles.length}`);
  console.log(`🔧 Files fixed: ${fixedCount}`);
  
  if (fixedCount === 0) {
    console.log('✨ No issues found - dark mode classes are clean!');
  }
}

if (require.main === module) {
  main();
}

module.exports = { cleanupDuplicateClasses };
