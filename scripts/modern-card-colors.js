#!/usr/bin/env node

/**
 * Modern Professional Card Colors Script
 * 
 * Menggunakan palette warna modern yang populer, profesional, dan enak dipandang.
 * Mengikuti tren desain terkini dengan kombinasi yang harmonis.
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

function applyModernColors(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Modern Professional Color Schemes
    const modernColorSchemes = [
      // SLATE/NEUTRAL - Modern base color (higher opacity)
      {
        old: /gray: \{[^}]*bg: "from-slate-50 to-gray-100 dark:from-gray-800\/80 dark:to-slate-700\/80"[^}]*border: "border-gray-200 dark:border-gray-500"[^}]*icon: "text-gray-600 dark:text-gray-200"[^}]*accent: "from-gray-400 to-gray-600"[^}]*\}/gs,
        new: `gray: {
        bg: "from-slate-50 to-zinc-100 dark:from-slate-700/95 dark:to-slate-600/95",
        border: "border-slate-200 dark:border-slate-400",
        icon: "text-slate-600 dark:text-slate-100",
        accent: "from-slate-500 to-zinc-600"
      }`
      },

      // BLUE/CYAN - Professional primary (higher opacity)
      {
        old: /blue: \{[^}]*bg: "from-blue-50 to-indigo-100 dark:from-blue-900\/70 dark:to-indigo-800\/70"[^}]*border: "border-blue-200 dark:border-blue-600"[^}]*icon: "text-blue-600 dark:text-blue-200"[^}]*accent: "from-blue-400 to-blue-600"[^}]*\}/gs,
        new: `blue: {
        bg: "from-sky-50 to-cyan-100 dark:from-sky-800/95 dark:to-cyan-800/95",
        border: "border-sky-200 dark:border-sky-300",
        icon: "text-sky-600 dark:text-sky-200",
        accent: "from-sky-500 to-cyan-600"
      }`
      },

      // GREEN/EMERALD - Success/positive (higher opacity)
      {
        old: /green: \{[^}]*bg: "from-emerald-50 to-green-100 dark:from-emerald-900\/70 dark:to-green-800\/70"[^}]*border: "border-green-200 dark:border-green-600"[^}]*icon: "text-green-600 dark:text-green-200"[^}]*accent: "from-green-400 to-green-600"[^}]*\}/gs,
        new: `green: {
        bg: "from-emerald-50 to-teal-100 dark:from-emerald-800/95 dark:to-teal-800/95",
        border: "border-emerald-200 dark:border-emerald-300",
        icon: "text-emerald-600 dark:text-emerald-200",
        accent: "from-emerald-500 to-teal-600"
      }`
      },

      // ORANGE/AMBER - Warning/attention (higher opacity)
      {
        old: /orange: \{[^}]*bg: "from-orange-50 to-amber-100 dark:from-orange-900\/70 dark:to-amber-800\/70"[^}]*border: "border-orange-200 dark:border-orange-600"[^}]*icon: "text-orange-600 dark:text-orange-200"[^}]*accent: "from-orange-400 to-orange-600"[^}]*\}/gs,
        new: `orange: {
        bg: "from-amber-50 to-orange-100 dark:from-amber-800/95 dark:to-orange-800/95",
        border: "border-amber-200 dark:border-amber-300",
        icon: "text-amber-600 dark:text-amber-200",
        accent: "from-amber-500 to-orange-600"
      }`
      },

      // RED/ROSE - Error/urgent (higher opacity)
      {
        old: /red: \{[^}]*bg: "from-red-50 to-rose-100 dark:from-red-900\/70 dark:to-rose-800\/70"[^}]*border: "border-red-200 dark:border-red-600"[^}]*icon: "text-red-600 dark:text-red-200"[^}]*accent: "from-red-400 to-red-600"[^}]*\}/gs,
        new: `red: {
        bg: "from-rose-50 to-pink-100 dark:from-rose-800/95 dark:to-pink-800/95",
        border: "border-rose-200 dark:border-rose-300",
        icon: "text-rose-600 dark:text-rose-200",
        accent: "from-rose-500 to-pink-600"
      }`
      },

      // PURPLE/VIOLET - Premium/creative (higher opacity)
      {
        old: /purple: \{[^}]*bg: "from-purple-50 to-violet-100 dark:from-purple-900\/70 dark:to-violet-800\/70"[^}]*border: "border-purple-200 dark:border-purple-600"[^}]*icon: "text-purple-600 dark:text-purple-200"[^}]*accent: "from-purple-400 to-purple-600"[^}]*\}/gs,
        new: `purple: {
        bg: "from-violet-50 to-purple-100 dark:from-violet-800/95 dark:to-purple-800/95",
        border: "border-violet-200 dark:border-violet-300",
        icon: "text-violet-600 dark:text-violet-200",
        accent: "from-violet-500 to-purple-600"
      }`
      }
    ];

    // Apply modern color schemes
    modernColorSchemes.forEach(scheme => {
      if (scheme.old.test(content)) {
        content = content.replace(scheme.old, scheme.new);
        modified = true;
      }
    });

    // Additional modern enhancements
    const additionalEnhancements = [
      // Modern background gradients
      {
        pattern: /bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700/g,
        replacement: 'bg-gradient-to-br from-slate-50 via-sky-50 to-cyan-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700'
      },

      // Modern card backgrounds
      {
        pattern: /bg-white dark:bg-gray-800\/70/g,
        replacement: 'bg-white/90 dark:bg-slate-800/90'
      },

      // Modern shadow effects
      {
        pattern: /shadow dark:shadow-gray-800\/25 dark:shadow-lg/g,
        replacement: 'shadow-lg dark:shadow-slate-900/25'
      },

      // Modern border colors
      {
        pattern: /border-white dark:border-gray-600\/20/g,
        replacement: 'border-slate-200/50 dark:border-slate-600/30'
      },

      // Modern text colors for headings
      {
        pattern: /bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-600 dark:from-gray-100 dark:via-blue-200 dark:to-indigo-300/g,
        replacement: 'bg-gradient-to-r from-slate-900 via-sky-800 to-cyan-600 dark:from-slate-100 dark:via-sky-200 dark:to-cyan-300'
      },

      // Modern accent colors
      {
        pattern: /text-blue-600 dark:text-blue-200/g,
        replacement: 'text-sky-600 dark:text-sky-300'
      }
    ];

    additionalEnhancements.forEach(enhancement => {
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

// Sidebar coordination - modern colors for sidebar
function modernizeSidebar(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    const sidebarEnhancements = [
      // Modern sidebar active state
      {
        pattern: /bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700/g,
        replacement: 'bg-gradient-to-r from-sky-50 to-cyan-50 text-sky-700 dark:from-slate-700/50 dark:to-sky-900/50 dark:text-sky-300'
      },

      // Modern sidebar hover state  
      {
        pattern: /hover:from-gray-50 hover:to-blue-50/g,
        replacement: 'hover:from-slate-50 hover:to-sky-50 dark:hover:from-slate-700/30 dark:hover:to-slate-600/30'
      },

      // Modern active indicator
      {
        pattern: /bg-gradient-to-b from-blue-500 to-indigo-600/g,
        replacement: 'bg-gradient-to-b from-sky-500 to-cyan-600'
      },

      // Modern role badge
      {
        pattern: /text-blue-600 dark:text-blue-200/g,
        replacement: 'text-sky-600 dark:text-sky-300'
      }
    ];

    sidebarEnhancements.forEach(enhancement => {
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
    console.error(`❌ Error processing sidebar ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🎨 Menerapkan palette warna modern profesional...\n');

  const srcPath = path.join(process.cwd(), 'src');
  
  if (!fs.existsSync(srcPath)) {
    console.error('❌ Direktori src tidak ditemukan!');
    process.exit(1);
  }

  const allFiles = getAllFiles(srcPath);
  let processedFiles = 0;
  let sidebarFiles = 0;

  // Process regular files
  allFiles.forEach(filePath => {
    const filename = path.basename(filePath);
    
    // Check if it's a sidebar file
    if (filename.includes('Sidebar') || filename.includes('sidebar')) {
      if (modernizeSidebar(filePath)) {
        console.log(`✨ Sidebar updated: ${path.relative(process.cwd(), filePath)}`);
        sidebarFiles++;
      }
    } else if (applyModernColors(filePath)) {
      console.log(`🎨 Colors enhanced: ${path.relative(process.cwd(), filePath)}`);
      processedFiles++;
    }
  });

  console.log('\n🎉 Modern color palette berhasil diterapkan!');
  console.log(`📊 Total files processed: ${processedFiles}`);
  console.log(`🔧 Sidebar files updated: ${sidebarFiles}`);
  console.log('\n💎 Palette yang digunakan:');
  console.log('  • Slate/Zinc - Modern neutral base');
  console.log('  • Sky/Cyan - Professional primary');
  console.log('  • Emerald/Teal - Success & positive');
  console.log('  • Amber/Orange - Warning & attention'); 
  console.log('  • Rose/Pink - Error & urgent');
  console.log('  • Violet/Purple - Premium & creative');
  console.log('\n🚀 Refresh browser untuk melihat hasil!');
}

if (require.main === module) {
  main();
}

module.exports = { applyModernColors, modernizeSidebar };
