#!/usr/bin/env node

/**
 * Saturated Bright Colors Fix Script
 * 
 * Memperbaiki warna yang terlalu gelap menjadi lebih saturated, terang, dan clean
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

function fixBrightSaturatedColors(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Clean, Bright, Saturated Color Schemes
    const brightColorSchemes = [
      // GRAY - Clean and bright
      {
        old: /gray: \{[^}]*\}/gs,
        new: `gray: {
        bg: "from-slate-50 to-gray-100 dark:from-slate-700 dark:to-slate-600",
        border: "border-slate-200 dark:border-slate-400",
        icon: "text-slate-600 dark:text-slate-200",
        accent: "from-slate-500 to-slate-600"
      }`
      },

      // BLUE - Bright and professional
      {
        old: /blue: \{[^}]*\}/gs,
        new: `blue: {
        bg: "from-blue-50 to-sky-100 dark:from-blue-800 dark:to-sky-700",
        border: "border-blue-200 dark:border-blue-300",
        icon: "text-blue-600 dark:text-blue-200",
        accent: "from-blue-500 to-sky-500"
      }`
      },

      // GREEN - Vibrant success
      {
        old: /green: \{[^}]*\}/gs,
        new: `green: {
        bg: "from-green-50 to-emerald-100 dark:from-green-800 dark:to-emerald-700",
        border: "border-green-200 dark:border-green-300",
        icon: "text-green-600 dark:text-green-200",
        accent: "from-green-500 to-emerald-500"
      }`
      },

      // ORANGE - Bright warning
      {
        old: /orange: \{[^}]*\}/gs,
        new: `orange: {
        bg: "from-orange-50 to-amber-100 dark:from-orange-700 dark:to-amber-600",
        border: "border-orange-200 dark:border-orange-300",
        icon: "text-orange-600 dark:text-orange-200",
        accent: "from-orange-500 to-amber-500"
      }`
      },

      // RED - Bright urgent (for unassigned)
      {
        old: /red: \{[^}]*\}/gs,
        new: `red: {
        bg: "from-red-50 to-rose-100 dark:from-red-700 dark:to-rose-600",
        border: "border-red-200 dark:border-red-300",
        icon: "text-red-600 dark:text-red-200",
        accent: "from-red-500 to-rose-500"
      }`
      },

      // PURPLE - Bright premium
      {
        old: /purple: \{[^}]*\}/gs,
        new: `purple: {
        bg: "from-purple-50 to-violet-100 dark:from-purple-700 dark:to-violet-600",
        border: "border-purple-200 dark:border-purple-300",
        icon: "text-purple-600 dark:text-purple-200",
        accent: "from-purple-500 to-violet-500"
      }`
      },

      // CRIMSON - Bright critical (for unpaid invoices)
      {
        old: /crimson: \{[^}]*\}/gs,
        new: `crimson: {
        bg: "from-pink-50 to-red-100 dark:from-pink-700 dark:to-red-600",
        border: "border-pink-200 dark:border-pink-300",
        icon: "text-pink-600 dark:text-pink-200",
        accent: "from-pink-500 to-red-500"
      }`
      }
    ];

    // Apply bright color schemes
    brightColorSchemes.forEach(scheme => {
      if (scheme.old.test(content)) {
        content = content.replace(scheme.old, scheme.new);
        modified = true;
      }
    });

    // Fix complex className patterns - simplify to basic clean styles
    const simplifyPatterns = [
      // Remove overly complex shadows and effects
      {
        pattern: /shadow-xl shadow-black\/10 dark:shadow-black\/25/g,
        replacement: 'shadow-lg'
      },
      
      // Simplify transform effects
      {
        pattern: /transform hover:-translate-y-1/g,
        replacement: ''
      },
      
      // Remove backdrop blur that might cause issues
      {
        pattern: /backdrop-blur-sm/g,
        replacement: ''
      },
      
      // Clean up complex interactive patterns
      {
        pattern: /\$\{scheme\.glow\} \$\{scheme\.interactive\}/g,
        replacement: 'hover:shadow-lg'
      },
      
      // Simplify complex gradients to basic ones
      {
        pattern: /from-\w+-\d+ via-\w+-\d+ to-\w+-\d+/g,
        replacement: (match) => {
          // Extract first and last colors for simpler gradient
          const colors = match.match(/\w+-\d+/g);
          if (colors && colors.length >= 2) {
            return `from-${colors[0]} to-${colors[colors.length - 1]}`;
          }
          return match;
        }
      },
      
      // Fix rotateX, rotateY which might cause errors
      {
        pattern: /whileHover=\{\{ scale: 1\.03, y: -4, rotateX: 2, rotateY: 1 \}\}/g,
        replacement: 'whileHover={{ scale: 1.02, y: -2 }}'
      }
    ];

    simplifyPatterns.forEach(pattern => {
      if (pattern.pattern.test(content)) {
        content = content.replace(pattern.pattern, pattern.replacement);
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
  console.log('🎨 Memperbaiki warna menjadi lebih saturated, terang, dan clean...\n');

  const srcPath = path.join(process.cwd(), 'src');
  
  if (!fs.existsSync(srcPath)) {
    console.error('❌ Direktori src tidak ditemukan!');
    process.exit(1);
  }

  const allFiles = getAllFiles(srcPath);
  let processedFiles = 0;

  allFiles.forEach(filePath => {
    if (fixBrightSaturatedColors(filePath)) {
      console.log(`🌟 Bright colors: ${path.relative(process.cwd(), filePath)}`);
      processedFiles++;
    }
  });

  console.log('\n🎉 Bright saturated colors berhasil diterapkan!');
  console.log(`📊 Total files processed: ${processedFiles}`);
  console.log('\n✨ Perbaikan yang dilakukan:');
  console.log('  • Warna lebih terang dan saturated');
  console.log('  • Menghilangkan efek kompleks yang error');
  console.log('  • Gradients disederhanakan');
  console.log('  • Shadows dibersihkan');
  console.log('  • Transform effects diperbaiki');
  console.log('\n🚀 Cards sekarang clean, bright, dan tidak ada error!');
}

if (require.main === module) {
  main();
}

module.exports = { fixBrightSaturatedColors };
