#!/usr/bin/env node

/**
 * Higher Opacity Color Enhancement Script
 * 
 * Menaikkan opacity dari 80% ke 95% untuk warna yang lebih solid dan jelas
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

function increaseOpacity(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Higher opacity patterns - from 80% to 95%
    const opacityEnhancements = [
      // Dark slate patterns
      {
        pattern: /dark:from-slate-800\/80 dark:to-slate-700\/80/g,
        replacement: 'dark:from-slate-700/95 dark:to-slate-600/95'
      },
      {
        pattern: /dark:from-slate-800\/90 dark:to-slate-700\/90/g,
        replacement: 'dark:from-slate-700/95 dark:to-slate-600/95'
      },
      
      // Sky/Cyan patterns
      {
        pattern: /dark:from-slate-800\/80 dark:to-sky-900\/80/g,
        replacement: 'dark:from-sky-800/95 dark:to-cyan-800/95'
      },
      
      // Emerald/Teal patterns
      {
        pattern: /dark:from-slate-800\/80 dark:to-emerald-900\/80/g,
        replacement: 'dark:from-emerald-800/95 dark:to-teal-800/95'
      },
      
      // Amber/Orange patterns
      {
        pattern: /dark:from-slate-800\/80 dark:to-amber-900\/80/g,
        replacement: 'dark:from-amber-800/95 dark:to-orange-800/95'
      },
      
      // Rose/Pink patterns
      {
        pattern: /dark:from-slate-800\/80 dark:to-rose-900\/80/g,
        replacement: 'dark:from-rose-800/95 dark:to-pink-800/95'
      },
      
      // Violet/Purple patterns
      {
        pattern: /dark:from-slate-800\/80 dark:to-violet-900\/80/g,
        replacement: 'dark:from-violet-800/95 dark:to-purple-800/95'
      }
    ];

    // Border color improvements - from 400/500 to 300/400
    const borderEnhancements = [
      {
        pattern: /dark:border-slate-500/g,
        replacement: 'dark:border-slate-400'
      },
      {
        pattern: /dark:border-sky-400/g,
        replacement: 'dark:border-sky-300'
      },
      {
        pattern: /dark:border-emerald-400/g,
        replacement: 'dark:border-emerald-300'
      },
      {
        pattern: /dark:border-amber-400/g,
        replacement: 'dark:border-amber-300'
      },
      {
        pattern: /dark:border-rose-400/g,
        replacement: 'dark:border-rose-300'
      },
      {
        pattern: /dark:border-violet-400/g,
        replacement: 'dark:border-violet-300'
      }
    ];

    // Icon color improvements - from 300 to 200, from 200 to 100
    const iconEnhancements = [
      {
        pattern: /dark:text-slate-200/g,
        replacement: 'dark:text-slate-100'
      },
      {
        pattern: /dark:text-sky-300/g,
        replacement: 'dark:text-sky-200'
      },
      {
        pattern: /dark:text-emerald-300/g,
        replacement: 'dark:text-emerald-200'
      },
      {
        pattern: /dark:text-amber-300/g,
        replacement: 'dark:text-amber-200'
      },
      {
        pattern: /dark:text-rose-300/g,
        replacement: 'dark:text-rose-200'
      },
      {
        pattern: /dark:text-violet-300/g,
        replacement: 'dark:text-violet-200'
      }
    ];

    // Apply opacity enhancements
    opacityEnhancements.forEach(enhancement => {
      if (enhancement.pattern.test(content)) {
        content = content.replace(enhancement.pattern, enhancement.replacement);
        modified = true;
      }
    });

    // Apply border enhancements
    borderEnhancements.forEach(enhancement => {
      if (enhancement.pattern.test(content)) {
        content = content.replace(enhancement.pattern, enhancement.replacement);
        modified = true;
      }
    });

    // Apply icon enhancements
    iconEnhancements.forEach(enhancement => {
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
  console.log('🔥 Menaikkan opacity warna cards untuk hasil lebih solid...\n');

  const srcPath = path.join(process.cwd(), 'src');
  
  if (!fs.existsSync(srcPath)) {
    console.error('❌ Direktori src tidak ditemukan!');
    process.exit(1);
  }

  const allFiles = getAllFiles(srcPath);
  let processedFiles = 0;

  allFiles.forEach(filePath => {
    if (increaseOpacity(filePath)) {
      console.log(`🔥 Higher opacity: ${path.relative(process.cwd(), filePath)}`);
      processedFiles++;
    }
  });

  console.log('\n🎉 Opacity enhancement berhasil!');
  console.log(`📊 Total files processed: ${processedFiles}`);
  console.log('\n💪 Perubahan yang diterapkan:');
  console.log('  • Opacity: 80% → 95% (lebih solid)');
  console.log('  • Borders: 400/500 → 300/400 (lebih terang)');
  console.log('  • Icons: 300/200 → 200/100 (lebih bright)');
  console.log('\n🚀 Cards sekarang terlihat lebih solid dan jelas!');
}

if (require.main === module) {
  main();
}

module.exports = { increaseOpacity };
