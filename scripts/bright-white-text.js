#!/usr/bin/env node

/**
 * Bright White Text Script
 * 
 * Membuat semua text putih terang dan nyala di dark mode
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

function makeBrightWhiteText(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Bright white text patterns
    const brightTextEnhancements = [
      // Icon colors - make white in dark mode
      {
        pattern: /dark:text-slate-200/g,
        replacement: 'dark:text-white'
      },
      {
        pattern: /dark:text-gray-200/g,
        replacement: 'dark:text-white'
      },
      {
        pattern: /dark:text-blue-200/g,
        replacement: 'dark:text-white'
      },
      {
        pattern: /dark:text-green-200/g,
        replacement: 'dark:text-white'
      },
      {
        pattern: /dark:text-orange-200/g,
        replacement: 'dark:text-white'
      },
      {
        pattern: /dark:text-red-200/g,
        replacement: 'dark:text-white'
      },
      {
        pattern: /dark:text-purple-200/g,
        replacement: 'dark:text-white'
      },
      {
        pattern: /dark:text-pink-200/g,
        replacement: 'dark:text-white'
      },
      {
        pattern: /dark:text-sky-200/g,
        replacement: 'dark:text-white'
      },
      {
        pattern: /dark:text-emerald-200/g,
        replacement: 'dark:text-white'
      },
      {
        pattern: /dark:text-amber-200/g,
        replacement: 'dark:text-white'
      },
      {
        pattern: /dark:text-rose-200/g,
        replacement: 'dark:text-white'
      },
      {
        pattern: /dark:text-violet-200/g,
        replacement: 'dark:text-white'
      },

      // Label text colors - make bright in dark mode
      {
        pattern: /dark:text-gray-400/g,
        replacement: 'dark:text-white'
      },
      {
        pattern: /dark:text-slate-400/g,
        replacement: 'dark:text-white'
      },

      // Trend colors - make brighter in dark mode
      {
        pattern: /dark:text-green-200/g,
        replacement: 'dark:text-green-100'
      },
      {
        pattern: /dark:text-red-200/g,
        replacement: 'dark:text-red-100'
      },

      // General text improvements
      {
        pattern: /text-gray-500 dark:text-gray-400/g,
        replacement: 'text-gray-600 dark:text-white'
      },
      {
        pattern: /text-gray-600 dark:text-gray-200/g,
        replacement: 'text-gray-600 dark:text-white'
      },

      // Duplicated dark text patterns
      {
        pattern: /dark:text-gray-200 dark:text-gray-200/g,
        replacement: 'dark:text-white'
      },
      {
        pattern: /dark:text-gray-400 dark:text-gray-400/g,
        replacement: 'dark:text-white'
      }
    ];

    // Apply bright text enhancements
    brightTextEnhancements.forEach(enhancement => {
      if (enhancement.pattern.test(content)) {
        content = content.replace(enhancement.pattern, enhancement.replacement);
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
  console.log('💡 Membuat text putih terang dan nyala di dark mode...\n');

  const srcPath = path.join(process.cwd(), 'src');
  
  if (!fs.existsSync(srcPath)) {
    console.error('❌ Direktori src tidak ditemukan!');
    process.exit(1);
  }

  const allFiles = getAllFiles(srcPath);
  let processedFiles = 0;

  allFiles.forEach(filePath => {
    if (makeBrightWhiteText(filePath)) {
      console.log(`💡 Bright text: ${path.relative(process.cwd(), filePath)}`);
      processedFiles++;
    }
  });

  console.log('\n🎉 Bright white text berhasil diterapkan!');
  console.log(`📊 Total files processed: ${processedFiles}`);
  console.log('\n✨ Perubahan yang diterapkan:');
  console.log('  💡 Text labels: putih terang di dark mode');
  console.log('  🔆 Icon colors: putih nyala di dark mode');
  console.log('  ⭐ Trend colors: lebih terang dan kontras');
  console.log('  🌟 General text: bright white consistency');
  console.log('\n🚀 Text sekarang putih terang dan nyala di dark mode!');
}

if (require.main === module) {
  main();
}

module.exports = { makeBrightWhiteText };
