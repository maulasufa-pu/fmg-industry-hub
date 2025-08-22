'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement>;

export function ThemeToggle({ className = "", ...props }: Props) {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()

  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      aria-pressed={resolvedTheme === 'dark'}
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      // base style; center icon; NO fixed positioning
      className={[
        "relative grid h-11 w-11 place-items-center rounded-full",
        "border border-black/10 bg-white/70 backdrop-blur shadow-sm",
        "hover:shadow-md transition-all",
        "dark:border-white/10 dark:bg-black/40",
        className
      ].join(" ")}
      {...props}
    >
      <Sun  className="h-5 w-5 rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0 text-yellow-500" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100 text-blue-500" />
    </button>
  )
}
export default ThemeToggle
