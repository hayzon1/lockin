import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronDown, ChevronUp, ExternalLink, GraduationCap, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import * as api from '../../services/api';
import type { LearningLesson } from '../../types';
import { LESSON_TYPE, hostOf, safeUrl } from './lessonUi';

const LEVELS = [
  { id: 'BEGINNER', label: 'Brand new' },
  { id: 'SOME_EXPERIENCE', label: 'Some experience' },
  { id: 'INTERMEDIATE', label: 'Intermediate' },
];
const STYLES = [
  { id: 'READING', label: 'Reading' },
  { id: 'VIDEO', label: 'Videos' },
  { id: 'PRACTICE', label: 'Practice' },
  { id: 'MIX', label: 'A mix' },
];
const MINUTES = [15, 30, 45, 60, 90, 120];
const LENGTHS = [7, 14, 21, 30, 60, 90];

const chip = (active: boolean) =>
  `px-3 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
    active
      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
      : 'border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
  }`;

interface Props {
  goalId: string;
  goalTitle: string;
  /** Length of the active tracking period, used as the default plan length. */
  periodDays?: number;
  /** Open the intake straight away, for a goal that was just created. */
  startOpen?: boolean;
  /** Suggested habits to start tracking together with the plan. Empty when they are already added. */
  habitIdsToAdopt?: string[];
  hasActivePeriod?: boolean;
}

export default function LearningPlanPanel({
  goalId,
  goalTitle,
  periodDays,
  startOpen = false,
  habitIdsToAdopt = [],
  hasActivePeriod = false,
}: Props) {
  const queryClient = useQueryClient();
  const [intakeOpen, setIntakeOpen] = useState(startOpen);
  const [level, setLevel] = useState('BEGINNER');
  const [style, setStyle] = useState('MIX');
  const [minutes, setMinutes] = useState(30);
  const [days, setDays] = useState(periodDays && LENGTHS.includes(periodDays) ? periodDays : 30);
  const [showAll, setShowAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const { data: plan, isLoading } = useQuery({
    queryKey: ['learningPlan', goalId],
    queryFn: () => api.getLearningPlan(goalId),
  });

  const refreshToday = () => queryClient.invalidateQueries({ queryKey: ['learningToday'] });

  const createMutation = useMutation({
    mutationFn: async () => {
      const created = await api.createLearningPlan(goalId, { level, minutesPerDay: minutes, learningStyle: style, days });
      // One step: the same click also starts tracking, so there is no second form to fill in.
      let started: string | null = null;
      if (habitIdsToAdopt.length > 0) {
        try {
          const res = await api.startGoalTracking(goalId, habitIdsToAdopt, hasActivePeriod, days);
          started = `Tracking started in "${res.periodName}". Your daily habits are on the Dashboard.`;
        } catch (err) {
          started = `Your plan is ready, but tracking did not start: ${err instanceof Error ? err.message : 'unknown error'}`;
        }
      }
      return { created, started };
    },
    onSuccess: ({ created, started }) => {
      queryClient.setQueryData(['learningPlan', goalId], created);
      refreshToday();
      for (const key of ['goals', 'activePeriod', 'periods', 'dailyChecklist']) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
      setNote(started);
      setIntakeOpen(false);
      setError(null);
    },
    onError: (err: unknown) => setError(err instanceof Error ? err.message : 'Could not build the plan'),
  });

  const toggleMutation = useMutation({
    mutationFn: (lessonId: string) => api.toggleLearningLesson(goalId, lessonId),
    onSuccess: (updated) => {
      queryClient.setQueryData(['learningPlan', goalId], updated);
      refreshToday();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteLearningPlan(goalId),
    onSuccess: () => {
      queryClient.setQueryData(['learningPlan', goalId], null);
      refreshToday();
    },
  });

  if (isLoading) return null;

  const wrapper = 'rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/40 p-4 sm:p-5';

  // ------------------------------------------------------------- intake
  if (intakeOpen || !plan) {
    if (!intakeOpen) {
      return (
        <div className={`${wrapper} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
          <div className="flex items-start gap-3">
            <span className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
              <GraduationCap className="w-5 h-5" />
            </span>
            <div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Get a day-by-day learning plan</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 max-w-md">
                The AI searches the web for the best free lessons for this goal and gives you one lesson, with a link,
                for every day.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIntakeOpen(true)}
            className="shrink-0 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-zinc-950 text-xs font-semibold cursor-pointer"
          >
            Build my plan
          </button>
        </div>
      );
    }

    return (
      <div className={`${wrapper} space-y-5`}>
        <div className="flex items-start gap-3">
          <span className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
            <GraduationCap className="w-5 h-5" />
          </span>
          <div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Tailor your plan for "{goalTitle}"</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Three quick questions, then the AI does the research.</p>
          </div>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Where are you starting from?</legend>
          <div className="flex flex-wrap gap-2">
            {LEVELS.map((l) => (
              <button key={l.id} type="button" onClick={() => setLevel(l.id)} className={chip(level === l.id)} aria-pressed={level === l.id}>
                {l.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-xs font-medium text-zinc-700 dark:text-zinc-300">How do you learn best?</legend>
          <div className="flex flex-wrap gap-2">
            {STYLES.map((s) => (
              <button key={s.id} type="button" onClick={() => setStyle(s.id)} className={chip(style === s.id)} aria-pressed={style === s.id}>
                {s.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="space-y-2 block">
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Minutes you can give each day</span>
            <select
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-zinc-900 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              {MINUTES.map((m) => (
                <option key={m} value={m}>
                  {m} minutes
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 block">
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Plan length</span>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-zinc-900 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              {LENGTHS.map((d) => (
                <option key={d} value={d}>
                  {d} days{periodDays === d ? ' (your active period)' : ''}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && (
          <p role="alert" className="text-xs text-rose-600 dark:text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={createMutation.isPending}
            onClick={() => {
              setError(null);
              createMutation.mutate();
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 dark:bg-emerald-500 dark:hover:bg-emerald-400 disabled:opacity-60 text-white dark:text-zinc-950 text-xs font-semibold cursor-pointer"
          >
            {createMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {createMutation.isPending
              ? 'Researching the best resources...'
              : habitIdsToAdopt.length > 0
              ? 'Build my plan and start'
              : 'Build my plan'}
          </button>
          {!createMutation.isPending && (
            <button
              type="button"
              onClick={() => setIntakeOpen(false)}
              className="px-3 py-2.5 rounded-xl text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
            >
              {plan ? 'Cancel' : 'Not now'}
            </button>
          )}
        </div>
        {createMutation.isPending && (
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Searching the web and checking every link. This can take up to a minute.
          </p>
        )}
      </div>
    );
  }

  // ------------------------------------------------------------- plan
  const pct = Math.round((plan.completedCount / plan.totalDays) * 100);
  const visible: LearningLesson[] = showAll
    ? plan.lessons
    : plan.lessons.filter((l) => l.dayNumber >= plan.currentDay && l.dayNumber < plan.currentDay + 5);

  return (
    <div className={`${wrapper} space-y-4`}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
            <GraduationCap className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
              Learning plan, day {plan.currentDay} of {plan.totalDays}
            </h4>
            {plan.summary && <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 max-w-xl">{plan.summary}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setIntakeOpen(true)}
            title="Build a new plan"
            className="p-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="sr-only">Build a new plan</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Remove this learning plan?')) deleteMutation.mutate();
            }}
            title="Remove plan"
            className="p-2 rounded-lg text-zinc-500 hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span className="sr-only">Remove plan</span>
          </button>
        </div>
      </div>

      {note && (
        <p role="status" className="text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
          {note}
        </p>
      )}

      <div>
        <div className="flex justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mb-1.5">
          <span>
            {plan.completedCount} of {plan.totalDays} lessons done
          </span>
          <span>{pct}%</span>
        </div>
        <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
          <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <ul className="space-y-2">
        {visible.map((lesson) => {
          const { Icon, label } = LESSON_TYPE[lesson.resourceType] ?? LESSON_TYPE.READ;
          const href = safeUrl(lesson.resourceUrl);
          const isToday = lesson.dayNumber === plan.currentDay;
          return (
            <li
              key={lesson.id}
              className={`flex gap-3 rounded-xl border p-3 ${
                isToday
                  ? 'border-emerald-500/40 bg-emerald-500/5'
                  : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleMutation.mutate(lesson.id)}
                aria-pressed={lesson.completed}
                aria-label={`Mark day ${lesson.dayNumber} ${lesson.completed ? 'not done' : 'done'}`}
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  lesson.completed
                    ? 'bg-emerald-500 border-emerald-500 text-white dark:text-zinc-950'
                    : 'border-zinc-300 dark:border-zinc-700'
                }`}
              >
                {lesson.completed && <Check className="w-4 h-4" />}
              </button>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                  <span className="font-mono font-bold uppercase tracking-wider">
                    Day {lesson.dayNumber}
                    {isToday ? ' (today)' : ''}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Icon className="w-3 h-3" />
                    {label}
                  </span>
                  <span>{lesson.durationMinutes} min</span>
                </div>
                <p className={`text-sm font-semibold ${lesson.completed ? 'text-zinc-400 line-through' : 'text-zinc-900 dark:text-white'}`}>
                  {lesson.title}
                </p>
                {lesson.description && <p className="text-xs text-zinc-600 dark:text-zinc-400">{lesson.description}</p>}
                {href && (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span className="truncate max-w-[16rem]">{lesson.resourceTitle || hostOf(href)}</span>
                    <span className="text-zinc-500 font-normal">{hostOf(href)}</span>
                  </a>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={() => setShowAll((v) => !v)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
      >
        {showAll ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        {showAll ? 'Show fewer days' : `Show all ${plan.totalDays} days`}
      </button>
    </div>
  );
}
