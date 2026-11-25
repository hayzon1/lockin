import { motion, useTransform } from 'framer-motion';
import type { MotionValue } from 'framer-motion';
import Beat, { Visual } from './Beat';
import ScrollStage from './ScrollStage';

const PATH = 'M30 200 C 60 185, 85 165, 110 140 S 170 125, 200 100 S 235 65, 250 40';
// Anchor points sit exactly on the path; "at" is the scroll progress where the line reaches them.
// "at" is the scroll progress of the beat. The line draws while the second sentence is read.
const DRAW: [number, number] = [0.26, 0.86];
const SUB_RANGE: [number, number] = [0.26, 0.84];
const MILESTONES = [
  { x: 110, y: 140, at: 0.48, label: 'Milestone 1', lx: 120, ly: 158 },
  { x: 200, y: 100, at: 0.69, label: 'Milestone 2', lx: 208, ly: 118 },
];
const GOAL_AT = 0.86;

function Dot({ p, x, y, at }: { p: MotionValue<number>; x: number; y: number; at: number }) {
  const on = useTransform(p, [at - 0.02, at + 0.02], [0, 1]);
  return (
    <g>
      <circle cx={x} cy={y} r="6" className="fill-zinc-50 stroke-zinc-300 dark:fill-zinc-950 dark:stroke-zinc-700" strokeWidth="2" />
      <motion.circle cx={x} cy={y} r="6" fill="#10b981" style={{ opacity: on }} />
    </g>
  );
}

function LongGoalContent({ p }: { p: MotionValue<number> }) {
  const v = p;
  const draw = useTransform(v, DRAW, [0, 1]);
  const flag = useTransform(v, [GOAL_AT - 0.02, GOAL_AT + 0.02], [0, 1]);
  const quote = useTransform(v, [0.88, 0.97], [0, 1]);
  const quoteY = useTransform(v, [0.88, 0.97], [8, 0]);

  return (
    <>
      <Beat
        p={p}
        reveal="rise"
        subReveal="underline"
        subRange={SUB_RANGE}
        label="The long game"
        title="Start with where you want to be in six months."
        sub="Set a long-term goal with a target date and milestones. LOCKIN suggests small daily habits that get you there."
      />
      <Visual p={p} from={0.06} className="mt-6 w-full max-w-sm sm:max-w-md">
        <svg viewBox="0 0 300 230" className="mx-auto h-auto max-h-[34svh] w-full" role="img" aria-label="A path that draws itself toward a goal, passing two milestones">
          <path d={PATH} fill="none" strokeWidth="3" strokeDasharray="4 7" strokeLinecap="round" className="stroke-zinc-300 dark:stroke-zinc-700" />
          <motion.path d={PATH} fill="none" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" style={{ pathLength: draw }} />

          <Dot p={v} x={30} y={200} at={0.08} />
          <text x="30" y="222" fontSize="10" textAnchor="start" className="fill-zinc-500 dark:fill-zinc-400">Today</text>

          {MILESTONES.map((m) => (
            <g key={m.label}>
              <Dot p={v} x={m.x} y={m.y} at={m.at} />
              <text x={m.lx} y={m.ly} fontSize="10" className="fill-zinc-500 dark:fill-zinc-400">{m.label}</text>
            </g>
          ))}

          <line x1="250" y1="40" x2="250" y2="14" strokeWidth="2.5" strokeLinecap="round" className="stroke-zinc-300 dark:stroke-zinc-700" />
          <path d="M250 14 L268 21 L250 28 Z" className="fill-zinc-300 dark:fill-zinc-700" />
          <motion.g style={{ opacity: flag }}>
            <line x1="250" y1="40" x2="250" y2="14" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M250 14 L268 21 L250 28 Z" fill="#10b981" />
          </motion.g>
          <text x="244" y="30" fontSize="10" textAnchor="end" className="fill-zinc-500 dark:fill-zinc-400">Your goal</text>
        </svg>
        <motion.p style={{ opacity: quote, y: quoteY }} className="mt-4 text-sm italic text-zinc-600 dark:text-zinc-400">
          “I am becoming someone who shows up.”
        </motion.p>
      </Visual>
    </>
  );
}

export default function LongGoalBeat() {
  return <ScrollStage heightVh={560}>{(p) => <LongGoalContent p={p} />}</ScrollStage>;
}
