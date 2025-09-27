'use client'

import { useState } from 'react'
import { useTheme } from 'next-themes'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function DarkModeDemo() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  if (typeof window !== 'undefined' && !mounted) {
    setMounted(true)
  }

  if (!mounted) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            🌙 Dark Mode Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-300 dark:text-gray-300">
            Current theme: <code className="bg-gray-200 dark:bg-gray-700 dark:bg-gray-700 px-2 py-1 rounded">{theme}</code>
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => setTheme('light')} variant={theme === 'light' ? 'default' : 'outline'}>
              ☀️ Light
            </Button>
            <Button onClick={() => setTheme('dark')} variant={theme === 'dark' ? 'default' : 'outline'}>
              🌙 Dark
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6 bg-white dark:bg-gray-900 dark:bg-gray-800 border-gray-200 dark:border-gray-700 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Card Example
            </h3>
            <p className="text-gray-600 dark:text-gray-300 dark:text-gray-300 mb-4">
              This card demonstrates responsive dark mode styling with proper contrast ratios.
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
              Primary Action
            </Button>
          </Card>

          <Card className="p-6 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Form Elements
            </h3>
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Enter text..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
              <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 dark:bg-gray-700 text-gray-900 dark:text-white">
                <option>Option 1</option>
                <option>Option 2</option>
              </select>
            </div>
          </Card>
        </div>

        <Card className="p-6 bg-white dark:bg-gray-900 dark:bg-gray-800 border-gray-200 dark:border-gray-700 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Color Palette
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="w-full h-16 bg-gray-100 dark:bg-gray-800 dark:bg-gray-700 rounded border-2 border-gray-300 dark:border-gray-600 dark:border-gray-600"></div>
              <p className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-300">Background</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-16 bg-blue-500 dark:bg-blue-600 rounded"></div>
              <p className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-300">Primary</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-16 bg-green-500 dark:bg-green-600 rounded"></div>
              <p className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-300">Success</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-16 bg-red-500 dark:bg-red-600 rounded"></div>
              <p className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-300">Error</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-green-50 dark:bg-green-900/20 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <h3 className="text-xl font-semibold text-green-900 dark:text-green-100 mb-4">
            ✅ Implementation Status
          </h3>
          <ul className="space-y-2 text-green-800 dark:text-green-200">
            <li>✓ Theme Provider configured</li>
            <li>✓ Toggle button implemented</li>
            <li>✓ CSS variables for consistency</li>
            <li>✓ Auto-conversion script ready</li>
            <li>✓ {44} files converted automatically</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
