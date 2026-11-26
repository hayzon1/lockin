import { BookOpen, Dumbbell, PlayCircle } from 'lucide-react';
import type { LessonType } from '../../types';

export const LESSON_TYPE: Record<LessonType, { label: string; Icon: typeof BookOpen }> = {
  READ: { label: 'Read', Icon: BookOpen },
  VIDEO: { label: 'Watch', Icon: PlayCircle },
  PRACTICE: { label: 'Practice', Icon: Dumbbell },
};

export function hostOf(url: string | null): string {
  if (!url) return '';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/** Only ever link to http(s) pages. */
export function safeUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : null;
  } catch {
    return null;
  }
}
