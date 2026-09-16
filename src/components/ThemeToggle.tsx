import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  compact?: boolean;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ compact = false, className = '' }) => {
  const { theme, setTheme, isDark } = useTheme();

  if (compact) {
    return (
      <button
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-amber-400 hover:text-amber-300 hover:border-slate-700'
            : 'bg-white border-[#D9E1EA] text-slate-700 hover:text-[#0F172A] hover:bg-[#F1F5F9] shadow-sm'
        } ${className}`}
        title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
        aria-label="Toggle Theme"
      >
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
    );
  }

  return (
    <div
      className={`inline-flex items-center p-1 rounded-xl border transition-all font-mono text-xs ${
        isDark
          ? 'bg-slate-950 border-slate-800'
          : 'bg-[#F1F5F9] border-[#D9E1EA]'
      } ${className}`}
      role="group"
      aria-label="Theme Switcher"
    >
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
          !isDark
            ? 'bg-white text-[#0F172A] shadow-sm border border-[#E2E8F0]'
            : 'text-slate-400 hover:text-slate-200'
        }`}
        title="Light Theme"
      >
        <Sun className={`w-3.5 h-3.5 ${!isDark ? 'text-amber-500' : 'text-slate-400'}`} />
        <span className="hidden sm:inline">Light</span>
      </button>

      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
          isDark
            ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
            : 'text-[#64748B] hover:text-[#0F172A]'
        }`}
        title="Dark Theme"
      >
        <Moon className={`w-3.5 h-3.5 ${isDark ? 'text-slate-950' : 'text-[#64748B]'}`} />
        <span className="hidden sm:inline">Dark</span>
      </button>
    </div>
  );
};
