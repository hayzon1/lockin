import { motion, useMotionValue, useTransform } from 'framer-motion';
import type { MotionValue } from 'framer-motion';
import type { ReactNode } from 'react';
import ReadAlong from './ReadAlong';
import { LABEL_END, SUB, TITLE, visualStart } from './timeline';

/** How the words of a title arrive as you scroll. */
export type RevealMode = 'fly' | 'rise' | 'blur' | 'light' | 'pop' | 'wipe' | 'fade';

function useProgress(p?: MotionValue<number>) {
  const fallback = useMotionValue(1);
  return p ?? fallback;
}

interface WordFxProps {
  p?: MotionValue<number>;
  mode: RevealMode;
  i: number;
  start: number;
  len: number;
  children: string;
}

function WordFx({ p, mode, i, start, len, children }: WordFxProps) {
  const progress = useProgress(p);
  const t = useTransform(progress, [start, start + len], [0, 1]);

  const dx = (i % 2 === 0 ? -1 : 1) * (160 + ((i * 53) % 180));
  const dy = (i % 3 === 0 ? -1 : 1) * (90 + ((i * 37) % 120));
  const rot = (i % 2 === 0 ? -1 : 1) * (8 + ((i * 7) % 14));

  const flyX = useTransform(t, [0, 1], [dx, 0]);
  const flyY = useTransform(t, [0, 1], [dy, 0]);
  const flyRotate = useTransform(t, [0, 1], [rot, 0]);
  const flyOpacity = useTransform(t, [0, 0.3, 1], [0, 1, 1]);
  const riseY = useTransform(t, [0, 1], ['115%', '0%']);
  const blurFilter = useTransform(t, [0, 1], ['blur(14px)', 'blur(0px)']);
  const blurY = useTransform(t, [0, 1], [14, 0]);
  const fadeY = useTransform(t, [0, 1], [14, 0]);
  const lightOpacity = useTransform(t, [0, 1], [0.15, 1]);
  const popScale = useTransform(t, [0, 0.7, 1], [0.5, 1.12, 1]);
  const popY = useTransform(t, [0, 1], [24, 0]);
  const wipeClip = useTransform(t, [0, 1], ['inset(0 100% 0 0)', 'inset(0 0% 0 0)']);
  const wipeX = useTransform(t, [0, 1], [-14, 0]);
  const opacity = useTransform(t, [0, 1], [0, 1]);

  switch (mode) {
    case 'fly':
      return (
        <motion.span className="inline-block" style={{ x: flyX, y: flyY, rotate: flyRotate, opacity: flyOpacity }}>
          {children}
        </motion.span>
      );
    case 'rise':
      return (
        <span className="inline-block overflow-hidden py-[0.1em] align-bottom">
          <motion.span className="inline-block" style={{ y: riseY }}>
            {children}
          </motion.span>
        </span>
      );
    case 'blur':
      return (
        <motion.span className="inline-block" style={{ filter: blurFilter, y: blurY, opacity }}>
          {children}
        </motion.span>
      );
    case 'light':
      return (
        <motion.span className="inline-block" style={{ opacity: lightOpacity }}>
          {children}
        </motion.span>
      );
    case 'pop':
      return (
        <motion.span className="inline-block" style={{ scale: popScale, y: popY, opacity }}>
          {children}
        </motion.span>
      );
    case 'wipe':
      return (
        <motion.span className="inline-block" style={{ clipPath: wipeClip, x: wipeX }}>
          {children}
        </motion.span>
      );
    default:
      return (
        <motion.span className="inline-block" style={{ y: fadeY, opacity }}>
          {children}
        </motion.span>
      );
  }
}

/** Words that arrive one after another between two scroll positions. */
export function ScrubWords({
  p,
  text,
  from,
  to,
  mode,
}: {
  p: MotionValue<number>;
  text: string;
  from: number;
  to: number;
  mode: RevealMode;
}) {
  const words = text.split(' ');
  const len = (to - from) * 0.45;
  return (
    <>
      {words.map((w, i) => {
        const start = from + (to - from - len) * (i / Math.max(1, words.length - 1));
        return (
          <span key={i}>
            <WordFx p={p} mode={mode} i={i} start={start} len={len}>
              {w}
            </WordFx>{' '}
          </span>
        );
      })}
    </>
  );
}

/** The bold label above each title, such as THE PROBLEM. */
export function BeatLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-3 font-mono text-sm font-bold uppercase tracking-[0.25em] text-emerald-700 dark:text-emerald-400 sm:text-base">
      <span aria-hidden className="h-0.5 w-6 rounded bg-emerald-500 sm:w-10" />
      {children}
      <span aria-hidden className="h-0.5 w-6 rounded bg-emerald-500 sm:w-10" />
    </div>
  );
}

function Fade({ p, from, to, children }: { p?: MotionValue<number>; from: number; to: number; children: ReactNode }) {
  const progress = useProgress(p);
  const opacity = useTransform(progress, [from, to], [0, 1]);
  return <motion.div style={{ opacity }}>{children}</motion.div>;
}

/** Wraps the graphic of a beat so it only appears after the text has been read. */
export function Visual({
  p,
  hasSub = false,
  from,
  className,
  children,
}: {
  p: MotionValue<number>;
  hasSub?: boolean;
  /** Start the graphic at this progress, together with the words, instead of after them. */
  from?: number;
  className?: string;
  children: ReactNode;
}) {
  const start = visualStart(hasSub);
  const range: [number, number] = from !== undefined ? [from, from + 0.03] : [start - 0.03, start];
  const opacity = useTransform(p, range, [0, 1]);
  return (
    <motion.div style={{ opacity }} className={className}>
      {children}
    </motion.div>
  );
}

interface BeatProps {
  label: string;
  title: string;
  sub?: string;
  /** Scroll progress. Without it the text just shows in its final state. */
  p?: MotionValue<number>;
  size?: 'lg' | 'xl';
  reveal?: RevealMode;
  /** How the sub line guides the eye. Needs `p`. */
  subReveal?: 'fade' | 'marker' | 'underline';
  /** Scroll range the sub line is read over. A wider range feels slower. */
  subRange?: [number, number];
}

/** The text block of a beat. Label first, then the title, then the sub line, one after the other. */
export default function Beat({ label, title, sub, p, size = 'lg', reveal = 'fade', subReveal = 'fade', subRange = SUB }: BeatProps) {
  const titleSize =
    size === 'xl'
      ? 'text-4xl sm:text-6xl lg:text-7xl leading-[1.05]'
      : 'text-3xl sm:text-5xl lg:text-6xl leading-[1.1]';

  return (
    <div className={size === 'xl' ? 'max-w-3xl' : 'max-w-2xl'}>
      <Fade p={p} from={0} to={LABEL_END}>
        <BeatLabel>{label}</BeatLabel>
      </Fade>
      <h2 className={`mt-4 text-balance font-light tracking-tight ${titleSize}`}>
        {p ? <ScrubWords p={p} text={title} from={TITLE[0]} to={TITLE[1]} mode={reveal} /> : title}
      </h2>
      {sub && (
        <div className="mt-4">
          <Fade p={p} from={subRange[0] - 0.02} to={subRange[0] + 0.02}>
            {p && subReveal !== 'fade' ? (
              <ReadAlong
                p={p}
                text={sub}
                from={subRange[0]}
                to={subRange[1]}
                variant={subReveal}
                emphasis={['LOCKIN']}
                className="mx-auto max-w-xl text-sm leading-relaxed sm:text-lg"
              />
            ) : (
              <p className="mx-auto max-w-xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-lg">{sub}</p>
            )}
          </Fade>
        </div>
      )}
    </div>
  );
}
