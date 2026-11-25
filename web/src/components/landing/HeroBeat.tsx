import { motion, useReducedMotion, useTransform } from 'framer-motion';
import type { MotionValue } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import Padlock from './Padlock';
import PrimaryButton from './PrimaryButton';
import ScrollStage from './ScrollStage';

function HeroContent({ p, onGetStarted }: { p: MotionValue<number>; onGetStarted: () => void }) {
  const reduce = useReducedMotion();
  const lock = useTransform(p, [0, 0.7], [0, 1]);
  const hint = useTransform(p, [0, 0.12], [1, 0]);

  return (
    <>
      <Padlock t={lock} />
      <h1 className="mt-4 max-w-2xl text-balance text-3xl font-light leading-tight tracking-tight sm:text-6xl">
        Welcome to the world of <span className="font-semibold">LOCKIN</span>.
      </h1>
      <p className="mt-5 max-w-xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-lg">
        A place where you are accountable for your daily actions and track your progress on every step. Think of it as
        keeping a streak with your own growth, a streak that is only yours.
      </p>
      <div className="mt-6">
        <PrimaryButton onClick={onGetStarted}>Get started</PrimaryButton>
      </div>
      <motion.div style={{ opacity: hint }} className="mt-6 flex flex-col items-center gap-2">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-600 dark:text-zinc-300">
          Scroll to lock in
        </span>
        <motion.span
          aria-hidden
          className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-400"
          animate={reduce ? undefined : { y: [0, 8, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ArrowDown className="h-5 w-5" />
        </motion.span>
      </motion.div>
    </>
  );
}

export default function HeroBeat({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <ScrollStage heightVh={240}>{(p) => <HeroContent p={p} onGetStarted={onGetStarted} />}</ScrollStage>
  );
}
