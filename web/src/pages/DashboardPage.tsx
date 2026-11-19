import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/api';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Circle,
  Plus,
  Flame,
  TrendingUp,
  Award,
  CalendarDays,
  Target,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

interface DashboardPageProps {
  onNavigateToPeriods: () => void;
}

export default function DashboardPage({ onNavigateToPeriods }: DashboardPageProps) {
  const queryClient = useQueryClient();
  const [chartMode, setChartMode] = useState<'count' | 'percentage'>('percentage');
  const [newHabitName, setNewHabitName] = useState('');
  const [isAddingHabit, setIsAddingHabit] = useState(false);

  // Active Period
  const { data: activePeriod, isLoading: periodLoading } = useQuery({
    queryKey: ['activePeriod'],
    queryFn: api.getActivePeriod,
  });

  // Daily Checklist
  const { data: checklist, isLoading: checklistLoading } = useQuery({
    queryKey: ['dailyChecklist'],
    queryFn: () => api.getDailyChecklist(),
    enabled: !!activePeriod,
  });

  // Growth Trajectory
  const { data: growthData } = useQuery({
    queryKey: ['growthTrajectory', activePeriod?.id],
    queryFn: () => api.getGrowthTrajectory(activePeriod!.id),
    enabled: !!activePeriod?.id,
  });

  // Period Overview
  const { data: overview } = useQuery({
    queryKey: ['periodOverview', activePeriod?.id],
    queryFn: () => api.getPeriodOverview(activePeriod!.id),
    enabled: !!activePeriod?.id,
  });

  // Check habit mutation with optimistic update
  const checkMutation = useMutation({
    mutationFn: ({ habitId, date }: { habitId: string; date: string }) =>
      api.checkHabit(habitId, date),
    onSuccess: (updatedChecklist) => {
      queryClient.setQueryData(['dailyChecklist'], updatedChecklist);
      queryClient.invalidateQueries({ queryKey: ['growthTrajectory'] });
      queryClient.invalidateQueries({ queryKey: ['periodOverview'] });

      // Trigger celebratory confetti if 100% completed
      if (
        updatedChecklist.completionPercentage === 100 &&
        updatedChecklist.eligibleCount > 0
      ) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#10b981', '#34d399', '#6ee7b7'],
        });
      }
    },
  });

  // Uncheck habit mutation
  const uncheckMutation = useMutation({
    mutationFn: ({ habitId, date }: { habitId: string; date: string }) =>
      api.uncheckHabit(habitId, date),
    onSuccess: (updatedChecklist) => {
      queryClient.setQueryData(['dailyChecklist'], updatedChecklist);
      queryClient.invalidateQueries({ queryKey: ['growthTrajectory'] });
      queryClient.invalidateQueries({ queryKey: ['periodOverview'] });
    },
  });

  // Add habit mutation
  const addHabitMutation = useMutation({
    mutationFn: (name: string) =>
      api.createHabit(activePeriod!.id, { name }),
    onSuccess: () => {
      setNewHabitName('');
      setIsAddingHabit(false);
      queryClient.invalidateQueries({ queryKey: ['dailyChecklist'] });
      queryClient.invalidateQueries({ queryKey: ['activePeriod'] });
    },
  });

  const handleToggleHabit = (habitId: string, isCompleted: boolean) => {
    if (!checklist?.date) return;
    if (isCompleted) {
      uncheckMutation.mutate({ habitId, date: checklist.date });
    } else {
      checkMutation.mutate({ habitId, date: checklist.date });
    }
  };

  const handleCreateHabitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newHabitName.trim() && activePeriod) {
      addHabitMutation.mutate(newHabitName.trim());
    }
  };

  if (periodLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!activePeriod) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-lg mx-auto">
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 mb-6">
          <Target className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
          No Active Tracking Period
        </h2>
        <p className="text-sm text-zinc-400 mb-8 leading-relaxed">
          LOCKIN organizes habits into time-boxed tracking periods (e.g. 14, 21, 30, or 90 days).
          Create your first period to start measuring your daily consistency.
        </p>
        <button
          onClick={onNavigateToPeriods}
          className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-semibold px-5 py-3 rounded-xl shadow-lg shadow-emerald-500/20 text-sm transition-all cursor-pointer"
        >
          <span>Create Tracking Period</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Filter trajectory to elapsed or scheduled points
  const chartData = growthData?.map((p) => ({
    date: p.date.substring(5), // MM-DD
    value: chartMode === 'percentage' ? (p.future ? null : (p.completionPercentage ?? 0)) : p.completedCount,
    maxEligible: p.eligibleCount,
    percentage: p.completionPercentage,
    isFuture: p.future,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Top Banner / Period Overview */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 sm:p-6 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Active Period
            </span>
            <span className="text-xs text-zinc-400">
              Day {activePeriod.daysElapsed} of {activePeriod.totalDays}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {activePeriod.name}
          </h2>
          {activePeriod.description && (
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
              {activePeriod.description}
            </p>
          )}
        </div>

        {/* Progress Bar & Counter */}
        <div className="w-full md:w-64 shrink-0 bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3.5">
          <div className="flex justify-between text-xs text-zinc-400 mb-1.5 font-medium">
            <span>Period Elapsed</span>
            <span>
              {Math.round((activePeriod.daysElapsed / activePeriod.totalDays) * 100)}%
            </span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.round((activePeriod.daysElapsed / activePeriod.totalDays) * 100))}%`,
              }}
            />
          </div>
          <p className="text-[11px] text-zinc-500 mt-2 text-right">
            {activePeriod.daysRemaining} days remaining
          </p>
        </div>
      </div>

      {/* Main Grid: Checklist & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Daily Checklist */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 sm:p-6 backdrop-blur-md">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80 mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Today's Checklist</span>
                  <span className="text-xs text-zinc-400 font-normal">
                    ({checklist?.dayOfWeek}, {checklist?.date})
                  </span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Check off daily habits to maintain consistency.
                </p>
              </div>

              {checklist && (
                <div className="text-right">
                  <div className="text-sm font-bold text-emerald-400">
                    {checklist.completedCount} of {checklist.eligibleCount} done
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    {checklist.completionPercentage !== null
                      ? `${checklist.completionPercentage}% achieved`
                      : 'No habits active'}
                  </div>
                </div>
              )}
            </div>

            {checklistLoading ? (
              <div className="py-8 text-center text-sm text-zinc-500">
                Loading daily checklist...
              </div>
            ) : checklist?.habits.length === 0 ? (
              <div className="py-8 text-center text-sm text-zinc-500">
                No active habits in this tracking period. Add one below to begin.
              </div>
            ) : (
              <div className="space-y-2.5">
                {checklist?.habits.map((item) => (
                  <button
                    key={item.habitId}
                    type="button"
                    onClick={() => handleToggleHabit(item.habitId, item.completed)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      item.completed
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-zinc-200'
                        : 'bg-zinc-950/40 border-zinc-800/80 hover:border-zinc-700 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {item.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-zinc-600 hover:text-zinc-400 shrink-0" />
                      )}
                      <div className="truncate">
                        <span
                          className={`text-sm font-medium ${
                            item.completed
                              ? 'line-through text-zinc-400'
                              : 'text-zinc-100'
                          }`}
                        >
                          {item.name}
                        </span>
                        {item.category && (
                          <span className="ml-2.5 inline-block text-[10px] px-2 py-0.5 rounded-full bg-zinc-800/80 text-zinc-400 border border-zinc-700/40">
                            {item.category}
                          </span>
                        )}
                        {item.description && (
                          <p className="text-xs text-zinc-500 truncate mt-0.5">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {item.completed && (
                      <span className="text-[10px] text-emerald-500 font-semibold uppercase tracking-wider shrink-0 pl-2">
                        Done
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Quick Add Habit form */}
            <div className="mt-5 pt-4 border-t border-zinc-800/80">
              {isAddingHabit ? (
                <form onSubmit={handleCreateHabitSubmit} className="flex gap-2">
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. Read 20 pages, 30 min workout..."
                    value={newHabitName}
                    onChange={(e) => setNewHabitName(e.target.value)}
                    className="flex-1 bg-zinc-950/80 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={addHabitMutation.isPending}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsAddingHabit(false); setNewHabitName(''); }}
                    className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingHabit(true)}
                  className="flex items-center gap-2 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer py-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Daily Habit</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Quick Stats */}
        <div className="space-y-4">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 sm:p-6 backdrop-blur-md space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-zinc-400">
              Period Performance
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3.5">
                <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>Streak</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {overview?.currentStreak ?? 0}
                  <span className="text-xs text-zinc-500 ml-1 font-normal">days</span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Longest: {overview?.longestStreak ?? 0} days
                </p>
              </div>

              <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3.5">
                <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Overall</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {overview?.overallCompletionPercentage !== null
                    ? `${overview?.overallCompletionPercentage}%`
                    : '—'}
                </div>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Avg: {overview?.averageDailyCompletion ?? 0}%
                </p>
              </div>
            </div>

            <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-zinc-500" />
                  Total Check-ins
                </span>
                <span className="font-semibold text-zinc-200">
                  {overview?.actualCompletedEntries ?? 0} / {overview?.totalPossibleCompletions ?? 0}
                </span>
              </div>

              {overview?.mostConsistentHabit && (
                <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-800/80">
                  <span className="text-zinc-400 flex items-center gap-1.5 truncate">
                    <Award className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    Top Habit
                  </span>
                  <span className="font-medium text-emerald-400 truncate max-w-[120px] text-right">
                    {overview.mostConsistentHabit}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Growth Trajectory Chart */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 sm:p-6 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-bold text-white">Growth Trajectory</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Daily habit completion across the tracking period.
            </p>
          </div>

          <div className="inline-flex rounded-xl bg-zinc-950 p-1 border border-zinc-800 shrink-0">
            <button
              type="button"
              onClick={() => setChartMode('percentage')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                chartMode === 'percentage'
                  ? 'bg-zinc-800 text-white shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Percentage (%)
            </button>
            <button
              type="button"
              onClick={() => setChartMode('count')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                chartMode === 'count'
                  ? 'bg-zinc-800 text-white shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Count (Habits)
            </button>
          </div>
        </div>

        <div className="h-64 w-full">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-zinc-500">
              No performance data to display yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  stroke="#52525b"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke="#52525b"
                  fontSize={11}
                  tickLine={false}
                  domain={chartMode === 'percentage' ? [0, 100] : [0, 'auto']}
                  unit={chartMode === 'percentage' ? '%' : ''}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      if (data.isFuture) {
                        return (
                          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs shadow-xl">
                            <p className="text-zinc-400 font-medium">{data.date} (Upcoming)</p>
                            <p className="text-zinc-500 mt-1">{data.maxEligible} habits scheduled</p>
                          </div>
                        );
                      }
                      return (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs shadow-xl">
                          <p className="text-zinc-400 font-medium">{data.date}</p>
                          <p className="text-emerald-400 font-bold mt-1">
                            {chartMode === 'percentage'
                              ? `${data.percentage ?? 0}% achieved`
                              : `${data.value} of ${data.maxEligible} habits`}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#emeraldGradient)"
                  connectNulls={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
