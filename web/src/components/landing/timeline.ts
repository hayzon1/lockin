import { useTransform } from 'framer-motion';
import type { MotionValue } from 'framer-motion';

/**
 * The order things appear in, as scroll progress through a beat (0 to 1):
 * label, then title, then the explanation, then the graphic.
 */
export const LABEL_END = 0.05;
export const TITLE: [number, number] = [0.06, 0.22];
export const SUB: [number, number] = [0.24, 0.42];

const VISUAL_WITH_SUB = 0.44;
const VISUAL_NO_SUB = 0.26;

export const visualStart = (hasSub: boolean) => (hasSub ? VISUAL_WITH_SUB : VISUAL_NO_SUB);

/** Progress for the graphic of a beat: stays 0 while the text is being read, then runs 0 to 1. */
export function useVisualProgress(p: MotionValue<number>, hasSub: boolean) {
  return useTransform(p, [visualStart(hasSub), 1], [0, 1]);
}
