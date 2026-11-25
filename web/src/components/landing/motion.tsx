import { motion, useReducedMotion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import type { ReactNode } from 'react';

export const viewport = { once: true, amount: 0.4 } as const;

/**
 * Props for a scroll-triggered container that uses variants.
 * With reduced motion the container starts in its final state, so nothing animates.
 */
export function useReveal() {
  const reduce = useReducedMotion();
  return {
    initial: reduce ? 'visible' : 'hidden',
    whileInView: 'visible',
    viewport,
  } as const;
}

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reveal = useReveal();
  const variants: Variants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut', delay } },
  };
  return (
    <motion.div className={className} variants={variants} {...reveal}>
      {children}
    </motion.div>
  );
}
