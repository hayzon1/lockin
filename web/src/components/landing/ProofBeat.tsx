import { motion, useTransform } from 'framer-motion';
import type { MotionValue } from 'framer-motion';
import Beat, { Visual } from './Beat';
import { useVisualProgress } from './timeline';
import ScrollStage from './ScrollStage';

const COLS = 14;
const ROWS = 7;

// Deterministic pattern that gets denser toward the right, like real progress.
function level(col: number, row: number): number {
  const progress = col / (COLS - 1);
  const noise = ((col * 7 + row * 13 + col * row * 3) % 10) / 10;
  const v = progress * 0.7 + noise * 0.5;
  if (v < 0.25) return 0;
  if (v < 0.5) return 1;
  if (v < 0.75) return 2;
  if (v < 0.95) return 3;
  return 4;
}

const LEVEL_CLASS = [
  'bg-zinc-200 dark:bg-zinc-800',
  'bg-emerald-500/25',
  'bg-emerald-500/50',
  'bg-emerald-500/75',
  'bg-emerald-500',
];

const CELLS = Array.from({ length: COLS * ROWS }, (_, i) => ({
  col: Math.floor(i / ROWS),
  lvl: level(Math.floor(i / ROWS), i % ROWS),
}));

function Cell({ p, col, lvl }: { p: MotionValue<number>; col: number; lvl: number }) {
  const start = 0.05 + (col / COLS) * 0.7;
  const opacity = useTransform(p, [start, start + 0.08], [0, 1]);
  return <motion.span style={{ opacity }} className={`aspect-square rounded-[4px] ${LEVEL_CLASS[lvl]}`} />;
}

function ProofContent({ p }: { p: MotionValue<number> }) {
  const v = useVisualProgress(p, false);
  const draw = useTransform(v, [0.1, 0.95], [0, 1]);
  const pct = useTransform(v, [0.1, 0.95], [0, 86], { clamp: true });
  const pctText = useTransform(pct, (v) => `${Math.round(v)}%`);

  return (
    <>
      <Beat p={p} reveal="wipe" label="The proof" title="See your growth, not just feel it." />
      <Visual p={p} className="mt-8 w-full max-w-sm sm:max-w-md">
        <div
          role="img"
          aria-label="A heatmap of daily check-ins getting denser over time"
          className="grid auto-cols-fr grid-flow-col grid-rows-[repeat(7,minmax(0,1fr))] gap-1"
        >
          {CELLS.map((c, i) => (
            <Cell key={i} p={v} col={c.col} lvl={c.lvl} />
          ))}
        </div>
        <svg viewBox="0 0 300 80" className="mt-6 h-20 w-full" role="img" aria-label="A line trending upward" fill="none">
          <motion.path
            d="M4 72 C 40 68, 62 58, 92 52 S 150 40, 182 30 S 250 14, 296 8"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
            style={{ pathLength: draw }}
          />
        </svg>
        <div className="mt-2 flex items-baseline justify-center gap-2">
          <motion.span className="text-3xl font-light tabular-nums">{pctText}</motion.span>
          <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            consistency, example data
          </span>
        </div>
      </Visual>
    </>
  );
}

export default function ProofBeat() {
  return <ScrollStage heightVh={320}>{(p) => <ProofContent p={p} />}</ScrollStage>;
}
