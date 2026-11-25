import { motion, useTransform } from 'framer-motion';
import type { MotionValue } from 'framer-motion';
import Beat, { Visual } from './Beat';
import ScrollStage from './ScrollStage';

const HEIGHTS = [100, 90, 78, 64, 50, 38, 28, 20, 14, 10];
// Days 1 to 6 appear while the words fly in. Days 7 to 10 are left for after.
const STARTS = [0.07, 0.095, 0.12, 0.145, 0.17, 0.195, 0.26, 0.42, 0.58, 0.74];
const LENS = [0.03, 0.03, 0.03, 0.03, 0.03, 0.03, 0.14, 0.14, 0.14, 0.14];

function Bar({ p, i, h }: { p: MotionValue<number>; i: number; h: number }) {
  const scaleY = useTransform(p, [STARTS[i], STARTS[i] + LENS[i]], [0, 1]);
  return (
    <motion.div
      className="flex-1 origin-bottom rounded-t-md bg-emerald-500"
      style={{ scaleY, height: `${h}%`, opacity: 0.25 + (0.75 * h) / 100 }}
    />
  );
}

function ProblemContent({ p }: { p: MotionValue<number> }) {
  const day = useTransform(p, (x) => `Day ${Math.max(1, STARTS.filter((s) => x >= s).length)}`);

  return (
    <>
      <Beat p={p} reveal="fly" size="xl" label="The problem" title="You start strong, then the week gets loud." />
      <Visual p={p} from={0.06} className="mt-10 w-full max-w-sm sm:max-w-md">
        <div
          role="img"
          aria-label="Bars that shrink day by day, showing motivation fading over ten days"
          className="flex h-32 items-end gap-2 sm:h-40"
        >
          {HEIGHTS.map((h, i) => (
            <Bar key={i} p={p} i={i} h={h} />
          ))}
        </div>
        <motion.p className="mt-3 font-mono text-[11px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
          {day}
        </motion.p>
      </Visual>
    </>
  );
}

export default function ProblemBeat() {
  return <ScrollStage heightVh={340}>{(p) => <ProblemContent p={p} />}</ScrollStage>;
}
