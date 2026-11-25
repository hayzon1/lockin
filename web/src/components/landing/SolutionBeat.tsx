import { motion, useTransform } from 'framer-motion';
import type { MotionValue } from 'framer-motion';
import { BeatLabel, ScrubWords } from './Beat';
import ReadAlong from './ReadAlong';
import ScrollStage from './ScrollStage';

// Motivation: big spikes that fade out. Habits: a steady staircase that keeps climbing.
const SPIKES =
  'M0 90 L18 28 L36 82 L56 18 L76 88 L96 46 L116 96 L136 66 L156 100 L176 84 L196 104 L216 98 L240 108 L270 105 L300 109';
const STAIRS = 'M0 112 H44 V94 H88 V76 H132 V58 H176 V40 H220 V22 H300';

const HEADLINE = 'text-4xl font-light leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl';
const SUB = 'Consistency can sound heavy. Building a habit is simpler: one small action, repeated every day, until it sticks.';

function SolutionContent({ p }: { p: MotionValue<number> }) {
  // Each message arrives together with its own graph, then the last sentence is read slowly.
  const label = useTransform(p, [0, 0.04], [0, 1]);
  const line1In = useTransform(p, [0.04, 0.06], [0, 1]);
  const line1Dim = useTransform(p, [0.3, 0.36], [1, 0.35]);
  const line1Opacity = useTransform([line1In, line1Dim], ([a, b]: number[]) => a * b);
  const spikes = useTransform(p, [0.05, 0.24], [0, 1]);
  const spikesFade = useTransform(p, [0.3, 0.36], [1, 0.25]);
  const graphIn = useTransform(p, [0.05, 0.07], [0, 1]);
  const stairs = useTransform(p, [0.37, 0.56], [0, 1]);
  const subIn = useTransform(p, [0.58, 0.6], [0, 1]);
  const motivationLabel = useTransform(p, [0.3, 0.36], [1, 0.4]);
  const habitsLabel = useTransform(p, [0.37, 0.43], [0.4, 1]);

  return (
    <>
      <motion.div style={{ opacity: label }}>
        <BeatLabel>The solution</BeatLabel>
      </motion.div>

      <div className="mt-4 max-w-3xl text-balance">
        <motion.h2 style={{ opacity: line1Opacity }} className={HEADLINE}>
          <ScrubWords p={p} text="Motivation is overrated." from={0.05} to={0.16} mode="wipe" />
        </motion.h2>
        <h2 className={`mt-1 font-semibold text-emerald-700 dark:text-emerald-400 ${HEADLINE}`}>
          <ScrubWords p={p} text="Habits do the job." from={0.37} to={0.48} mode="rise" />
        </h2>
      </div>

      <motion.div style={{ opacity: graphIn }} className="mt-6 w-full max-w-sm sm:max-w-md">
        <svg
          viewBox="0 0 300 130"
          className="mx-auto h-auto max-h-[22svh] w-full"
          role="img"
          aria-label="A spiky motivation line fades while a steady staircase of habits keeps climbing"
          fill="none"
        >
          <motion.path
            d={SPIKES}
            stroke="#a1a1aa"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            style={{ pathLength: spikes, opacity: spikesFade }}
          />
          <motion.path
            d={STAIRS}
            stroke="#10b981"
            strokeWidth="4"
            strokeLinejoin="round"
            strokeLinecap="round"
            style={{ pathLength: stairs }}
          />
        </svg>
        <div className="mt-2 flex justify-center gap-6 font-mono text-xs uppercase tracking-widest">
          <motion.span style={{ opacity: motivationLabel }} className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
            <span className="h-0.5 w-5 bg-zinc-400" />
            Motivation
          </motion.span>
          <motion.span style={{ opacity: habitsLabel }} className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <span className="h-1 w-5 rounded bg-emerald-500" />
            Habits
          </motion.span>
        </div>
      </motion.div>

      <motion.div style={{ opacity: subIn }} className="mt-5 max-w-xl">
        <ReadAlong
          p={p}
          text={SUB}
          from={0.6}
          to={0.97}
          variant="marker"
          className="text-sm leading-relaxed sm:text-lg"
        />
      </motion.div>
    </>
  );
}

export default function SolutionBeat() {
  return <ScrollStage heightVh={520}>{(p) => <SolutionContent p={p} />}</ScrollStage>;
}
