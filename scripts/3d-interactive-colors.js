#!/usr/bin/env node

/**
 * 3D Gradient Interactive Professional Colors Script
 * 
 * Membuat warna dengan efek 3D, gradasi keren, interaktif, dan profesional
 * dengan perbedaan untuk unpaid invoices vs unassigned
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

function apply3DGradientColors(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Enhanced 3D Professional Color Schemes with Interactive Effects
    const enhanced3DColorSchemes = [
      // SLATE/NEUTRAL - 3D Modern base
      {
        old: /gray: \{[^}]*bg: "[^"]*"[^}]*border: "[^"]*"[^}]*icon: "[^"]*"[^}]*accent: "[^"]*"[^}]*\}/gs,
        new: `gray: {
        bg: "from-slate-100 via-zinc-50 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-600",
        border: "border-slate-300/50 dark:border-slate-400/60 shadow-inner",
        icon: "text-slate-700 dark:text-slate-100 drop-shadow-sm",
        accent: "from-slate-600 via-zinc-500 to-slate-700",
        glow: "group-hover:shadow-slate-500/20 dark:group-hover:shadow-slate-400/30",
        interactive: "group-hover:from-slate-200 group-hover:via-zinc-100 group-hover:to-slate-300 dark:group-hover:from-slate-700 dark:group-hover:via-slate-600 dark:group-hover:to-slate-500"
      }`
      },

      // BLUE/CYAN - 3D Professional primary
      {
        old: /blue: \{[^}]*bg: "[^"]*"[^}]*border: "[^"]*"[^}]*icon: "[^"]*"[^}]*accent: "[^"]*"[^}]*\}/gs,
        new: `blue: {
        bg: "from-sky-100 via-cyan-50 to-blue-200 dark:from-sky-900 dark:via-cyan-800 dark:to-blue-800",
        border: "border-sky-300/60 dark:border-sky-400/70 shadow-inner",
        icon: "text-sky-700 dark:text-sky-100 drop-shadow-lg",
        accent: "from-sky-600 via-cyan-500 to-blue-700",
        glow: "group-hover:shadow-sky-500/30 dark:group-hover:shadow-sky-400/40",
        interactive: "group-hover:from-sky-200 group-hover:via-cyan-100 group-hover:to-blue-300 dark:group-hover:from-sky-800 dark:group-hover:via-cyan-700 dark:group-hover:to-blue-700"
      }`
      },

      // GREEN/EMERALD - 3D Success
      {
        old: /green: \{[^}]*bg: "[^"]*"[^}]*border: "[^"]*"[^}]*icon: "[^"]*"[^}]*accent: "[^"]*"[^}]*\}/gs,
        new: `green: {
        bg: "from-emerald-100 via-teal-50 to-green-200 dark:from-emerald-900 dark:via-teal-800 dark:to-green-800",
        border: "border-emerald-300/60 dark:border-emerald-400/70 shadow-inner",
        icon: "text-emerald-700 dark:text-emerald-100 drop-shadow-lg",
        accent: "from-emerald-600 via-teal-500 to-green-700",
        glow: "group-hover:shadow-emerald-500/30 dark:group-hover:shadow-emerald-400/40",
        interactive: "group-hover:from-emerald-200 group-hover:via-teal-100 group-hover:to-green-300 dark:group-hover:from-emerald-800 dark:group-hover:via-teal-700 dark:group-hover:to-green-700"
      }`
      },

      // ORANGE/AMBER - 3D Warning
      {
        old: /orange: \{[^}]*bg: "[^"]*"[^}]*border: "[^"]*"[^}]*icon: "[^"]*"[^}]*accent: "[^"]*"[^}]*\}/gs,
        new: `orange: {
        bg: "from-amber-100 via-orange-50 to-yellow-200 dark:from-amber-900 dark:via-orange-800 dark:to-yellow-800",
        border: "border-amber-300/60 dark:border-amber-400/70 shadow-inner",
        icon: "text-amber-700 dark:text-amber-100 drop-shadow-lg",
        accent: "from-amber-600 via-orange-500 to-yellow-600",
        glow: "group-hover:shadow-amber-500/30 dark:group-hover:shadow-amber-400/40",
        interactive: "group-hover:from-amber-200 group-hover:via-orange-100 group-hover:to-yellow-300 dark:group-hover:from-amber-800 dark:group-hover:via-orange-700 dark:group-hover:to-yellow-700"
      }`
      },

      // RED/ROSE - 3D Error/Urgent (untuk unassigned)
      {
        old: /red: \{[^}]*bg: "[^"]*"[^}]*border: "[^"]*"[^}]*icon: "[^"]*"[^}]*accent: "[^"]*"[^}]*\}/gs,
        new: `red: {
        bg: "from-rose-100 via-pink-50 to-red-200 dark:from-rose-900 dark:via-pink-800 dark:to-red-800",
        border: "border-rose-300/60 dark:border-rose-400/70 shadow-inner",
        icon: "text-rose-700 dark:text-rose-100 drop-shadow-lg",
        accent: "from-rose-600 via-pink-500 to-red-700",
        glow: "group-hover:shadow-rose-500/30 dark:group-hover:shadow-rose-400/40",
        interactive: "group-hover:from-rose-200 group-hover:via-pink-100 group-hover:to-red-300 dark:group-hover:from-rose-800 dark:group-hover:via-pink-700 dark:group-hover:to-red-700"
      }`
      },

      // PURPLE/VIOLET - 3D Premium
      {
        old: /purple: \{[^}]*bg: "[^"]*"[^}]*border: "[^"]*"[^}]*icon: "[^"]*"[^}]*accent: "[^"]*"[^}]*\}/gs,
        new: `purple: {
        bg: "from-violet-100 via-purple-50 to-indigo-200 dark:from-violet-900 dark:via-purple-800 dark:to-indigo-800",
        border: "border-violet-300/60 dark:border-violet-400/70 shadow-inner",
        icon: "text-violet-700 dark:text-violet-100 drop-shadow-lg",
        accent: "from-violet-600 via-purple-500 to-indigo-700",
        glow: "group-hover:shadow-violet-500/30 dark:group-hover:shadow-violet-400/40",
        interactive: "group-hover:from-violet-200 group-hover:via-purple-100 group-hover:to-indigo-300 dark:group-hover:from-violet-800 dark:group-hover:via-purple-700 dark:group-hover:to-indigo-700"
      }`
      },

      // CRIMSON - New color for unpaid invoices (berbeda dari red)
      {
        old: /"crimson"/g,
        new: `crimson: {
        bg: "from-red-100 via-crimson-50 to-rose-200 dark:from-red-900 dark:via-red-800 dark:to-crimson-800",
        border: "border-red-300/60 dark:border-red-400/70 shadow-inner",
        icon: "text-red-700 dark:text-red-100 drop-shadow-lg",
        accent: "from-red-600 via-crimson-500 to-rose-700",
        glow: "group-hover:shadow-red-500/30 dark:group-hover:shadow-red-400/40",
        interactive: "group-hover:from-red-200 group-hover:via-crimson-100 group-hover:to-rose-300 dark:group-hover:from-red-800 dark:group-hover:via-red-700 dark:group-hover:to-crimson-700"
      }`
      }
    ];

    // Apply enhanced 3D color schemes
    enhanced3DColorSchemes.forEach(scheme => {
      if (scheme.old.test(content)) {
        content = content.replace(scheme.old, scheme.new);
        modified = true;
      }
    });

    // Add new crimson color scheme if it doesn't exist
    if (content.includes('colorSchemes = {') && !content.includes('crimson:')) {
      const crimsonScheme = `      crimson: {
        bg: "from-red-100 via-red-50 to-rose-200 dark:from-red-900 dark:via-red-800 dark:to-rose-800",
        border: "border-red-300/60 dark:border-red-400/70 shadow-inner",
        icon: "text-red-700 dark:text-red-100 drop-shadow-lg",
        accent: "from-red-600 via-red-500 to-rose-700",
        glow: "group-hover:shadow-red-500/30 dark:group-hover:shadow-red-400/40",
        interactive: "group-hover:from-red-200 group-hover:via-red-100 group-hover:to-rose-300 dark:group-hover:from-red-800 dark:group-hover:via-red-700 dark:group-hover:to-rose-700"
      },`;

      content = content.replace(/(purple: \{[^}]*\})/s, `$1,\n${crimsonScheme}`);
      modified = true;
    }

    // Enhanced 3D Interactive Effects
    const interactiveEnhancements = [
      // 3D Shadow effects
      {
        pattern: /className={\`([^`]*) shadow-lg ([^`]*)\`}/g,
        replacement: 'className={`$1 shadow-xl shadow-black/10 dark:shadow-black/25 group-hover:shadow-2xl group-hover:-translate-y-1 transform transition-all duration-300 $2`}'
      },

      // 3D Hover animations
      {
        pattern: /whileHover=\{\{ scale: 1\.02, y: -2 \}\}/g,
        replacement: 'whileHover={{ scale: 1.03, y: -4, rotateX: 2, rotateY: 1 }}'
      },

      // Enhanced card backgrounds for 3D effect
      {
        pattern: /bg-gradient-to-br/g,
        replacement: 'bg-gradient-to-br backdrop-blur-sm'
      }
    ];

    interactiveEnhancements.forEach(enhancement => {
      if (enhancement.pattern.test(content)) {
        content = content.replace(enhancement.pattern, enhancement.replacement);
        modified = true;
      }
    });

    // Differentiate unpaid invoices from unassigned - change color assignment
    const unpaidInvoicesPattern = /label="Unpaid Invoices"[^}]*color="red"/g;
    if (unpaidInvoicesPattern.test(content)) {
      content = content.replace(unpaidInvoicesPattern, (match) => {
        return match.replace('color="red"', 'color="crimson"');
      });
      modified = true;
    }

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
  console.log('🎨✨ Menerapkan 3D Gradient Interactive Professional Colors...\n');

  const srcPath = path.join(process.cwd(), 'src');
  
  if (!fs.existsSync(srcPath)) {
    console.error('❌ Direktori src tidak ditemukan!');
    process.exit(1);
  }

  const allFiles = getAllFiles(srcPath);
  let processedFiles = 0;

  allFiles.forEach(filePath => {
    if (apply3DGradientColors(filePath)) {
      console.log(`🎨✨ 3D Enhanced: ${path.relative(process.cwd(), filePath)}`);
      processedFiles++;
    }
  });

  console.log('\n🎉 3D Interactive Professional Colors berhasil diterapkan!');
  console.log(`📊 Total files processed: ${processedFiles}`);
  console.log('\n💎 Features yang ditambahkan:');
  console.log('  🌈 3D Gradient - Multi-layer gradasi');
  console.log('  ✨ Interactive Hover - Transform & glow effects');
  console.log('  🎯 Professional Look - Modern business appearance');
  console.log('  🔴 Color Differentiation - Unpaid invoices vs Unassigned');
  console.log('  🎭 Drop Shadows - Icon depth effects');
  console.log('  💫 Backdrop Blur - Glass morphism effects');
  console.log('\n🚀 Cards sekarang tampil dengan efek 3D keren dan interaktif!');
}

if (require.main === module) {
  main();
}

module.exports = { apply3DGradientColors };
