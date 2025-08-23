'use client'

import { Moon, SunMedium /*, SunDim */ } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement>;

export function ThemeToggle({ className = "", ...props }: Props) {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      aria-pressed={isDark}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={[
        "relative grid h-11 w-11 place-items-center rounded-full",
        "border border-black/20 bg-black text-white shadow-sm",
        "hover:opacity-90 transition-all",
        className
      ].join(" ")}
      {...props}
    >
      {/* SunMedium: lebih jelas; hitam saat light */}
      <SunMedium
        strokeWidth={2.75}
        className="h-5 w-5 text-black rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0"
      />

      {/* Alternatif: kalau mau coba yang lebih minimal */}
      {/* <SunDim strokeWidth={2.75} className="h-5 w-5 text-black rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0" /> */}

      {/* Moon tetap sama */}
      <Moon className="absolute h-5 w-5 text-blue-500 rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100" />
    </button>
  )
}
export default ThemeToggle
