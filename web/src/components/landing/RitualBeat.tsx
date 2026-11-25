import { useRef } from 'react';
import type { RefObject } from 'react';
import confetti from 'canvas-confetti';
import { motion, useMotionValueEvent, useTransform } from 'framer-motion';
import type { MotionValue } from 'framer-motion';
import Beat, { Visual } from './Beat';
import { useVisualProgress } from './timeline';
import ScrollStage from './ScrollStage';

const HABITS = ['Pray', 'Walk for 20 minutes', 'Read 10 pages', 'Plan tomorrow'];
// Scroll progress where each habit starts to check off.
const STARTS = [0.12, 0.34, 0.56, 0.78];
const LAST = STARTS.length - 1;
const LAST_DONE = STARTS[LAST] + 0.1;

function burst(el: HTMLElement | null) {
  const r = el?.getBoundingClientRect();
  const origin = r
    ? { x: (r.left + r.width / 2) / window.innerWidth, y: (r.top + r.height / 2) / window.innerHeight }
    : { x: 0.5, y: 0.6 };
  confetti({
    particleCount: 110,
    spread: 75,
    startVelocity: 38,
    origin,
    colors: ['#10b981', '#34d399', '#f59e0b', '#a1a1aa'],
    disableForReducedMotion: true,
  });
}

function HabitRow({
  label,
  p,
  start,
  rowRef,
}: {
  label: string;
  p: MotionValue<number>;
  start: number;
  rowRef?: RefObject<HTMLLIElement>;
}) {
  const fillOpacity = useTransform(p, [start, start + 0.03], [0, 1]);
  const fillScale = useTransform(p, [start, start + 0.05, start + 0.1], [0.6, 1.15, 1]);
  const tick = useTransform(p, [start + 0.04, start + 0.11], [0, 1]);
  const dim = useTransform(p, [start + 0.08, start + 0.14], [1, 0.5]);
  const strike = useTransform(p, [start + 0.08, start + 0.14], [0, 1]);

  return (
    <li ref={rowRef} className="flex items-center gap-3 rounded-xl px-3 py-3">
      <span className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-zinc-300 dark:border-zinc-700">
        <motion.span
          style={{ opacity: fillOpacity, scale: fillScale }}
          className="absolute inset-[-1px] rounded-md bg-emerald-500"
        />
        <svg viewBox="0 0 24 24" className="relative h-4 w-4 text-white dark:text-zinc-950" aria-hidden>
          <motion.path
            d="M5 12.5l4.5 4.5L19 7.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ pathLength: tick }}
          />
        </svg>
      </span>
      <motion.span style={{ opacity: dim }} className="relative text-base">
        {label}
        <motion.span
          aria-hidden
          style={{ scaleX: strike }}
          className="absolute left-0 right-0 top-1/2 h-px origin-left bg-zinc-500"
        />
      </motion.span>
    </li>
  );
}

function RitualContent({ p }: { p: MotionValue<number> }) {
  const v = useVisualProgress(p, false);
  const lastRef = useRef<HTMLLIElement>(null);
  const fired = useRef(false);
  const doneText = useTransform(v, (v) => `${STARTS.filter((s) => v >= s + 0.08).length} / 4 done`);

  // Confetti when the third habit is ticked. Scrolling back up re-arms it.
  useMotionValueEvent(v, 'change', (v) => {
    if (v >= LAST_DONE && !fired.current) {
      fired.current = true;
      burst(lastRef.current);
    } else if (v < STARTS[LAST]) {
      fired.current = false;
    }
  });

  return (
    <>
      <Beat p={p} reveal="light" label="The ritual" title="Each day, a short checklist. Check it off and move on." />
      <Visual p={p} className="mt-8 w-full max-w-sm sm:max-w-md">
        <ul className="space-y-1 rounded-2xl border border-zinc-200 bg-white p-3 text-left shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70">
          {HABITS.map((h, i) => (
            <HabitRow key={h} label={h} p={v} start={STARTS[i]} rowRef={i === LAST ? lastRef : undefined} />
          ))}
        </ul>
        <motion.p className="mt-4 font-mono text-[11px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
          {doneText}
        </motion.p>
      </Visual>
    </>
  );
}

export default function RitualBeat() {
  return <ScrollStage heightVh={360}>{(p) => <RitualContent p={p} />}</ScrollStage>;
}
