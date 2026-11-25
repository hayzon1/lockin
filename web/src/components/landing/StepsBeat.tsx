import { motion, useReducedMotion, useTransform } from 'framer-motion';
import type { MotionValue } from 'framer-motion';
import { Flag, Lock, ShieldCheck, UserPlus } from 'lucide-react';
import type { ReactNode } from 'react';
import Beat from './Beat';
import { Reveal } from './motion';
import Padlock from './Padlock';
import PrimaryButton from './PrimaryButton';
import ScrollStage from './ScrollStage';
import { useVisualProgress } from './timeline';

const STEPS: { name: string; desc: string; icon: ReactNode; from: number; lock?: boolean }[] = [
  { name: 'Register', desc: 'Create your private account.', icon: <UserPlus className="h-9 w-9" aria-hidden />, from: 0.02 },
  { name: 'Create goals', desc: 'Set a long-term goal and pick your habits.', icon: <Flag className="h-9 w-9" aria-hidden />, from: 0.38 },
  { name: 'Lock in', desc: 'Check in every day and watch the streak grow.', icon: <Lock className="h-9 w-9" aria-hidden />, from: 0.66, lock: true },
];

// The title is read first. Then the track holds on each step and slides to the next one.
const SLIDE_AT = [0, 0.3, 0.38, 0.58, 0.66, 0.84, 0.9, 1];
const SLIDE_TO = ['0%', '0%', '-25%', '-25%', '-50%', '-50%', '-75%', '-75%'];

function Cta({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <div className="flex flex-col items-center gap-5">
      <PrimaryButton onClick={onGetStarted}>Get started</PrimaryButton>
      <p className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        <ShieldCheck className="h-4 w-4 text-emerald-700 dark:text-emerald-400" aria-hidden />
        Private by default. No leaderboards.
      </p>
    </div>
  );
}

function StepPanel({
  p,
  index,
  step,
}: {
  p: MotionValue<number>;
  index: number;
  step: (typeof STEPS)[number];
}) {
  const ring = useTransform(p, [step.from + 0.02, step.from + 0.1], [0, 1]);
  const lockT = useTransform(p, [step.from + 0.04, step.from + 0.14], [0, 1]);
  const scale = useTransform(p, [step.from, step.from + 0.07], [0.85, 1]);
  const opacity = useTransform(p, [step.from, step.from + 0.06], [0.3, 1]);

  return (
    <motion.div style={{ scale, opacity }} className="flex w-1/4 shrink-0 flex-col items-center gap-4 px-6">
      <div className="relative flex h-24 w-24 items-center justify-center text-emerald-700 dark:text-emerald-400">
        <svg viewBox="0 0 96 96" className="absolute inset-0 h-full w-full" aria-hidden fill="none">
          <circle cx="48" cy="48" r="44" strokeWidth="2" className="stroke-zinc-200 dark:stroke-zinc-800" />
          <g transform="rotate(-90 48 48)">
            <motion.circle cx="48" cy="48" r="44" stroke="#10b981" strokeWidth="3" strokeLinecap="round" style={{ pathLength: ring }} />
          </g>
        </svg>
        {step.lock ? <Padlock t={lockT} className="h-16 w-14" /> : step.icon}
      </div>
      <span className="font-mono text-sm text-emerald-700 dark:text-emerald-400">0{index + 1}</span>
      <span className="text-5xl font-light tracking-tight sm:text-7xl">{step.name}</span>
      <span className="max-w-xs text-base text-zinc-600 dark:text-zinc-400 sm:text-lg">{step.desc}</span>
    </motion.div>
  );
}

function FinalPanel({ p, onGetStarted }: { p: MotionValue<number>; onGetStarted: () => void }) {
  const opacity = useTransform(p, [0.9, 0.96], [0.2, 1]);
  const scale = useTransform(p, [0.9, 0.96], [0.9, 1]);
  return (
    <motion.div style={{ opacity, scale }} className="flex w-1/4 shrink-0 flex-col items-center justify-center px-6">
      <Cta onGetStarted={onGetStarted} />
    </motion.div>
  );
}

function StepsContent({ p, onGetStarted }: { p: MotionValue<number>; onGetStarted: () => void }) {
  const v = useVisualProgress(p, false);
  const x = useTransform(v, SLIDE_AT, SLIDE_TO);
  const hint = useTransform(v, [0, 0.04, 0.84, 0.9], [0, 1, 1, 0]);
  const trackIn = useTransform(v, [0, 0.04], [0, 1]);

  return (
    <>
      <Beat p={p} reveal="rise" label="The way in" title="3 easy steps to new growth" />
      <motion.div style={{ opacity: trackIn }} className="mt-8 w-full overflow-hidden">
        <motion.div style={{ x }} className="flex w-[400%]">
          {STEPS.map((s, i) => (
            <StepPanel key={s.name} p={v} index={i} step={s} />
          ))}
          <FinalPanel p={v} onGetStarted={onGetStarted} />
        </motion.div>
      </motion.div>
      <div className="mt-8 h-1 w-40 rounded bg-zinc-200 dark:bg-zinc-800">
        <motion.div style={{ scaleX: v }} className="h-full origin-left rounded bg-emerald-500" />
      </div>
      <motion.p
        aria-hidden
        style={{ opacity: hint }}
        className="mt-3 font-mono text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400"
      >
        Keep scrolling
      </motion.p>
    </>
  );
}

/** Reduced motion: a plain vertical list, no sideways travel. */
function StepsStatic({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section className="flex min-h-[100svh] flex-col items-center justify-center px-6 py-24 text-center">
      <Beat label="The way in" title="3 easy steps to new growth" />
      <ol className="mt-10 grid w-full max-w-2xl gap-3 sm:grid-cols-3">
        {STEPS.map((s, i) => (
          <li
            key={s.name}
            className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white px-5 py-5 text-left dark:border-zinc-800 dark:bg-zinc-900/70"
          >
            <span className="font-mono text-sm text-emerald-700 dark:text-emerald-400">0{i + 1}</span>
            <span className="text-lg font-medium">{s.name}</span>
            <span className="text-sm text-zinc-600 dark:text-zinc-400">{s.desc}</span>
          </li>
        ))}
      </ol>
      <Reveal className="mt-12">
        <Cta onGetStarted={onGetStarted} />
      </Reveal>
    </section>
  );
}

export default function StepsBeat({ onGetStarted }: { onGetStarted: () => void }) {
  const reduce = useReducedMotion();
  if (reduce) return <StepsStatic onGetStarted={onGetStarted} />;
  return <ScrollStage heightVh={800}>{(p) => <StepsContent p={p} onGetStarted={onGetStarted} />}</ScrollStage>;
}
