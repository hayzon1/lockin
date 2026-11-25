import { useState, FormEvent, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/api';
import { TaskPriority, TodoTask } from '../types';
import {
  CheckSquare,
  CheckCircle2,
  Circle,
  Plus,
  Calendar,
  Clock,
  ArrowRight,
  Trash2,
  Pencil,
  X,
  AlertCircle,
  Compass,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

type PlannerView = 'today' | 'tomorrow' | 'upcoming' | 'custom';

function toLocalIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDaysIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toLocalIso(d);
}

function formatFriendlyDate(iso: string, todayIso: string, tomorrowIso: string): string {
  if (iso === todayIso) return 'Today';
  if (iso === tomorrowIso) return 'Tomorrow';
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  HIGH: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25',
  MEDIUM: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25',
  LOW: 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700',
};

export default function TasksPage() {
  const queryClient = useQueryClient();
  const todayIso = toLocalIso(new Date());
  const tomorrowIso = addDaysIso(1);

  const [view, setView] = useState<PlannerView>('today');
  const [customDate, setCustomDate] = useState(addDaysIso(2));

  // New task form
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [scheduledTime, setScheduledTime] = useState('');
  const [goalId, setGoalId] = useState('');
  const [formDateOverride, setFormDateOverride] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Edit modal state
  const [editingTask, setEditingTask] = useState<TodoTask | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editPriority, setEditPriority] = useState<TaskPriority>('MEDIUM');
  const [editGoalId, setEditGoalId] = useState('');

  const { data: allTodos = [], isLoading } = useQuery({
    queryKey: ['todos'],
    queryFn: () => api.getTodos({ view: 'all' }),
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['goals'],
    queryFn: api.getGoals,
  });

  const invalidateTodos = () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] });
  };

  const createMutation = useMutation({
    mutationFn: api.createTodo,
    onSuccess: () => {
      invalidateTodos();
      setTitle('');
      setNotes('');
      setScheduledTime('');
      setPriority('MEDIUM');
      setGoalId('');
      setFormDateOverride(null);
      setShowDetails(false);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: api.toggleTodo,
    onSuccess: invalidateTodos,
  });

  const rescheduleMutation = useMutation({
    mutationFn: ({ id, dueDate }: { id: string; dueDate: string }) => api.rescheduleTodo(id, dueDate),
    onSuccess: invalidateTodos,
  });

  const carryOverMutation = useMutation({
    mutationFn: () => api.carryOverOverdueTodos(todayIso),
    onSuccess: invalidateTodos,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Parameters<typeof api.updateTodo>[1];
    }) => api.updateTodo(id, payload),
    onSuccess: () => {
      invalidateTodos();
      setEditingTask(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteTodo,
    onSuccess: invalidateTodos,
  });

  const overdueTasks = useMemo(
    () => allTodos.filter((t) => !t.completed && t.dueDate < todayIso),
    [allTodos, todayIso]
  );

  const todayTasks = useMemo(
    () => allTodos.filter((t) => t.dueDate === todayIso),
    [allTodos, todayIso]
  );

  const tomorrowTasks = useMemo(
    () => allTodos.filter((t) => t.dueDate === tomorrowIso),
    [allTodos, tomorrowIso]
  );

  const customDateTasks = useMemo(
    () => allTodos.filter((t) => t.dueDate === customDate),
    [allTodos, customDate]
  );

  const upcomingGroups = useMemo(() => {
    const upcoming = allTodos.filter((t) => t.dueDate >= todayIso);
    const map = new Map<string, TodoTask[]>();
    for (const t of upcoming) {
      const list = map.get(t.dueDate) || [];
      list.push(t);
      map.set(t.dueDate, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [allTodos, todayIso]);

  const effectiveAddDate =
    formDateOverride ||
    (view === 'tomorrow' ? tomorrowIso : view === 'custom' ? customDate : todayIso);

  const handleCreateSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    createMutation.mutate({
      title: title.trim(),
      notes: notes.trim() || undefined,
      dueDate: effectiveAddDate,
      scheduledTime: scheduledTime || undefined,
      priority,
      goalId: goalId || undefined,
    });
  };

  const openEditModal = (task: TodoTask) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditNotes(task.notes || '');
    setEditDueDate(task.dueDate);
    setEditTime(task.scheduledTime || '');
    setEditPriority(task.priority);
    setEditGoalId(task.goalId || '');
  };

  const handleEditSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editTitle.trim()) return;
    updateMutation.mutate({
      id: editingTask.id,
      payload: {
        title: editTitle.trim(),
        notes: editNotes.trim(),
        dueDate: editDueDate,
        scheduledTime: editTime,
        priority: editPriority,
        goalId: editGoalId || undefined,
        clearGoal: !editGoalId && !!editingTask.goalId,
      },
    });
  };

  const activeDayList =
    view === 'today' ? todayTasks : view === 'tomorrow' ? tomorrowTasks : customDateTasks;
  const activeDoneCount = activeDayList.filter((t) => t.completed).length;
  const activePct =
    activeDayList.length > 0 ? Math.round((activeDoneCount / activeDayList.length) * 100) : 0;

  const renderTaskRow = (task: TodoTask) => {
    const isToday = task.dueDate === todayIso;
    const isPast = task.dueDate < todayIso;

    return (
      <div
        key={task.id}
        className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
          task.completed
            ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300/70 dark:border-emerald-500/25'
            : 'bg-zinc-50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
        }`}
      >
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <button
            type="button"
            onClick={() => toggleMutation.mutate(task.id)}
            className="mt-0.5 shrink-0 cursor-pointer"
            title={task.completed ? 'Mark incomplete' : 'Mark complete'}
          >
            {task.completed ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Circle className="w-5 h-5 text-zinc-400 dark:text-zinc-600 hover:text-emerald-500" />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={`text-sm font-medium ${
                  task.completed
                    ? 'line-through text-zinc-400'
                    : 'text-zinc-900 dark:text-zinc-100'
                }`}
              >
                {task.title}
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                  PRIORITY_STYLES[task.priority]
                }`}
              >
                {task.priority}
              </span>
              {task.scheduledTime && (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20 font-mono">
                  <Clock className="w-2.5 h-2.5" />
                  {task.scheduledTime}
                </span>
              )}
              {task.goalTitle && (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  <Compass className="w-2.5 h-2.5" />
                  <span className="truncate max-w-[140px]">{task.goalTitle}</span>
                </span>
              )}
            </div>

            {task.notes && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                {task.notes}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {!task.completed && (isToday || isPast) && (
            <button
              type="button"
              onClick={() =>
                rescheduleMutation.mutate({
                  id: task.id,
                  dueDate: isPast ? todayIso : tomorrowIso,
                })
              }
              className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
              title={isPast ? 'Move to Today' : 'Move to Tomorrow'}
            >
              <span>{isPast ? 'Today' : 'Tomorrow'}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
          {!task.completed && !isToday && !isPast && (
            <button
              type="button"
              onClick={() => rescheduleMutation.mutate({ id: task.id, dueDate: todayIso })}
              className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
              title="Move to Today"
            >
              <span>Do Today</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => openEditModal(task)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Edit task"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => deleteMutation.mutate(task.id)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Delete task"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800/80">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2.5">
            <CheckSquare className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>To-Do & Daily Planner</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Execute today's tasks and plan ahead for tomorrow or any upcoming day.
          </p>
        </div>

        {/* View Switcher */}
        <div className="inline-flex flex-wrap items-center gap-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 p-1 border border-zinc-200 dark:border-zinc-800 self-start sm:self-auto">
          {(
            [
              { id: 'today', label: 'Today', count: todayTasks.filter((t) => !t.completed).length },
              { id: 'tomorrow', label: 'Tomorrow', count: tomorrowTasks.filter((t) => !t.completed).length },
              { id: 'upcoming', label: 'Upcoming', count: allTodos.filter((t) => !t.completed && t.dueDate >= todayIso).length },
              { id: 'custom', label: 'Pick Date', count: null },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setView(tab.id);
                setFormDateOverride(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                view === tab.id
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && tab.count > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Overdue Carry-Over Banner */}
      {overdueTasks.length > 0 && (
        <div className="p-4 rounded-2xl border border-amber-300/80 dark:border-amber-500/30 bg-amber-50/80 dark:bg-amber-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                You have {overdueTasks.length} unfinished {overdueTasks.length === 1 ? 'task' : 'tasks'} from earlier days
              </p>
              <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                Carry them over to today's plan so nothing slips through the cracks.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => carryOverMutation.mutate()}
            disabled={carryOverMutation.isPending}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{carryOverMutation.isPending ? 'Moving...' : 'Move All to Today'}</span>
          </button>
        </div>
      )}

      {/* Custom Date Picker Bar */}
      {view === 'custom' && (
        <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm dark:shadow-none">
          <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Planning for date:</span>
          <input
            type="date"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
            className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <div className="flex flex-wrap gap-1.5 ml-auto">
            {[
              { label: 'In 2 Days', days: 2 },
              { label: 'In 3 Days', days: 3 },
              { label: 'Next Week', days: 7 },
            ].map((q) => (
              <button
                key={q.days}
                type="button"
                onClick={() => setCustomDate(addDaysIso(q.days))}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-500/15 hover:text-emerald-700 dark:hover:text-emerald-400 text-zinc-600 dark:text-zinc-300 cursor-pointer"
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick-Add Task Form */}
      <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm dark:shadow-none">
        <form onSubmit={handleCreateSubmit} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                view === 'tomorrow'
                  ? 'Plan a task for tomorrow (e.g. Finish presentation deck)...'
                  : `Add a task for ${formatFriendlyDate(effectiveAddDate, todayIso, tomorrowIso)}...`
              }
              className="flex-1 bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-300 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 disabled:opacity-50 text-white dark:text-zinc-950 font-semibold text-xs rounded-xl shadow-sm transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{createMutation.isPending ? 'Adding...' : 'Add Task'}</span>
            </button>
          </div>

          {/* Quick Options Row */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Priority selector */}
            <div className="inline-flex items-center gap-1 bg-zinc-100 dark:bg-zinc-950 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
              {(['HIGH', 'MEDIUM', 'LOW'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-colors cursor-pointer ${
                    priority === p
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Quick schedule date chips */}
            <div className="inline-flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <input
                type="date"
                value={effectiveAddDate}
                onChange={(e) => setFormDateOverride(e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1 text-[11px] text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Time input */}
            <div className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1 text-[11px] text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                title="Optional time"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline ml-auto cursor-pointer"
            >
              {showDetails ? 'Hide notes & goal' : '+ Notes / Link Goal'}
            </button>
          </div>

          {showDetails && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-800/80">
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes or details..."
                className="bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <select
                value={goalId}
                onChange={(e) => setGoalId(e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="">Link to a Long-Term Goal (optional)</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </form>
      </div>

      {/* Main Task Display */}
      {isLoading ? (
        <div className="py-16 flex justify-center">
          <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : view === 'upcoming' ? (
        <div className="space-y-5">
          {upcomingGroups.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-10 text-center">
              <Sparkles className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-1">No Upcoming Tasks Planned Yet</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Use the planner above to line up tomorrow's top priorities so you start the day with clarity.
              </p>
            </div>
          ) : (
            upcomingGroups.map(([dateStr, items]) => {
              const done = items.filter((i) => i.completed).length;
              return (
                <div
                  key={dateStr}
                  className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm dark:shadow-none space-y-3"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800/80">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                        {formatFriendlyDate(dateStr, todayIso, tomorrowIso)}
                      </h3>
                      <span className="text-[11px] font-mono text-zinc-400">{dateStr}</span>
                    </div>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {done} / {items.length} done
                    </span>
                  </div>
                  <div className="space-y-2">{items.map(renderTaskRow)}</div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-sm dark:shadow-none space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-200 dark:border-zinc-800/80">
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                {view === 'today'
                  ? `Today's Tasks (${todayIso})`
                  : view === 'tomorrow'
                  ? `Tomorrow's Plan (${tomorrowIso})`
                  : `Plan for ${formatFriendlyDate(customDate, todayIso, tomorrowIso)} (${customDate})`}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {view === 'tomorrow'
                  ? 'Decide tonight what matters tomorrow—eliminates morning decision fatigue.'
                  : 'Check off tasks as you finish them or push unfinished items to tomorrow.'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {activeDoneCount} of {activeDayList.length} done
              </div>
              <div className="text-[11px] text-zinc-500">{activePct}% complete</div>
            </div>
          </div>

          {activeDayList.length > 0 && (
            <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${activePct}%` }}
              />
            </div>
          )}

          {activeDayList.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                {view === 'tomorrow'
                  ? 'Nothing planned for tomorrow yet.'
                  : 'Your list is clear for this day.'}
              </p>
              <p className="text-xs text-zinc-500">
                Add your top 1–3 priorities above so you know exactly where to focus.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">{activeDayList.map(renderTaskRow)}</div>
          )}
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/50 dark:bg-zinc-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">Edit Task</h3>
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Time (Optional)
                  </label>
                  <input
                    type="time"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 cursor-pointer"
                  >
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Linked Goal
                  </label>
                  <select
                    value={editGoalId}
                    onChange={(e) => setEditGoalId(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 cursor-pointer"
                  >
                    <option value="">None</option>
                    {goals.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-zinc-950 text-xs font-semibold cursor-pointer"
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
