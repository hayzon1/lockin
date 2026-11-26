import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ExternalLink, GraduationCap } from 'lucide-react';
import * as api from '../../services/api';
import { LESSON_TYPE, hostOf, safeUrl } from './lessonUi';

/** Today's lesson for every goal that has a learning plan. Shows nothing when there is none. */
export default function TodaysLessons() {
  const queryClient = useQueryClient();
  const { data: items = [] } = useQuery({ queryKey: ['learningToday'], queryFn: api.getTodayLessons });

  const toggleMutation = useMutation({
    mutationFn: ({ goalId, lessonId }: { goalId: string; lessonId: string }) => api.toggleLearningLesson(goalId, lessonId),
    onSuccess: (plan) => {
      queryClient.setQueryData(['learningPlan', plan.goalId], plan);
      queryClient.invalidateQueries({ queryKey: ['learningToday'] });
    },
  });

  if (items.length === 0) return null;

  return (
    <section
      aria-label="Today's lessons"
      className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-sm dark:shadow-none space-y-4"
    >
      <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
        <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        Today's lesson
      </h3>
      <ul className="space-y-3">
        {items.map((item) => {
          const { lesson } = item;
          const { Icon, label } = LESSON_TYPE[lesson.resourceType] ?? LESSON_TYPE.READ;
          const href = safeUrl(lesson.resourceUrl);
          return (
            <li key={item.goalId} className="flex gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
              <button
                type="button"
                onClick={() => toggleMutation.mutate({ goalId: item.goalId, lessonId: lesson.id })}
                aria-pressed={lesson.completed}
                aria-label={lesson.completed ? 'Mark lesson not done' : 'Mark lesson done'}
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  lesson.completed
                    ? 'bg-emerald-500 border-emerald-500 text-white dark:text-zinc-950'
                    : 'border-zinc-300 dark:border-zinc-600'
                }`}
              >
                {lesson.completed && <Check className="w-4 h-4" />}
              </button>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  {item.goalTitle} / day {item.day} of {item.totalDays}
                </p>
                <p className={`text-sm font-semibold ${lesson.completed ? 'text-zinc-400 line-through' : 'text-zinc-900 dark:text-white'}`}>
                  {lesson.title}
                </p>
                {lesson.description && <p className="text-xs text-zinc-600 dark:text-zinc-400">{lesson.description}</p>}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400 pt-0.5">
                  <span className="inline-flex items-center gap-1">
                    <Icon className="w-3 h-3" />
                    {label}, {lesson.durationMinutes} min
                  </span>
                  {href && (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span className="truncate max-w-[14rem]">{lesson.resourceTitle || hostOf(href)}</span>
                    </a>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
