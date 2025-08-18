#!/usr/bin/env node

/**
 * Dark Mode Implementation Report Generator
 * 
 * Script ini membuat laporan implementasi dark mode untuk semua file
 * di dalam project, termasuk statistik dan rekomendasi.
 */

const fs = require('fs');
const path = require('path');

const validExtensions = ['.tsx', '.jsx', '.ts', '.js'];

// Dark mode indicators
const darkModeIndicators = [
  'dark:',
  'useTheme',
  'ThemeProvider',
  'next-themes',
  'var(--',
  '.dark'
];

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

function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    let hasDarkMode = false;
    let darkModeFeatures = [];
    let darkModeClasses = [];
    
    // Check for dark mode indicators
    darkModeIndicators.forEach(indicator => {
      if (content.includes(indicator)) {
        hasDarkMode = true;
        darkModeFeatures.push(indicator);
      }
    });
    
    // Count dark: classes
    const darkClassMatches = content.match(/dark:[a-z-]+/g);
    if (darkClassMatches) {
      darkModeClasses = [...new Set(darkClassMatches)];
    }
    
    return {
      hasDarkMode,
      darkModeFeatures,
      darkModeClasses,
      linesOfCode: lines.length
    };
  } catch (error) {
    return {
      hasDarkMode: false,
      darkModeFeatures: [],
      darkModeClasses: [],
      linesOfCode: 0,
      error: error.message
    };
  }
}

function generateReport() {
  const srcPath = path.join(process.cwd(), 'src');
  
  if (!fs.existsSync(srcPath)) {
    console.error('❌ src directory not found!');
    process.exit(1);
  }

  console.log('📊 Generating Dark Mode Implementation Report...\n');
  
  const allFiles = getAllFiles(srcPath);
  let totalFiles = 0;
  let darkModeFiles = 0;
  let totalDarkModeClasses = 0;
  let fileReports = [];

  allFiles.forEach(filePath => {
    const relativePath = path.relative(process.cwd(), filePath);
    const analysis = analyzeFile(filePath);
    
    totalFiles++;
    if (analysis.hasDarkMode) {
      darkModeFiles++;
    }
    totalDarkModeClasses += analysis.darkModeClasses.length;
    
    fileReports.push({
      path: relativePath,
      ...analysis
    });
  });

  // Sort files by dark mode implementation
  fileReports.sort((a, b) => b.darkModeClasses.length - a.darkModeClasses.length);

  // Generate report
  const reportDate = new Date().toISOString().split('T')[0];
  const reportContent = `# 🌙 Dark Mode Implementation Report
Generated: ${reportDate}

## Summary
- **Total Files**: ${totalFiles}
- **Files with Dark Mode**: ${darkModeFiles} (${Math.round(darkModeFiles/totalFiles*100)}%)
- **Total Dark Mode Classes**: ${totalDarkModeClasses}
- **Coverage**: ${Math.round(darkModeFiles/totalFiles*100)}%

## Top Files by Dark Mode Implementation

${fileReports.slice(0, 10).map((file, index) => `
${index + 1}. **${file.path}**
   - Dark classes: ${file.darkModeClasses.length}
   - Features: ${file.darkModeFeatures.join(', ') || 'None'}
   - Lines: ${file.linesOfCode}
`).join('')}

## Files WITHOUT Dark Mode Support
${fileReports.filter(f => !f.hasDarkMode).map(file => `- ${file.path}`).join('\n')}

## Most Used Dark Mode Classes
${(() => {
  const classCount = {};
  fileReports.forEach(file => {
    file.darkModeClasses.forEach(cls => {
      classCount[cls] = (classCount[cls] || 0) + 1;
    });
  });
  
  return Object.entries(classCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([cls, count]) => `- \`${cls}\`: ${count} times`)
    .join('\n');
})()}

## Recommendations
${darkModeFiles/totalFiles < 0.8 ? '- ⚠️ Consider running `npm run add-dark-mode` to increase coverage' : '- ✅ Good dark mode coverage!'}
${totalDarkModeClasses < 50 ? '- 💡 Add more dark mode styling for better UX' : '- ✅ Comprehensive dark mode styling!'}
${fileReports.some(f => f.error) ? '- ❌ Some files had parsing errors, check console' : '- ✅ All files parsed successfully'}

## File Details
${fileReports.map(file => `
### ${file.path}
- **Dark Mode**: ${file.hasDarkMode ? '✅' : '❌'}
- **Classes**: ${file.darkModeClasses.length} (${file.darkModeClasses.slice(0, 5).join(', ')}${file.darkModeClasses.length > 5 ? '...' : ''})
- **Features**: ${file.darkModeFeatures.join(', ') || 'None'}
- **Lines**: ${file.linesOfCode}
${file.error ? `- **Error**: ${file.error}` : ''}
`).join('')}
`;

  // Write report to file
  const reportPath = path.join(process.cwd(), 'DARK_MODE_REPORT.md');
  fs.writeFileSync(reportPath, reportContent, 'utf8');
  
  console.log('📋 Dark Mode Implementation Report');
  console.log('====================================');
  console.log(`📁 Total Files: ${totalFiles}`);
  console.log(`🌙 Dark Mode Files: ${darkModeFiles} (${Math.round(darkModeFiles/totalFiles*100)}%)`);
  console.log(`🎨 Total Dark Classes: ${totalDarkModeClasses}`);
  console.log(`📊 Coverage: ${Math.round(darkModeFiles/totalFiles*100)}%`);
  console.log(`\n📄 Full report saved to: ${reportPath}`);
  
  // Show files without dark mode
  const filesWithoutDarkMode = fileReports.filter(f => !f.hasDarkMode);
  if (filesWithoutDarkMode.length > 0) {
    console.log(`\n⚠️  Files without dark mode (${filesWithoutDarkMode.length}):`);
    filesWithoutDarkMode.slice(0, 5).forEach(file => {
      console.log(`   - ${file.path}`);
    });
    if (filesWithoutDarkMode.length > 5) {
      console.log(`   ... and ${filesWithoutDarkMode.length - 5} more`);
    }
  }

  console.log('\n🚀 Run `npm run add-dark-mode` to auto-convert more files!');
}

if (require.main === module) {
  generateReport();
}

module.exports = { generateReport, analyzeFile };
