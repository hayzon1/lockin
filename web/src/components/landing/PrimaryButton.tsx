import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';

interface PrimaryButtonProps {
  onClick: () => void;
  children: ReactNode;
  small?: boolean;
}

export default function PrimaryButton({ onClick, children, small = false }: PrimaryButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-700 font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400 dark:focus-visible:ring-offset-zinc-950 ${
        small ? 'h-10 px-4 text-sm' : 'h-12 px-7 text-base'
      }`}
    >
      <span>{children}</span>
      {!small && <ArrowRight className="h-4 w-4" aria-hidden />}
    </button>
  );
}
