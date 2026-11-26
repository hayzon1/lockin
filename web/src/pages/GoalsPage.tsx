import { useState, FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/api';
import { LongTermGoal } from '../types';
import LearningPlanPanel from '../components/learning/LearningPlanPanel';
import {
  Compass,
  Plus,
  Sparkles,
  CheckCircle2,
  Circle,
  Zap,
  Link2,
  Calendar,
  RefreshCw,
  Trash2,
  ArrowRight,
  Flag,
  Bot,
  Cpu,
  Check,
  X,
  Trophy,
} from 'lucide-react';

interface GoalsPageProps {
  onNavigateToDashboard: () => void;
}

const GOAL_CATEGORIES = [
  { id: 'FITNESS', label: 'Fitness' },
  { id: 'CAREER', label: 'Career & Tech' },
  { id: 'FINANCE', label: 'Finance' },
  { id: 'BUSINESS', label: 'Business' },
  { id: 'LEARNING', label: 'Learning' },
  { id: 'READING', label: 'Reading & Writing' },
  { id: 'MINDFULNESS', label: 'Mindfulness & Sleep' },
  { id: 'HEALTH', label: 'Health & Nutrition' },
  { id: 'CREATIVE', label: 'Creative Craft' },
  { id: 'PERSONAL', label: 'Personal Growth' },
];

const QUICK_EXAMPLES = [
  {
    title: 'Run a half marathon without stopping',
    category: 'FITNESS',
    identity: 'I am becoming an endurance runner who never misses two days in a row.',
    months: 6,
  },
  {
    title: 'Become a senior software engineer',
    category: 'CAREER',
    identity: 'I am becoming a craftsperson who practices deep engineering work daily.',
    months: 12,
  },
  {
    title: 'Save $10,000 emergency fund',
    category: 'FINANCE',
    identity: 'I am becoming a financially disciplined person who directs every dollar intentionally.',
    months: 12,
  },
  {
    title: 'Read 24 books this year',
    category: 'READING',
    identity: 'I am becoming a thoughtful reader who feeds my mind every night.',
    months: 12,
  },
];

function addMonthsIso(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
}

export default function GoalsPage({ onNavigateToDashboard }: GoalsPageProps) {
  const queryClient = useQueryClient();

  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('PERSONAL');
  const [description, setDescription] = useState('');
  const [identityStatement, setIdentityStatement] = useState('');
  const [targetDate, setTargetDate] = useState(addMonthsIso(6));
  const [formError, setFormError] = useState<string | null>(null);

  // Per-goal interactive state
  const [selectedHabitsByGoal, setSelectedHabitsByGoal] = useState<Record<string, string[]>>({});
  const [adoptDurationByGoal, setAdoptDurationByGoal] = useState<Record<string, number>>({});
  const [newGoalId, setNewGoalId] = useState<string | null>(null);
  const [customizingIds, setCustomizingIds] = useState<string[]>([]);
  const [addingMilestoneGoalId, setAddingMilestoneGoalId] = useState<string | null>(null);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: api.getGoals,
  });

  const { data: coachStatus } = useQuery({
    queryKey: ['coachStatus'],
    queryFn: api.getCoachStatus,
  });

  const { data: activePeriod } = useQuery({
    queryKey: ['activePeriod'],
    queryFn: api.getActivePeriod,
  });

  const createGoalMutation = useMutation({
    mutationFn: api.createGoal,
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setShowCreateModal(false);
      resetCreateForm();
      setNewGoalId(created.id);
      // Pre-select all generated habits for easy one-click adoption
      setSelectedHabitsByGoal((prev) => ({
        ...prev,
        [created.id]: created.suggestedHabits.map((h) => h.id),
      }));
      setFeedback({
        type: 'success',
        text: `Generated your Atomic Habits roadmap for "${created.title}"! Select habits below to start tracking.`,
      });
    },
    onError: (err: unknown) => {
      setFormError(err instanceof Error ? err.message : 'Failed to create goal');
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: api.regenerateGoalBlueprint,
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setSelectedHabitsByGoal((prev) => ({
        ...prev,
        [updated.id]: updated.suggestedHabits.map((h) => h.id),
      }));
      setFeedback({ type: 'success', text: 'Refreshed your milestones and Atomic Habits suggestions.' });
    },
    onError: (err: unknown) => {
      setFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Failed to regenerate plan' });
    },
  });

  const toggleMilestoneMutation = useMutation({
    mutationFn: ({ goalId, milestoneId }: { goalId: string; milestoneId: string }) =>
      api.toggleGoalMilestone(goalId, milestoneId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  const addMilestoneMutation = useMutation({
    mutationFn: ({ goalId, title, targetDate }: { goalId: string; title: string; targetDate?: string }) =>
      api.addGoalMilestone(goalId, { title, targetDate: targetDate || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setAddingMilestoneGoalId(null);
      setNewMilestoneTitle('');
      setNewMilestoneDate('');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ goalId, status }: { goalId: string; status: string }) =>
      api.updateGoalStatus(goalId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: api.deleteGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setFeedback({ type: 'success', text: 'Long-term goal removed. Any habits you already adopted remain in your periods.' });
    },
  });

  const adoptHabitsMutation = useMutation({
    mutationFn: ({
      goalId,
      suggestedHabitIds,
      mode,
      presetDays,
      replaceActivePeriod,
    }: {
      goalId: string;
      suggestedHabitIds: string[];
      mode: 'ADD_TO_ACTIVE_PERIOD' | 'START_NEW_PERIOD';
      presetDays?: number;
      replaceActivePeriod?: boolean;
    }) =>
      api.adoptGoalHabits(goalId, {
        suggestedHabitIds,
        mode,
        presetDays,
        replaceActivePeriod,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['activePeriod'] });
      queryClient.invalidateQueries({ queryKey: ['periods'] });
      queryClient.invalidateQueries({ queryKey: ['dailyChecklist'] });
      setFeedback({
        type: 'success',
        text: `Added ${res.addedHabitsCount} atomic ${res.addedHabitsCount === 1 ? 'habit' : 'habits'} to "${res.periodName}"!`,
      });
    },
    onError: (err: unknown) => {
      setFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Could not adopt habits' });
    },
  });

  const resetCreateForm = () => {
    setTitle('');
    setCategory('PERSONAL');
    setDescription('');
    setIdentityStatement('');
    setTargetDate(addMonthsIso(6));
    setFormError(null);
  };

  const openWithExample = (ex: (typeof QUICK_EXAMPLES)[number]) => {
    setTitle(ex.title);
    setCategory(ex.category);
    setIdentityStatement(ex.identity);
    setTargetDate(addMonthsIso(ex.months));
    setDescription('');
    setFormError(null);
    setShowCreateModal(true);
  };

  const handleCreateSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!title.trim()) {
      setFormError('Please enter your long-term goal.');
      return;
    }
    createGoalMutation.mutate({
      title: title.trim(),
      category,
      description: description.trim() || undefined,
      identityStatement: identityStatement.trim() || undefined,
      targetDate,
    });
  };

  const getSelectedIds = (goal: LongTermGoal): string[] => {
    if (selectedHabitsByGoal[goal.id] !== undefined) {
      return selectedHabitsByGoal[goal.id];
    }
    // Default: select all unadopted habits
    return goal.suggestedHabits.filter((h) => !h.adopted).map((h) => h.id);
  };

  const toggleHabitSelection = (goal: LongTermGoal, habitId: string) => {
    const current = getSelectedIds(goal);
    const next = current.includes(habitId)
      ? current.filter((id) => id !== habitId)
      : [...current, habitId];
    setSelectedHabitsByGoal((prev) => ({ ...prev, [goal.id]: next }));
  };

  const handleAdopt = (goal: LongTermGoal, mode: 'ADD_TO_ACTIVE_PERIOD' | 'START_NEW_PERIOD') => {
    const selectedIds = getSelectedIds(goal);
    if (selectedIds.length === 0) {
      setFeedback({ type: 'error', text: 'Select at least one suggested habit first.' });
      return;
    }

    let replaceActivePeriod = false;
    if (mode === 'START_NEW_PERIOD' && activePeriod) {
      const ok = confirm(
        `You already have an active period ("${activePeriod.name}"). Mark it completed and start a new sprint for "${goal.title}"?`
      );
      if (!ok) return;
      replaceActivePeriod = true;
    }

    adoptHabitsMutation.mutate({
      goalId: goal.id,
      suggestedHabitIds: selectedIds,
      mode,
      presetDays: adoptDurationByGoal[goal.id] || 30,
      replaceActivePeriod,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800/80">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2.5">
              <Compass className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              <span>Long-Term Goals</span>
            </h2>
            {coachStatus && (
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                  coachStatus.aiEnabled
                    ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30'
                    : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                }`}
                title={
                  coachStatus.aiEnabled
                    ? 'Connected to Gemini AI with built-in Atomic Habits fallback'
                    : 'Using built-in Atomic Habits engine (add GEMINI_API_KEY anytime for custom AI plans)'
                }
              >
                {coachStatus.aiEnabled ? <Bot className="w-3 h-3" /> : <Cpu className="w-3 h-3" />}
                <span>{coachStatus.aiEnabled ? 'Gemini AI + Atomic Coach' : 'Atomic Habits Coach'}</span>
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Set your long-term vision — LOCKIN maps out short-term milestones and daily atomic habits to get you there.
          </p>
        </div>

        <button
          onClick={() => {
            resetCreateForm();
            setShowCreateModal(true);
          }}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-zinc-950 font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 text-xs transition-all cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Long-Term Goal</span>
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/25 text-rose-600 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{feedback.text}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {feedback.type === 'success' && feedback.text.includes('Added') && (
              <button
                type="button"
                onClick={onNavigateToDashboard}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 dark:bg-emerald-500 text-white dark:text-zinc-950 font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <span>Go to Checklist</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="opacity-70 hover:opacity-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Goals List or Empty State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : goals.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-10 shadow-sm dark:shadow-none">
          <div className="max-w-xl mx-auto text-center">
            <div className="inline-flex p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-600 dark:text-emerald-400 mb-4">
              <Compass className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
              Turn Big Ambitions Into Daily Atomic Habits
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-6">
              Create any custom long-term goal. LOCKIN will break it into short-term milestones, craft your{' '}
              <strong className="text-zinc-700 dark:text-zinc-200">Identity Statement</strong>, and recommend daily
              habits complete with <strong className="text-zinc-700 dark:text-zinc-200">2-Minute Fallbacks</strong> for
              busy days.
            </p>
            <button
              onClick={() => {
                resetCreateForm();
                setShowCreateModal(true);
              }}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-zinc-950 font-semibold px-5 py-2.5 rounded-xl text-xs shadow-lg shadow-emerald-500/20 cursor-pointer mb-8"
            >
              <Sparkles className="w-4 h-4" />
              <span>Create My First Long-Term Goal</span>
            </button>
          </div>

          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 text-center mb-3">
              Or start from an example blueprint
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {QUICK_EXAMPLES.map((ex) => (
                <button
                  key={ex.title}
                  type="button"
                  onClick={() => openWithExample(ex)}
                  className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 hover:border-emerald-500/50 text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      {ex.category}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-emerald-500 transition-colors" />
                  </div>
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{ex.title}</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-1">{ex.identity}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {goals.map((goal) => {
            const selectedIds = getSelectedIds(goal);
            const completedMilestones = goal.milestones.filter((m) => m.completed).length;

            return (
              <div
                key={goal.id}
                className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-sm dark:shadow-none space-y-6"
              >
                {/* Goal Header */}
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800/80">
                  <div className="space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${
                          goal.status === 'COMPLETED'
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                        }`}
                      >
                        {goal.category}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                          goal.aiProvider === 'GEMINI'
                            ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/25'
                            : 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/25'
                        }`}
                      >
                        {goal.aiProvider === 'GEMINI' ? <Bot className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                        <span>{goal.aiProvider === 'GEMINI' ? 'Gemini AI Plan' : 'Atomic Blueprint'}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500">
                        <Calendar className="w-3.5 h-3.5" />
                        Target: {goal.targetDate} ({goal.daysRemaining}d left)
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
                      {goal.title}
                    </h3>

                    {goal.identityStatement && (
                      <div className="inline-flex items-start gap-2 px-3 py-2 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300">
                        <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                        <span>
                          <strong className="font-semibold">Identity Anchor:</strong> {goal.identityStatement}
                        </span>
                      </div>
                    )}

                    {goal.roadmapSummary && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-3xl">
                        {goal.roadmapSummary}
                      </p>
                    )}
                  </div>

                  {/* Right Stats + Actions */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0">
                    <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5">
                      <div className="text-center pr-3 border-r border-zinc-200 dark:border-zinc-800">
                        <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 leading-tight">
                          {goal.progressPercentage}%
                        </div>
                        <div className="text-[10px] text-zinc-500">Milestones</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-extrabold text-zinc-900 dark:text-white leading-tight">
                          {goal.identityVotesCount}
                        </div>
                        <div className="text-[10px] text-zinc-500">Daily Votes</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => regenerateMutation.mutate(goal.id)}
                        disabled={regenerateMutation.isPending}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                        title="Regenerate short-term milestones and habit ideas"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${regenerateMutation.isPending ? 'animate-spin' : ''}`} />
                        <span>Refresh Plan</span>
                      </button>

                      {goal.status !== 'COMPLETED' ? (
                        <button
                          type="button"
                          onClick={() => updateStatusMutation.mutate({ goalId: goal.id, status: 'COMPLETED' })}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 transition-colors cursor-pointer"
                          title="Mark long-term goal achieved"
                        >
                          <Trophy className="w-3.5 h-3.5" />
                          <span>Achieved</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => updateStatusMutation.mutate({ goalId: goal.id, status: 'ACTIVE' })}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 cursor-pointer"
                        >
                          Reopen
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete long-term goal "${goal.title}"?`)) {
                            deleteGoalMutation.mutate(goal.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Delete Goal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-1.5">
                    <span>
                      Short-Term Milestones ({completedMilestones} of {goal.milestones.length} completed)
                    </span>
                    <span>{goal.linkedHabitsCount} active linked habits</span>
                  </div>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${goal.progressPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Two-column body: Short-Term Milestones + Recommended Atomic Habits */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  {/* Left 2 Cols: Short-Term Milestones */}
                  <div className="lg:col-span-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                        <Flag className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Short-Term Milestones</span>
                      </h4>
                      <button
                        type="button"
                        onClick={() =>
                          setAddingMilestoneGoalId(addingMilestoneGoalId === goal.id ? null : goal.id)
                        }
                        className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        + Add Step
                      </button>
                    </div>

                    <div className="space-y-2">
                      {goal.milestones.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() =>
                            toggleMilestoneMutation.mutate({ goalId: goal.id, milestoneId: m.id })
                          }
                          className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                            m.completed
                              ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-500/30'
                              : 'bg-zinc-50 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                          }`}
                        >
                          {m.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          ) : (
                            <Circle className="w-4 h-4 text-zinc-400 dark:text-zinc-600 shrink-0 mt-0.5" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`text-xs font-semibold ${
                                  m.completed
                                    ? 'line-through text-zinc-400'
                                    : 'text-zinc-900 dark:text-zinc-100'
                                }`}
                              >
                                {m.title}
                              </span>
                            </div>
                            {m.description && (
                              <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
                                {m.description}
                              </p>
                            )}
                            {m.targetDate && (
                              <span className="inline-block text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 font-mono">
                                Target: {m.targetDate}
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>

                    {addingMilestoneGoalId === goal.id && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!newMilestoneTitle.trim()) return;
                          addMilestoneMutation.mutate({
                            goalId: goal.id,
                            title: newMilestoneTitle.trim(),
                            targetDate: newMilestoneDate || undefined,
                          });
                        }}
                        className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 space-y-2"
                      >
                        <input
                          type="text"
                          required
                          placeholder="Milestone title (e.g. Run 5K continuously)"
                          value={newMilestoneTitle}
                          onChange={(e) => setNewMilestoneTitle(e.target.value)}
                          className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <div className="flex gap-2">
                          <input
                            type="date"
                            value={newMilestoneDate}
                            onChange={(e) => setNewMilestoneDate(e.target.value)}
                            className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                          <button
                            type="submit"
                            disabled={addMilestoneMutation.isPending}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 dark:bg-emerald-500 text-white dark:text-zinc-950 text-xs font-semibold cursor-pointer"
                          >
                            Add
                          </button>
                        </div>
                      </form>
                    )}
                  </div>

                  {/* Right 3 Cols: Recommended Daily Atomic Habits */}
                  <div className="lg:col-span-3 space-y-3">
                    {!customizingIds.includes(goal.id) ? (
                      <>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                            <span>Your daily habits</span>
                          </h4>
                          <button
                            type="button"
                            onClick={() => setCustomizingIds((prev) => [...prev, goal.id])}
                            className="text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                          >
                            Customize habits
                          </button>
                        </div>
                        {goal.suggestedHabits.some((h) => h.adopted) ? (
                          <ul className="flex flex-wrap gap-2">
                            {goal.suggestedHabits
                              .filter((h) => h.adopted)
                              .map((h) => (
                                <li
                                  key={h.id}
                                  className="px-3 py-1.5 rounded-full text-xs border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                                >
                                  {h.name}
                                </li>
                              ))}
                          </ul>
                        ) : (
                          <div className="space-y-3">
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              Three daily habits are picked for you. Press start to begin tracking them for 30 days.
                            </p>
                            <button
                              type="button"
                              disabled={adoptHabitsMutation.isPending}
                              onClick={() => {
                                const ids = goal.suggestedHabits.slice(0, 3).map((h) => h.id);
                                adoptHabitsMutation.mutate({
                                  goalId: goal.id,
                                  suggestedHabitIds: ids,
                                  mode: activePeriod ? 'ADD_TO_ACTIVE_PERIOD' : 'START_NEW_PERIOD',
                                  presetDays: 30,
                                });
                              }}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 dark:bg-emerald-500 dark:hover:bg-emerald-400 disabled:opacity-50 text-white dark:text-zinc-950 text-xs font-semibold shadow-sm cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              {adoptHabitsMutation.isPending ? 'Starting...' : 'Start tracking'}
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                    <button
                      type="button"
                      onClick={() => setCustomizingIds((prev) => prev.filter((id) => id !== goal.id))}
                      className="text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                    >
                      Hide customization
                    </button>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                        <span>Recommended Daily Atomic Habits</span>
                      </h4>
                      <span className="text-[11px] text-zinc-500">
                        {selectedIds.length} selected
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                      <Zap className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                      <span>
                        <strong>2-Minute Fallback:</strong> On tired or chaotic days, do just the 2-minute version to keep
                        your streak alive and never miss twice.
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {goal.suggestedHabits.map((sh) => {
                        const isChecked = selectedIds.includes(sh.id);
                        return (
                          <div
                            key={sh.id}
                            onClick={() => toggleHabitSelection(goal, sh.id)}
                            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                              isChecked
                                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-400/70 dark:border-emerald-500/40'
                                : 'bg-zinc-50 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-4 h-4 mt-0.5 rounded flex items-center justify-center border shrink-0 transition-colors ${
                                  isChecked
                                    ? 'bg-emerald-600 dark:bg-emerald-500 border-emerald-600 dark:border-emerald-500 text-white dark:text-zinc-950'
                                    : 'border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900'
                                }`}
                              >
                                {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>

                              <div className="min-w-0 flex-1 space-y-1.5">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                    {sh.name}
                                  </span>
                                  {sh.category && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                      {sh.category}
                                    </span>
                                  )}
                                  {sh.adopted && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 font-semibold">
                                      In Your Plan
                                    </span>
                                  )}
                                </div>

                                {sh.whyItWorks && (
                                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{sh.whyItWorks}</p>
                                )}

                                <div className="flex flex-col gap-1 pt-1">
                                  {sh.twoMinuteVersion && (
                                    <div className="inline-flex items-start gap-1.5 text-[11px] text-amber-700 dark:text-amber-300">
                                      <Zap className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
                                      <span>
                                        <strong>2-min fallback:</strong> {sh.twoMinuteVersion}
                                      </span>
                                    </div>
                                  )}
                                  {sh.habitStackCue && (
                                    <div className="inline-flex items-start gap-1.5 text-[11px] text-sky-700 dark:text-sky-300">
                                      <Link2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-sky-500" />
                                      <span>
                                        <strong>Habit stack:</strong> {sh.habitStackCue}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* One-Click Adopt Controls */}
                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-zinc-200 dark:border-zinc-800/80">
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <span>Sprint length:</span>
                        <select
                          value={adoptDurationByGoal[goal.id] || 30}
                          onChange={(e) =>
                            setAdoptDurationByGoal((prev) => ({
                              ...prev,
                              [goal.id]: Number(e.target.value),
                            }))
                          }
                          className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-800 dark:text-zinc-200 cursor-pointer"
                        >
                          <option value={14}>14 Days</option>
                          <option value={21}>21 Days</option>
                          <option value={30}>30 Days</option>
                          <option value={60}>60 Days</option>
                          <option value={90}>90 Days</option>
                        </select>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {activePeriod && (
                          <button
                            type="button"
                            disabled={adoptHabitsMutation.isPending || selectedIds.length === 0}
                            onClick={() => handleAdopt(goal, 'ADD_TO_ACTIVE_PERIOD')}
                            className="px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 disabled:opacity-50 text-zinc-800 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Add to Active Period
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={adoptHabitsMutation.isPending || selectedIds.length === 0}
                          onClick={() => handleAdopt(goal, 'START_NEW_PERIOD')}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 disabled:opacity-50 text-white dark:text-zinc-950 text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>
                            {adoptHabitsMutation.isPending
                              ? 'Adding...'
                              : `Start ${adoptDurationByGoal[goal.id] || 30}-Day Period`}
                          </span>
                        </button>
                      </div>
                    </div>
                      </>
                    )}
                  </div>
                </div>

                <LearningPlanPanel
                  goalId={goal.id}
                  goalTitle={goal.title}
                  periodDays={activePeriod?.totalDays}
                  startOpen={goal.id === newGoalId}
                  habitIdsToAdopt={
                    goal.suggestedHabits.some((h) => h.adopted)
                      ? []
                      : goal.suggestedHabits.slice(0, 3).map((h) => h.id)
                  }
                  hasActivePeriod={!!activePeriod}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Create Long-Term Goal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-zinc-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <Compass className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">Create Long-Term Goal</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs rounded-xl">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  What is your long-term goal? *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Run a half marathon, Launch my SaaS, Save $10,000..."
                  className="w-full bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    {GOAL_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    Target Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Quick Timeframe Pills */}
              <div className="flex flex-wrap gap-2">
                {[
                  { label: '3 Months', months: 3 },
                  { label: '6 Months', months: 6 },
                  { label: '1 Year', months: 12 },
                ].map((tf) => (
                  <button
                    key={tf.months}
                    type="button"
                    onClick={() => setTargetDate(addMonthsIso(tf.months))}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-500/15 hover:text-emerald-700 dark:hover:text-emerald-400 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                  >
                    {tf.label}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Identity Statement <span className="text-zinc-400 normal-case">(Optional — coach will craft one if blank)</span>
                </label>
                <input
                  type="text"
                  value={identityStatement}
                  onChange={(e) => setIdentityStatement(e.target.value)}
                  placeholder="e.g. I am becoming someone who shows up daily for my health"
                  className="w-full bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Starting Point / Context <span className="text-zinc-400 normal-case">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Where are you starting from? Any constraints like a 9-5 job?"
                  className="w-full bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-medium rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createGoalMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-zinc-950 text-xs font-semibold rounded-xl shadow cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{createGoalMutation.isPending ? 'Generating Blueprint...' : 'Generate Atomic Plan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
