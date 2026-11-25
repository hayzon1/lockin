import { useState } from 'react';
import { motion, useMotionValueEvent, useTransform } from 'framer-motion';
import type { MotionValue } from 'framer-motion';
import Beat, { Visual } from './Beat';
import ScrollStage from './ScrollStage';

const TOTAL = 90;
const COLS = 15;
const WINDOWS = [7, 30, 90];
const CHIPS = ['Write 100 words', 'Read 10 pages', 'Walk 20 minutes'];

// Words and calendar start together. The 7 day window is read along with the words,
// the 30 and 90 day windows are left for after.
const SUB_RANGE: [number, number] = [0.24, 0.48];
const COUNT_AT = [0.06, 0.4, 0.5, 0.66, 0.72, 0.95];

function windowIndex(v: number) {
  return v < 0.5 ? 0 : v < 0.72 ? 1 : 2;
}

// 63 of 90 days done (70%). A fixed pattern, so every visit looks the same.
const MISSED = new Set([2, 6, 9]);
const isDone = (i: number) => !MISSED.has((i * 7 + 3) % 10);
const DONE_BEFORE = Array.from({ length: TOTAL + 1 }, (_, n) =>
  Array.from({ length: n }, (_, i) => i).filter(isDone).length,
);
const SHADES = [1, 0.78, 0.6];

function Cell({ count, i }: { count: MotionValue<number>; i: number }) {
  const opacity = useTransform(count, [i, i + 1], [0, SHADES[i % 3]]);
  return (
    <span className="relative aspect-square rounded-[4px] bg-zinc-200 dark:bg-zinc-800">
      {isDone(i) && (
        <motion.span style={{ opacity }} className="absolute inset-0 rounded-[4px] bg-emerald-600 dark:bg-emerald-500" />
      )}
    </span>
  );
}

function WindowContent({ p }: { p: MotionValue<number> }) {
  const v = p;
  const [active, setActive] = useState(() => windowIndex(v.get()));
  useMotionValueEvent(v, 'change', (v) => setActive(windowIndex(v)));

  // Cells fill to 7, then 30, then 90 as you scroll.
  const count = useTransform(v, COUNT_AT, [0, 7, 7, 30, 30, TOTAL]);
  const doneText = useTransform(count, (c) => {
    const n = Math.min(TOTAL, Math.floor(c));
    return `${DONE_BEFORE[n]} of ${n} days done`;
  });
  const chipOpacity = useTransform(v, [0.06, 0.12], [0, 1]);
  const chipY = useTransform(v, [0.06, 0.12], [-14, 0]);

  return (
    <>
      <Beat
        p={p}
        reveal="blur"
        subReveal="marker"
        subRange={SUB_RANGE}
        label="The short game"
        title="Break it into windows: 7, 30 or 90 days."
        sub="Pick a tracking period and move your goal's habits into it. One active period at a time keeps you focused."
      />
      <Visual p={p} from={0.06} className="mt-6 w-full max-w-sm sm:max-w-md">
        <motion.div style={{ opacity: chipOpacity, y: chipY }} className="flex flex-wrap justify-center gap-2">
          {CHIPS.map((c) => (
            <span
              key={c}
              className="rounded-full border border-zinc-300 px-3 py-1 text-xs text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
            >
              {c}
            </span>
          ))}
        </motion.div>

        <div className="mt-5 flex justify-center gap-2">
          {WINDOWS.map((w, idx) => (
            <span
              key={w}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-300 ${
                idx === active
                  ? 'bg-emerald-700 text-white dark:bg-emerald-500 dark:text-zinc-950'
                  : 'border border-zinc-300 text-zinc-600 dark:border-zinc-800 dark:text-zinc-400'
              }`}
            >
              {w} days
            </span>
          ))}
        </div>

        <div
          role="img"
          aria-label="A calendar of 90 days filling in, first 7, then 30, then 90"
          className="mt-5 grid gap-1"
          style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: TOTAL }, (_, i) => (
            <Cell key={i} count={count} i={i} />
          ))}
        </div>
        <div className="mt-3 flex items-center justify-center gap-4 font-mono text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-2">
            <span aria-hidden className="h-2.5 w-2.5 rounded-sm bg-emerald-600 dark:bg-emerald-500" />
            Done
          </span>
          <span className="flex items-center gap-2">
            <span aria-hidden className="h-2.5 w-2.5 rounded-sm bg-zinc-200 dark:bg-zinc-700" />
            Missed
          </span>
        </div>
        <motion.p className="mt-2 text-center font-mono text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
          {doneText}
        </motion.p>
      </Visual>
    </>
  );
}

export default function WindowBeat() {
  return <ScrollStage heightVh={520}>{(p) => <WindowContent p={p} />}</ScrollStage>;
}
