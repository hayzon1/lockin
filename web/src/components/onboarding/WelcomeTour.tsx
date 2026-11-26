import { useEffect, useState } from 'react';
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Calendar,
  CheckSquare,
  Compass,
  LayoutDashboard,
  Settings,
  Target,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Padlock from '../landing/Padlock';
import type { TabId } from '../../layouts/AppLayout';

interface Stop {
  id: TabId;
  label: string;
  icon: LucideIcon;
  title: string;
  body: string;
  example: string;
}

// Same order as the real navigation, so the tour matches what they will see.
const STOPS: Stop[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    title: 'Your day, at a glance.',
    body: 'Check off today’s habits, watch your streak grow and see how the week is going. This is where you will spend most of your time.',
    example: 'Open it every day. One check at a time keeps the streak alive.',
  },
  {
    id: 'tasks',
    label: 'Tasks',
    icon: CheckSquare,
    title: 'A planner for one-off to-dos.',
    body: 'Plan today, tomorrow or a date further out, and give each task a priority. Habits repeat. Tasks happen once.',
    example: 'Try: “Book dentist”, due Friday, medium priority.',
  },
  {
    id: 'goals',
    label: 'Goals',
    icon: Compass,
    title: 'Where you want to be.',
    body: 'Set a long-term goal with a target date, an identity statement and milestones. LOCKIN suggests the small daily habits that get you there.',
    example: 'Try: “I am becoming someone who shows up.”',
  },
  {
    id: 'periods',
    label: 'Periods',
    icon: Target,
    title: 'Short windows of focus.',
    body: 'Pick a tracking period of 7, 14, 21, 30, 60 or 90 days and move your goal’s habits into it. One active period at a time keeps you focused.',
    example: 'Start small. A 7 day window is a fine first one.',
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: Calendar,
    title: 'Every day, on one page.',
    body: 'A heatmap of your days. See when you showed up, spot the weak days and notice your patterns without any guesswork.',
    example: 'Darker squares mean a stronger day.',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    title: 'Progress you can see.',
    body: 'Consistency, streaks and trends over time. It is about showing up, not being perfect.',
    example: 'Check in once a week to see the bigger picture.',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    title: 'Make it yours.',
    body: 'Change your nickname, time zone and theme. Your data is private by default. There are no leaderboards and no one else sees your progress.',
    example: 'Set your time zone so your days roll over at the right time.',
  },
];

interface WelcomeTourProps {
  nickname: string;
  onFinish: (goTo?: TabId) => void;
}

export default function WelcomeTour({ nickname, onFinish }: WelcomeTourProps) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<'welcome' | 'tour'>('welcome');
  const [step, setStep] = useState(0);

  const lock = useMotionValue(reduce ? 1 : 0);
  useEffect(() => {
    if (reduce) return;
    const controls = animate(lock, 1, { duration: 1.3, delay: 0.35, ease: 'easeInOut' });
    return () => controls.stop();
  }, [lock, reduce]);

  const name = nickname.trim() || 'friend';
  const stop = STOPS[step];
  const last = step === STOPS.length - 1;
  const Icon = stop.icon;

  const rise = (delay: number) =>
    reduce
      ? {}
      : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.5 } };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(16,185,129,0.14),transparent)]"
      />
      <div className="relative mx-auto flex min-h-full w-full max-w-3xl flex-col items-center justify-center px-5 py-10 text-center">
        <AnimatePresence mode="wait">
          {phase === 'welcome' ? (
            <motion.div
              key="welcome"
              exit={reduce ? undefined : { opacity: 0, y: -12 }}
              className="flex flex-col items-center"
            >
              <Padlock t={lock} />
              <motion.p
                {...rise(0.2)}
                className="mt-6 font-mono text-sm font-bold uppercase tracking-[0.25em] text-emerald-700 dark:text-emerald-400"
              >
                Account created
              </motion.p>
              <motion.h1
                {...rise(0.45)}
                className="mt-3 max-w-2xl text-balance text-4xl font-light leading-tight tracking-tight sm:text-6xl"
              >
                Welcome to <span className="font-semibold">LOCKIN</span>,{' '}
                <span className="break-words font-semibold text-emerald-700 dark:text-emerald-400">{name}</span>.
              </motion.h1>
              <motion.p
                {...rise(0.75)}
                className="mt-5 max-w-md text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-lg"
              >
                Your space is private by default. Let us show you around, it takes less than a minute.
              </motion.p>
              <motion.div {...rise(1)} className="mt-8 flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPhase('tour')}
                  className="flex h-12 cursor-pointer items-center gap-2 rounded-xl bg-emerald-700 px-6 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-colors hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400 dark:focus-visible:ring-offset-zinc-950"
                >
                  Show me around
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => onFinish()}
                  className="cursor-pointer rounded-lg px-3 py-2 text-xs text-zinc-500 transition-colors hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:hover:text-white"
                >
                  Skip the tour
                </button>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="tour"
              initial={reduce ? undefined : { opacity: 0, y: 16 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              className="w-full"
            >
              <div className="flex items-center justify-between">
                <p className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-emerald-700 dark:text-emerald-400">
                  The tour, {step + 1} of {STOPS.length}
                </p>
                <button
                  type="button"
                  onClick={() => onFinish()}
                  className="cursor-pointer rounded-lg px-2 py-1.5 text-xs text-zinc-500 transition-colors hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:hover:text-white"
                >
                  Skip
                </button>
              </div>

              <div className="mt-5 flex h-1 gap-1" aria-hidden>
                {STOPS.map((s, i) => (
                  <span
                    key={s.id}
                    className={`h-full flex-1 rounded-full transition-colors duration-300 ${
                      i <= step ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-800'
                    }`}
                  />
                ))}
              </div>

              <div className="mt-6 grid gap-4 text-left md:grid-cols-[13rem_1fr]">
                {/* A miniature of the real navigation. The current stop is lit up. */}
                <nav
                  aria-label="Navigation preview"
                  className="flex gap-1 overflow-x-auto rounded-2xl border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900/60 md:flex-col md:overflow-visible"
                >
                  {STOPS.map((s, i) => {
                    const SIcon = s.icon;
                    const active = i === step;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setStep(i)}
                        aria-current={active ? 'step' : undefined}
                        className={`relative flex shrink-0 cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                          active
                            ? 'text-zinc-900 dark:text-white'
                            : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                        }`}
                      >
                        {active && (
                          <motion.span
                            layoutId="tour-active"
                            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                            className="absolute inset-0 rounded-xl border border-emerald-500/40 bg-emerald-500/10 shadow-[0_0_24px_-6px_rgba(16,185,129,0.5)]"
                          />
                        )}
                        <SIcon
                          className={`relative h-4 w-4 ${active ? 'text-emerald-600 dark:text-emerald-400' : ''}`}
                          aria-hidden
                        />
                        <span className="relative whitespace-nowrap">{s.label}</span>
                      </button>
                    );
                  })}
                </nav>

                <div className="flex min-h-[15rem] flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60 sm:p-8">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={stop.id}
                      initial={reduce ? undefined : { opacity: 0, x: 18 }}
                      animate={reduce ? undefined : { opacity: 1, x: 0 }}
                      exit={reduce ? undefined : { opacity: 0, x: -18 }}
                      transition={{ duration: 0.25 }}
                    >
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                        <Icon className="h-6 w-6" aria-hidden />
                      </span>
                      <p className="mt-4 font-mono text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                        {stop.label}
                      </p>
                      <h2 className="mt-1 text-2xl font-light tracking-tight sm:text-3xl">{stop.title}</h2>
                      <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-base">
                        {stop.body}
                      </p>
                      <p className="mt-4 rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-xs text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
                        {stop.example}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  disabled={step === 0}
                  className="flex h-11 cursor-pointer items-center gap-2 rounded-xl px-4 text-sm text-zinc-600 transition-colors hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:invisible dark:text-zinc-400 dark:hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                  Back
                </button>
                {last ? (
                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onFinish('dashboard')}
                      className="h-11 cursor-pointer rounded-xl border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-zinc-700 dark:text-zinc-300 dark:hover:text-white"
                    >
                      Go to dashboard
                    </button>
                    <button
                      type="button"
                      onClick={() => onFinish('goals')}
                      className="flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-colors hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400"
                    >
                      Create my first goal
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setStep((s) => s + 1)}
                    className="flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-colors hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400"
                  >
                    Next
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
