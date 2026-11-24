import { useState, FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/api';
import {
  Target,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function PeriodsPage() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [periodName, setPeriodName] = useState('');
  const [periodDesc, setPeriodDesc] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [presetDays, setPresetDays] = useState<number>(30);
  const [initialHabits, setInitialHabits] = useState(['', '', '']);
  const [error, setError] = useState<string | null>(null);

  const { data: periods, isLoading } = useQuery({
    queryKey: ['periods'],
    queryFn: api.getUserPeriods,
  });

  const createMutation = useMutation({
    mutationFn: api.createPeriod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periods'] });
      queryClient.invalidateQueries({ queryKey: ['activePeriod'] });
      queryClient.invalidateQueries({ queryKey: ['dailyChecklist'] });
      setShowCreateModal(false);
      resetForm();
    },
    onError: (err: unknown) => {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create tracking period');
      }
    },
  });

  const completeMutation = useMutation({
    mutationFn: api.completePeriod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periods'] });
      queryClient.invalidateQueries({ queryKey: ['activePeriod'] });
    },
  });

  const resetForm = () => {
    setPeriodName('');
    setPeriodDesc('');
    setPresetDays(30);
    setInitialHabits(['', '', '']);
    setError(null);
  };

  const presets = [
    { label: '7 Days', days: 7, desc: 'Quick reset' },
    { label: '14 Days', days: 14, desc: 'Sprint' },
    { label: '21 Days', days: 21, desc: 'Habit anchor' },
    { label: '30 Days', days: 30, desc: 'Standard block' },
    { label: '60 Days', days: 60, desc: 'Deep discipline' },
    { label: '90 Days', days: 90, desc: 'Quarterly focus' },
  ];

  const handleHabitChange = (index: number, val: string) => {
    const updated = [...initialHabits];
    updated[index] = val;
    setInitialHabits(updated);
  };

  const handleAddHabitSlot = () => {
    setInitialHabits([...initialHabits, '']);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const validHabits = initialHabits.map((h) => h.trim()).filter((h) => h.length > 0);

    createMutation.mutate({
      name: periodName.trim(),
      description: periodDesc.trim() || undefined,
      startDate,
      presetDays,
      habitNames: validHabits.length > 0 ? validHabits : undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Tracking Periods</h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manage your active and completed focus blocks.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-zinc-950 font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 text-xs transition-all cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Tracking Period</span>
        </button>
      </div>

      {/* Period Cards Grid */}
      {isLoading ? (
        <div className="py-12 text-center text-sm text-zinc-500">Loading periods...</div>
      ) : periods?.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 text-center max-w-md mx-auto shadow-sm dark:shadow-none">
          <Target className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto mb-4" />
          <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-1">No Tracking Periods Yet</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">
            Create your first period to start establishing measurable daily consistency.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-zinc-950 font-semibold rounded-xl text-xs cursor-pointer"
          >
            Create Period
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {periods?.map((period) => {
            const isActive = period.status === 'ACTIVE';
            return (
              <div
                key={period.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isActive
                    ? 'bg-white dark:bg-zinc-900/80 border-emerald-400/60 dark:border-emerald-500/30 shadow-md shadow-emerald-500/5 dark:shadow-lg dark:shadow-emerald-950/20'
                    : 'bg-white dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800/80 text-zinc-700 dark:text-zinc-300 shadow-sm dark:shadow-none'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/50'
                      }`}
                    >
                      {period.status}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {period.totalDays} Days
                    </span>
                  </div>

                  {isActive && (
                    <button
                      onClick={() => completeMutation.mutate(period.id)}
                      disabled={completeMutation.isPending}
                      className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Mark as completed"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Complete Period</span>
                    </button>
                  )}
                </div>

                <h3 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight mb-1">
                  {period.name}
                </h3>
                {period.description && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-3">
                    {period.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 pt-3 border-t border-zinc-200 dark:border-zinc-800/80">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                    {period.startDate} → {period.endDate}
                  </span>
                  <span className="flex items-center gap-1.5 ml-auto">
                    <Clock className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                    {period.habits.length} habits
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Period Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-zinc-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">New Tracking Period</h3>
              </div>
              <button
                onClick={() => { setShowCreateModal(false); resetForm(); }}
                className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Period Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 Discipline, 30-Day Fitness Sprint..."
                  value={periodName}
                  onChange={(e) => setPeriodName(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="What is your primary intent for this period?"
                  value={periodDesc}
                  onChange={(e) => setPeriodDesc(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    Duration
                  </label>
                  <span className="block text-xs text-zinc-500 dark:text-zinc-400 py-2.5 font-medium">
                    {presetDays} Days (Ends on date)
                  </span>
                </div>
              </div>

              {/* Quick Duration Presets */}
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Duration Presets
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {presets.map((p) => (
                    <button
                      key={p.days}
                      type="button"
                      onClick={() => setPresetDays(p.days)}
                      className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                        presetDays === p.days
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                          : 'bg-zinc-50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      <div className="text-xs font-bold">{p.label}</div>
                      <div className="text-[10px] text-zinc-500">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Initial Daily Habits Seed */}
              <div className="pt-2">
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Daily Habits to Track (Optional)
                </label>
                <div className="space-y-2">
                  {initialHabits.map((h, i) => (
                    <input
                      key={i}
                      type="text"
                      placeholder={`Habit #${i + 1} (e.g. Morning Workout)`}
                      value={h}
                      onChange={(e) => handleHabitChange(i, e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleAddHabitSlot}
                  className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 transition-colors cursor-pointer"
                >
                  + Add another habit slot
                </button>
              </div>

              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); resetForm(); }}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-medium rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-zinc-950 text-xs font-semibold rounded-xl shadow cursor-pointer disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Period'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
