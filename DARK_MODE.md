# 🌙 Dark Mode Implementation

## Overview
Implementasi dark mode untuk FMG Industry Hub menggunakan Next.js, Tailwind CSS, dan next-themes. Semua halaman yang sudah ada telah dikonversi untuk mendukung dark mode tanpa mengubah fungsionalitas asli.

## Features
- ✅ **One-Click Toggle**: Tombol toggle fixed di pojok kanan atas
- ✅ **Automatic Conversion**: Script otomatis untuk menambahkan dark mode ke halaman baru
- ✅ **Persistent State**: Tema disimpan di localStorage
- ✅ **Smooth Transitions**: Animasi smooth saat switching tema
- ✅ **CSS Variables Support**: Menggunakan CSS custom properties untuk konsistensi

## Implementation Details

### 1. Theme Provider Setup
```tsx
// src/components/theme-provider.tsx
import { ThemeProvider as NextThemesProvider } from 'next-themes'

export function ThemeProvider({ children, ...props }) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

### 2. Theme Toggle Component
```tsx
// src/components/theme-toggle.tsx
'use client'
import { useTheme } from 'next-themes'
// Fixed position toggle button dengan icon animasi
```

### 3. Root Layout Integration
```tsx
// src/app/layout.tsx
<ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
  <ThemeToggle />
  {children}
</ThemeProvider>
```

### 4. CSS Variables for Dark Mode
```css
/* src/app/globals.css */
:root {
  /* Light theme tokens */
}

.dark {
  /* Dark theme tokens */
}
```

## Usage

### Manual Dark Mode Classes
Untuk menambahkan dark mode secara manual ke komponen:
```tsx
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  Content
</div>
```

### Automatic Conversion Script
Untuk halaman baru, jalankan script otomatis:
```bash
npm run add-dark-mode
```

Script akan otomatis:
- Scan semua file .tsx, .jsx, .ts, .js di direktori src/
- Menambahkan dark mode classes yang sesuai
- Backup tidak diperlukan karena hanya menambahkan classes

### Custom Dark Mode Mapping
Edit `scripts/add-dark-mode.js` untuk menambahkan mapping baru:
```javascript
const darkModeMapping = {
  'bg-custom-light': 'bg-custom-light dark:bg-custom-dark',
  // Add more mappings
}
```

## Converted Files
✅ **44 files** telah dikonversi otomatis, termasuk:
- Admin pages & components
- Client pages & components  
- UI components
- Auth components
- Settings components

## Color Tokens

### Light Theme
- Background: `oklch(1 0 0)` (white)
- Foreground: `oklch(0.145 0 0)` (near black)
- Card: `oklch(1 0 0)` (white)

### Dark Theme  
- Background: `oklch(0.05 0 0)` (near black)
- Foreground: `oklch(0.95 0 0)` (near white)
- Card: `oklch(0.08 0 0)` (dark gray)

### Brand Colors
- Tetap konsisten di light/dark mode
- Custom variables untuk project-specific colors

## Testing
1. **Toggle Test**: Klik tombol di pojok kanan atas
2. **Persistence Test**: Refresh halaman, tema harus tersimpan
3. **Page Navigation**: Tema konsisten saat navigasi
4. **Component Test**: Semua komponen harus readable di kedua mode

## Future Enhancements
- [ ] System theme detection
- [ ] Multiple theme variants (blue, green, etc)
- [ ] Theme-aware images/illustrations
- [ ] Keyboard shortcuts (Ctrl+Shift+D)

## Troubleshooting

### Toggle Button Tidak Muncul
- Pastikan ThemeProvider mengelilingi aplikasi
- Check console untuk JavaScript errors

### Styling Tidak Berubah
- Pastikan class `dark:` sudah ditambahkan
- Verify Tailwind config: `darkMode: ['class']`
- Check CSS variables untuk custom properties

### Performance Issues
- Dark mode menggunakan CSS variables, minimal impact
- Transitions dapat di-disable dengan `disableTransitionOnChange`

## File Structure
```
src/
├── components/
│   ├── theme-provider.tsx     # Theme context provider
│   └── theme-toggle.tsx       # Toggle button component
├── app/
│   ├── globals.css           # Dark mode CSS variables
│   └── layout.tsx            # Provider integration
└── scripts/
    └── add-dark-mode.js      # Auto-conversion script
```
