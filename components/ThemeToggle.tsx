'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div 
        className={`w-9 h-9 rounded-xl border border-slate-700/50 dark:border-slate-800 bg-slate-800/40 dark:bg-slate-900/60 flex items-center justify-center text-slate-400 ${className}`}
        aria-hidden="true"
      >
        <span className="w-4 h-4 opacity-0" />
      </div>
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={`relative w-9 h-9 rounded-xl border border-slate-300 dark:border-slate-700/80 bg-slate-100 hover:bg-slate-200 dark:bg-[#1a2235] dark:hover:bg-[#222d45] text-slate-700 dark:text-slate-300 flex items-center justify-center transition-all duration-300 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${className}`}
    >
      <Sun 
        className={`w-4 h-4 absolute transition-all duration-300 text-amber-500 ${
          isDark 
            ? 'scale-0 rotate-90 opacity-0 pointer-events-none' 
            : 'scale-100 rotate-0 opacity-100'
        }`} 
      />
      <Moon 
        className={`w-4 h-4 absolute transition-all duration-300 text-cyan-400 ${
          isDark 
            ? 'scale-100 rotate-0 opacity-100' 
            : 'scale-0 -rotate-90 opacity-0 pointer-events-none'
        }`} 
      />
    </button>
  );
}
