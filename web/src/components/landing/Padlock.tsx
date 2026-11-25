import { motion, useTransform } from 'framer-motion';
import type { MotionValue } from 'framer-motion';

interface PadlockProps {
  /** 0 = open, 1 = locked. */
  t: MotionValue<number>;
  className?: string;
}

/** A padlock that starts open and closes as `t` goes from 0 to 1. */
export default function Padlock({ t, className = 'h-28 w-24 sm:h-36 sm:w-32' }: PadlockProps) {
  const y = useTransform(t, [0, 0.85], [-18, 0]);
  const rotate = useTransform(t, [0, 0.85], [-32, 0]);
  const bump = useTransform(t, [0.8, 0.9, 1], [0, 3, 0]);
  const color = useTransform(t, [0.78, 0.97], ['#a1a1aa', '#10b981']);
  const glow = useTransform(t, [0.85, 1], [0, 1]);
  const ringScale = useTransform(t, [0.85, 1], [1, 2.2]);
  const ringOpacity = useTransform(t, [0.85, 0.9, 1], [0, 0.5, 0]);

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <motion.div
        aria-hidden
        style={{ opacity: glow }}
        className="absolute h-[110%] w-[130%] rounded-full bg-emerald-500/20 blur-2xl"
      />
      <motion.span
        aria-hidden
        style={{ scale: ringScale, opacity: ringOpacity }}
        className="absolute h-[80%] w-[90%] rounded-full border-2 border-emerald-500"
      />
      <svg viewBox="-14 -22 148 168" className="relative h-full w-full" role="img" aria-label="A padlock that closes as you scroll">
        <motion.g style={{ y, rotate, originX: 0, originY: 1 }}>
          <motion.path
            d="M36 68 V44 a24 24 0 0 1 48 0 V68"
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            style={{ stroke: color }}
          />
        </motion.g>
        <motion.g style={{ y: bump }}>
          <motion.rect x="20" y="64" width="80" height="62" rx="14" style={{ fill: color }} />
          <circle cx="60" cy="90" r="7" style={{ fill: 'hsl(var(--background))' }} />
          <rect x="57" y="94" width="6" height="16" rx="3" style={{ fill: 'hsl(var(--background))' }} />
        </motion.g>
      </svg>
    </div>
  );
}
