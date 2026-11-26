import { Moon, Sun, Target } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface LandingHeaderProps {
  onLogin: () => void;
}

export default function LandingHeader({ onLogin }: LandingHeaderProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200/60 bg-zinc-50/80 backdrop-blur-md dark:border-zinc-800/60 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-1.5 text-emerald-700 dark:text-emerald-400">
            <Target className="h-4 w-4" aria-hidden />
          </span>
          <span className="text-sm font-bold tracking-tight">LOCKIN</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-zinc-600 transition-colors hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-zinc-400 dark:hover:text-white"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={onLogin}
            className="h-10 cursor-pointer rounded-xl px-3 text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-zinc-300 dark:hover:text-white"
          >
            Log in
          </button>
        </div>
      </div>
    </header>
  );
}
