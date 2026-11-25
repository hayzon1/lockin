import { motion, useTransform } from 'framer-motion';
import type { MotionValue } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

type Variant = 'marker' | 'underline';

interface ReadAlongProps {
  p: MotionValue<number>;
  text: string;
  from: number;
  to: number;
  /** marker: a green highlight sweeps across the words. underline: a line draws under each word. */
  variant: Variant;
  className?: string;
  /** Words that stay emphasised once read. */
  emphasis?: string[];
}

interface ReadWordProps {
  p: MotionValue<number>;
  word: string;
  center: number;
  width: number;
  variant: Variant;
  strong: boolean;
  dark: boolean;
}

function ReadWord({ p, word, center, width, variant, strong, dark }: ReadWordProps) {
  const dim = dark ? '#52525b' : '#a1a1aa';
  const hot = dark ? '#34d399' : '#047857';
  const normal = dark ? '#a1a1aa' : '#52525b';
  const settled = strong ? hot : normal;
  const range = [center - width, center, center + width];

  const color = useTransform(p, range, variant === 'marker' ? [dim, hot, settled] : [dim, settled, settled]);
  const bg = useTransform(p, range, ['rgba(16,185,129,0)', 'rgba(16,185,129,0.25)', 'rgba(16,185,129,0)']);
  const lineScale = useTransform(p, [center - width, center], [0, 1]);
  const lineOpacity = useTransform(p, [center, center + width * 1.5], [1, strong ? 1 : 0]);

  return (
    <motion.span
      className={`relative inline-block rounded px-1 -mx-1 ${strong ? 'font-semibold' : ''}`}
      style={variant === 'marker' ? { color, backgroundColor: bg } : { color }}
    >
      {word}
      {variant === 'underline' && (
        <motion.span
          aria-hidden
          style={{ scaleX: lineScale, opacity: lineOpacity }}
          className="absolute -bottom-0.5 left-1 right-1 h-0.5 origin-left rounded bg-emerald-500"
        />
      )}
    </motion.span>
  );
}

/** A sentence that guides the eye: the reading position moves across the words as you scroll. */
export default function ReadAlong({ p, text, from, to, variant, className, emphasis = [] }: ReadAlongProps) {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === 'dark';
  const words = text.split(' ');
  const width = Math.max(0.03, ((to - from) / words.length) * 2.2);

  return (
    <p className={className}>
      {words.map((w, i) => {
        const center = from + (to - from) * (i / Math.max(1, words.length - 1));
        const strong = emphasis.some((e) => w.startsWith(e));
        return (
          <span key={i}>
            <ReadWord p={p} word={w} center={center} width={width} variant={variant} strong={strong} dark={dark} />{' '}
          </span>
        );
      })}
    </p>
  );
}
