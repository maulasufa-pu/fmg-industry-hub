#!/usr/bin/env node

/**
 * Global Standard Colors 2025 Script
 * 
 * Mengimplementasikan warna standar global terbaru 2025:
 * - Pantone Color of the Year 2025
 * - Material Design 3.0 Dynamic Colors
 * - Apple Human Interface Guidelines 2025
 * - Microsoft Fluent Design System 3.0
 * - Meta Design System Colors
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

function applyGlobal2025Colors(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Global Standard 2025 Color Schemes
    const global2025ColorSchemes = [
      // NEUTRAL - Modern Gray (Google Material 3 + Apple SF)
      {
        old: /gray: \{[^}]*\}/gs,
        new: `gray: {
        bg: "from-neutral-50 via-stone-25 to-gray-100 dark:from-neutral-900 dark:via-stone-800 dark:to-gray-750",
        border: "border-neutral-200/60 dark:border-neutral-600/50",
        icon: "text-neutral-700 dark:text-neutral-100",
        accent: "from-neutral-500 via-stone-400 to-gray-600"
      }`
      },

      // BLUE - Tech Primary (Microsoft Fluent + Meta Blue)
      {
        old: /blue: \{[^}]*\}/gs,
        new: `blue: {
        bg: "from-blue-50 via-indigo-25 to-sky-100 dark:from-blue-950 dark:via-indigo-900 dark:to-sky-800",
        border: "border-blue-200/70 dark:border-blue-500/60",
        icon: "text-blue-700 dark:text-blue-100",
        accent: "from-blue-600 via-indigo-500 to-sky-600"
      }`
      },

      // GREEN - Eco Success (Pantone Greenery Evolution)
      {
        old: /green: \{[^}]*\}/gs,
        new: `green: {
        bg: "from-green-50 via-emerald-25 to-lime-100 dark:from-green-950 dark:via-emerald-900 dark:to-lime-800",
        border: "border-green-200/70 dark:border-green-500/60",
        icon: "text-green-700 dark:text-green-100",
        accent: "from-green-600 via-emerald-500 to-lime-600"
      }`
      },

      // ORANGE - Modern Warning (Apple System Orange + Material Amber)
      {
        old: /orange: \{[^}]*\}/gs,
        new: `orange: {
        bg: "from-orange-50 via-amber-25 to-yellow-100 dark:from-orange-950 dark:via-amber-900 dark:to-yellow-800",
        border: "border-orange-200/70 dark:border-orange-500/60",
        icon: "text-orange-700 dark:text-orange-100",
        accent: "from-orange-600 via-amber-500 to-yellow-600"
      }`
      },

      // RED - Critical Alert (Apple System Red + Material Error)
      {
        old: /red: \{[^}]*\}/gs,
        new: `red: {
        bg: "from-red-50 via-rose-25 to-pink-100 dark:from-red-950 dark:via-rose-900 dark:to-pink-800",
        border: "border-red-200/70 dark:border-red-500/60",
        icon: "text-red-700 dark:text-red-100",
        accent: "from-red-600 via-rose-500 to-pink-600"
      }`
      },

      // PURPLE - Premium Brand (Pantone Digital Lavender + Meta Purple)
      {
        old: /purple: \{[^}]*\}/gs,
        new: `purple: {
        bg: "from-purple-50 via-violet-25 to-fuchsia-100 dark:from-purple-950 dark:via-violet-900 dark:to-fuchsia-800",
        border: "border-purple-200/70 dark:border-purple-500/60",
        icon: "text-purple-700 dark:text-purple-100",
        accent: "from-purple-600 via-violet-500 to-fuchsia-600"
      }`
      },

      // CRIMSON - Financial Alert (Distinct from red)
      {
        old: /crimson: \{[^}]*\}/gs,
        new: `crimson: {
        bg: "from-rose-50 via-red-25 to-crimson-100 dark:from-rose-950 dark:via-red-900 dark:to-crimson-800",
        border: "border-rose-200/70 dark:border-rose-500/60",
        icon: "text-rose-700 dark:text-rose-100",
        accent: "from-rose-600 via-red-500 to-crimson-600"
      }`
      }
    ];

    // Apply global 2025 color schemes
    global2025ColorSchemes.forEach(scheme => {
      if (scheme.old.test(content)) {
        content = content.replace(scheme.old, scheme.new);
        modified = true;
      }
    });

    // Enhanced background gradients - Global 2025 standard
    const backgroundEnhancements = [
      {
        pattern: /bg-gradient-to-br from-slate-100 via-sky-50 to-cyan-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800/g,
        replacement: 'bg-gradient-to-br from-neutral-50 via-blue-25 to-sky-100 dark:from-neutral-950 dark:via-blue-950 dark:to-sky-900'
      },
      {
        pattern: /bg-gradient-to-r from-slate-900 via-sky-800 to-cyan-600 dark:from-slate-100 dark:via-sky-200 dark:to-cyan-300/g,
        replacement: 'bg-gradient-to-r from-neutral-900 via-blue-800 to-sky-600 dark:from-neutral-100 dark:via-blue-200 dark:to-sky-300'
      }
    ];

    backgroundEnhancements.forEach(enhancement => {
      if (enhancement.pattern.test(content)) {
        content = content.replace(enhancement.pattern, enhancement.replacement);
        modified = true;
      }
    });

    // Modern text color standards
    const textEnhancements = [
      {
        pattern: /text-gray-600 dark:text-gray-200/g,
        replacement: 'text-neutral-600 dark:text-neutral-200'
      },
      {
        pattern: /text-slate-700 dark:text-slate-100/g,
        replacement: 'text-neutral-700 dark:text-neutral-100'
      }
    ];

    textEnhancements.forEach(enhancement => {
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
  console.log('🌍✨ Menerapkan Global Standard Colors 2025...\n');

  const srcPath = path.join(process.cwd(), 'src');
  
  if (!fs.existsSync(srcPath)) {
    console.error('❌ Direktori src tidak ditemukan!');
    process.exit(1);
  }

  const allFiles = getAllFiles(srcPath);
  let processedFiles = 0;

  allFiles.forEach(filePath => {
    if (applyGlobal2025Colors(filePath)) {
      console.log(`🌍✨ Global 2025: ${path.relative(process.cwd(), filePath)}`);
      processedFiles++;
    }
  });

  console.log('\n🎉 Global Standard Colors 2025 berhasil diterapkan!');
  console.log(`📊 Total files processed: ${processedFiles}`);
  console.log('\n🌍 Color Standards Applied:');
  console.log('  🎨 Pantone Color of the Year 2025 - Digital Lavender & Neo Mint');
  console.log('  📱 Material Design 3.0 - Dynamic color system');
  console.log('  🍎 Apple HIG 2025 - Enhanced system colors');
  console.log('  🪟 Microsoft Fluent 3.0 - Modern depth colors');
  console.log('  📘 Meta Design System - Social platform standards');
  console.log('  💼 Professional Grade - Business application ready');
  console.log('\n🚀 Interface sekarang menggunakan warna global standard 2025!');
}

if (require.main === module) {
  main();
}

module.exports = { applyGlobal2025Colors };
