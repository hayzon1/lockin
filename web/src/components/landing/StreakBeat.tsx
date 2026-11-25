import { motion, useTransform } from 'framer-motion';
import type { MotionValue } from 'framer-motion';
import { Flame } from 'lucide-react';
import Beat, { Visual } from './Beat';
import ScrollStage from './ScrollStage';

const GOAL = 30;
const MILESTONES = [7, 14, 21, 30];
// Days 1 to 21 grow while the title arrives. Days 21 to 30 are left for after.
const FROM = 0.06;
const MID = 0.22;
const TO = 0.9;
const MID_DAY = 21;

const atDay = (d: number) =>
  d <= MID_DAY ? FROM + ((MID - FROM) * d) / MID_DAY : MID + ((TO - MID) * (d - MID_DAY)) / (GOAL - MID_DAY);

function Pulse({ p, day }: { p: MotionValue<number>; day: number }) {
  const at = atDay(day);
  const scale = useTransform(p, [at, at + 0.12], [1, 1.7]);
  const opacity = useTransform(p, [at, at + 0.04, at + 0.12], [0, 0.6, 0]);
  return (
    <motion.span
      aria-hidden
      style={{ scale, opacity }}
      className="absolute inset-0 rounded-full border-2 border-amber-500"
    />
  );
}

function Badge({ p, day }: { p: MotionValue<number>; day: number }) {
  const at = atDay(day);
  const on = useTransform(p, [at - 0.01, at + 0.02], [0, 1]);
  return (
    <span className="flex items-center gap-1.5 rounded-full border border-zinc-300 px-3 py-1 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
      <span className="relative h-4 w-4">
        <Flame className="absolute inset-0 h-4 w-4 text-zinc-400 dark:text-zinc-600" aria-hidden />
        <motion.span style={{ opacity: on }} className="absolute inset-0">
          <Flame className="h-4 w-4 text-amber-500" aria-hidden />
        </motion.span>
      </span>
      {day}
    </span>
  );
}

function StreakContent({ p }: { p: MotionValue<number> }) {
  const v = p;
  const prog = useTransform(v, [FROM, MID, TO], [0, MID_DAY / GOAL, 1]);
  const count = useTransform(prog, (v) => Math.round(v * GOAL));
  const flameScale = useTransform(prog, [0, 1], [0.9, 1.35]);
  const glow = useTransform(prog, [0, 1], [0, 0.55]);

  return (
    <>
      <Beat p={p} reveal="pop" label="The streak" title="Show up and the streak grows." />
      <Visual p={p} from={0.06} className="mt-8 flex flex-col items-center">
        <div className="relative flex h-44 w-44 items-center justify-center">
          {MILESTONES.map((d) => (
            <Pulse key={d} p={v} day={d} />
          ))}
          <motion.div
            aria-hidden
            style={{ opacity: glow }}
            className="absolute h-32 w-32 rounded-full bg-amber-500/30 blur-2xl"
          />
          <svg viewBox="0 0 176 176" className="absolute inset-0 h-full w-full" aria-hidden>
            <g transform="rotate(-90 88 88)">
              <circle cx="88" cy="88" r="80" fill="none" strokeWidth="5" className="stroke-zinc-200 dark:stroke-zinc-800" />
              <motion.circle
                cx="88"
                cy="88"
                r="80"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="5"
                strokeLinecap="round"
                style={{ pathLength: prog }}
              />
            </g>
          </svg>
          <div className="relative flex flex-col items-center">
            <motion.span style={{ scale: flameScale }} className="text-amber-500">
              <Flame className="h-6 w-6" aria-hidden />
            </motion.span>
            <motion.span className="text-6xl font-light tabular-nums">{count}</motion.span>
            <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              day streak
            </span>
          </div>
        </div>
        <div className="mt-8 flex gap-2">
          {MILESTONES.map((d) => (
            <Badge key={d} p={v} day={d} />
          ))}
        </div>
      </Visual>
    </>
  );
}

export default function StreakBeat() {
  return <ScrollStage heightVh={400}>{(p) => <StreakContent p={p} />}</ScrollStage>;
}
