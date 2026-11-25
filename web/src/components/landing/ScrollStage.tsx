import { useRef } from 'react';
import type { ReactNode } from 'react';
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring } from 'framer-motion';
import type { MotionValue } from 'framer-motion';

interface ScrollStageProps {
  /** How long the beat lasts, in screen heights (svh). */
  heightVh?: number;
  children: (progress: MotionValue<number>) => ReactNode;
}

/**
 * A tall section with a pinned screen inside it. `progress` goes 0 to 1 as the
 * user scrolls through the section, and back down when they scroll up.
 * With reduced motion the section is one normal screen showing the final state.
 */
export default function ScrollStage({ heightVh = 220, children }: ScrollStageProps) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const smooth = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: 0.4 });
  const still = useMotionValue(1);
  const progress = reduce ? still : smooth;

  return (
    <motion.section ref={ref} className="relative" style={reduce ? undefined : { height: `${heightVh}svh` }}>
      <div
        className={`flex flex-col items-center justify-center overflow-hidden px-6 pt-14 text-center ${
          reduce ? 'min-h-[100svh] py-20' : 'sticky top-0 h-[100svh]'
        }`}
      >
        {children(progress)}
      </div>
    </motion.section>
  );
}
