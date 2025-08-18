#!/usr/bin/env node

/**
 * Enhanced Clear Gradient Script
 * 
 * Membuat gradasi yang lebih jelas dan dramatis dengan via colors
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

function enhanceClearGradients(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Enhanced gradient patterns dengan via colors untuk gradasi yang lebih jelas
    const gradientEnhancements = [
      // Slate/Gray gradients - lebih jelas
      {
        pattern: /from-slate-\d+ to-gray-\d+/g,
        replacement: 'from-slate-100 via-gray-50 to-zinc-200'
      },
      {
        pattern: /dark:from-slate-\d+ dark:to-slate-\d+/g,
        replacement: 'dark:from-slate-900 dark:via-slate-800 dark:to-zinc-700'
      },

      // Blue gradients - lebih dramatis
      {
        pattern: /from-blue-\d+ to-sky-\d+/g,
        replacement: 'from-sky-100 via-blue-50 to-cyan-200'
      },
      {
        pattern: /dark:from-blue-\d+ dark:to-sky-\d+/g,
        replacement: 'dark:from-blue-900 dark:via-sky-800 dark:to-cyan-700'
      },

      // Green gradients - lebih kontras
      {
        pattern: /from-green-\d+ to-emerald-\d+/g,
        replacement: 'from-emerald-100 via-green-50 to-teal-200'
      },
      {
        pattern: /dark:from-green-\d+ dark:to-emerald-\d+/g,
        replacement: 'dark:from-emerald-900 dark:via-green-800 dark:to-teal-700'
      },

      // Orange gradients - lebih cerah
      {
        pattern: /from-orange-\d+ to-amber-\d+/g,
        replacement: 'from-amber-100 via-orange-50 to-yellow-200'
      },
      {
        pattern: /dark:from-orange-\d+ dark:to-amber-\d+/g,
        replacement: 'dark:from-orange-900 dark:via-amber-800 dark:to-yellow-700'
      },

      // Red gradients - lebih tegas
      {
        pattern: /from-red-\d+ to-rose-\d+/g,
        replacement: 'from-rose-100 via-red-50 to-pink-200'
      },
      {
        pattern: /dark:from-red-\d+ dark:to-rose-\d+/g,
        replacement: 'dark:from-rose-900 dark:via-red-800 dark:to-pink-700'
      },

      // Purple gradients - lebih mewah
      {
        pattern: /from-purple-\d+ to-violet-\d+/g,
        replacement: 'from-violet-100 via-purple-50 to-indigo-200'
      },
      {
        pattern: /dark:from-purple-\d+ dark:to-violet-\d+/g,
        replacement: 'dark:from-violet-900 dark:via-purple-800 dark:to-indigo-700'
      },

      // Pink/Crimson gradients
      {
        pattern: /from-pink-\d+ to-red-\d+/g,
        replacement: 'from-red-100 via-crimson-50 to-rose-200'
      },
      {
        pattern: /dark:from-pink-\d+ dark:to-red-\d+/g,
        replacement: 'dark:from-red-900 dark:via-red-800 dark:to-rose-700'
      }
    ];

    // Background page gradients - lebih dramatis
    const pageGradientEnhancements = [
      {
        pattern: /bg-gradient-to-br from-slate-50 via-sky-50 to-cyan-100/g,
        replacement: 'bg-gradient-to-br from-slate-100 via-sky-50 to-cyan-200'
      },
      {
        pattern: /dark:from-slate-900 dark:via-slate-800 dark:to-slate-700/g,
        replacement: 'dark:from-slate-950 dark:via-slate-900 dark:to-slate-800'
      }
    ];

    // Accent gradients - lebih kaya
    const accentEnhancements = [
      {
        pattern: /from-slate-\d+ to-slate-\d+/g,
        replacement: 'from-slate-600 via-gray-500 to-zinc-600'
      },
      {
        pattern: /from-sky-\d+ to-cyan-\d+/g,
        replacement: 'from-sky-600 via-blue-500 to-cyan-600'
      },
      {
        pattern: /from-emerald-\d+ to-teal-\d+/g,
        replacement: 'from-emerald-600 via-green-500 to-teal-600'
      },
      {
        pattern: /from-amber-\d+ to-orange-\d+/g,
        replacement: 'from-amber-600 via-orange-500 to-yellow-600'
      },
      {
        pattern: /from-rose-\d+ to-pink-\d+/g,
        replacement: 'from-rose-600 via-red-500 to-pink-600'
      },
      {
        pattern: /from-violet-\d+ to-purple-\d+/g,
        replacement: 'from-violet-600 via-purple-500 to-indigo-600'
      }
    ];

    // Apply all enhancements
    [...gradientEnhancements, ...pageGradientEnhancements, ...accentEnhancements].forEach(enhancement => {
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
  console.log('🌈 Enhancing gradients untuk gradasi yang lebih jelas...\n');

  const srcPath = path.join(process.cwd(), 'src');
  
  if (!fs.existsSync(srcPath)) {
    console.error('❌ Direktori src tidak ditemukan!');
    process.exit(1);
  }

  const allFiles = getAllFiles(srcPath);
  let processedFiles = 0;

  allFiles.forEach(filePath => {
    if (enhanceClearGradients(filePath)) {
      console.log(`🌈 Enhanced gradient: ${path.relative(process.cwd(), filePath)}`);
      processedFiles++;
    }
  });

  console.log('\n🎉 Clear gradient enhancement berhasil!');
  console.log(`📊 Total files processed: ${processedFiles}`);
  console.log('\n💎 Gradient improvements:');
  console.log('  🎨 Via colors - 3-point gradients untuk transisi smooth');
  console.log('  🌈 Contrast enhanced - Dari 100→200 range untuk clarity');
  console.log('  🔥 Dark mode - 900→700 range untuk dramatic effect');
  console.log('  ✨ Accent gradients - Triple color blends');
  console.log('\n🚀 Gradasi sekarang lebih jelas dan dramatis!');
}

if (require.main === module) {
  main();
}

module.exports = { enhanceClearGradients };
