import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as api from '../services/api';
import {
  BarChart3,
  Flame,
  Award,
  Sparkles,
  TrendingUp,
  Lightbulb,
  CheckCircle2,
  Calendar,
  AlertCircle,
} from 'lucide-react';

export default function AnalyticsPage() {
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);

  const { data: periods = [], isLoading: periodsLoading } = useQuery({
    queryKey: ['periods'],
    queryFn: api.getUserPeriods,
  });

  // Determine active or first period ID
  const activePeriod = periods.find((p) => p.status === 'ACTIVE') || periods[0] || null;
  const currentPeriodId = selectedPeriodId || activePeriod?.id;

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['periodOverview', currentPeriodId],
    queryFn: () => api.getPeriodOverview(currentPeriodId!),
    enabled: !!currentPeriodId,
  });

  const { data: habitAnalytics = [], isLoading: habitsLoading } = useQuery({
    queryKey: ['habitAnalytics', currentPeriodId],
    queryFn: () => api.getHabitsAnalytics(currentPeriodId!),
    enabled: !!currentPeriodId,
  });

  const { data: insights = [], isLoading: insightsLoading } = useQuery({
    queryKey: ['insights', currentPeriodId],
    queryFn: () => api.getInsights(currentPeriodId!),
    enabled: !!currentPeriodId,
  });

  const isLoading = periodsLoading || overviewLoading || habitsLoading || insightsLoading;

  if (periodsLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-zinc-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  if (periods.length === 0) {
    return (
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900/40 p-12 text-center max-w-xl mx-auto my-12 shadow-sm dark:shadow-none">
        <div className="p-3 bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl w-fit mx-auto mb-4 text-zinc-500 dark:text-zinc-400">
          <BarChart3 className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">No Tracking Periods Yet</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
          Create and start an active tracking period to unlock growth trajectories, streaks, and performance insights.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header & Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800/80">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>Consistency Analytics</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Data-backed metrics, streaks, and habit performance for your selected period.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="period-select" className="text-xs text-zinc-500 dark:text-zinc-400 shrink-0">
            Period:
          </label>
          <select
            id="period-select"
            value={currentPeriodId || ''}
            onChange={(e) => setSelectedPeriodId(e.target.value)}
            className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700/80 text-zinc-800 dark:text-zinc-200 text-xs rounded-xl px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none cursor-pointer"
          >
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12 text-zinc-500">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500" />
        </div>
      )}

      {overview && (
        <>
          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Completion Rate */}
            <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 shadow-sm dark:shadow-none backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Completion Rate</span>
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                {overview.overallCompletionPercentage !== null
                  ? `${overview.overallCompletionPercentage.toFixed(1)}%`
                  : 'N/A'}
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                {overview.actualCompletedEntries} / {overview.totalPossibleCompletions} eligible marks
              </p>
            </div>

            {/* Current Streak */}
            <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 shadow-sm dark:shadow-none backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Current Streak</span>
                <Flame className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              </div>
              <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight">
                {overview.currentStreak}{' '}
                <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400">
                  {overview.currentStreak === 1 ? 'day' : 'days'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                Longest: {overview.longestStreak} {overview.longestStreak === 1 ? 'day' : 'days'}
              </p>
            </div>

            {/* Best Performing Day */}
            <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 shadow-sm dark:shadow-none backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Best Performing Day</span>
                <Calendar className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              </div>
              <div className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight truncate">
                {overview.bestPerformingDay || 'None yet'}
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                {overview.bestPerformingDayPercentage !== null
                  ? `${overview.bestPerformingDayPercentage.toFixed(1)}% average completion`
                  : 'Requires active completions'}
              </p>
            </div>

            {/* Most Consistent Habit */}
            <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 shadow-sm dark:shadow-none backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Top Habit</span>
                <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight truncate">
                {overview.mostConsistentHabit || 'None yet'}
              </div>
              <p className="text-[11px] text-zinc-500 mt-1 truncate">
                {overview.leastConsistentHabit
                  ? `Focus on: ${overview.leastConsistentHabit}`
                  : 'Keep building momentum'}
              </p>
            </div>
          </div>

          {/* Habit Breakdown List */}
          <div className="border border-zinc-200 dark:border-zinc-800/80 rounded-2xl bg-white dark:bg-zinc-900/40 p-6 shadow-sm dark:shadow-none">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-white">Habit Performance Breakdown</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Individual habit completion rates and active streaks.</p>
              </div>
              <span className="text-xs text-zinc-500 font-mono">
                {habitAnalytics.length} active {habitAnalytics.length === 1 ? 'habit' : 'habits'}
              </span>
            </div>

            {habitAnalytics.length === 0 ? (
              <p className="text-sm text-zinc-500 py-6 text-center">No habits found in this period.</p>
            ) : (
              <div className="space-y-4">
                {habitAnalytics.map((habit) => {
                  const pct = habit.completionPercentage ?? 0;
                  return (
                    <div
                      key={habit.habitId}
                      className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/70 hover:border-zinc-300 dark:hover:border-zinc-700/70 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                              {habit.name}
                            </span>
                            {habit.category && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-zinc-200/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-300/60 dark:border-zinc-700/60">
                                {habit.category}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            {habit.totalCompletions} of {habit.eligibleDays} eligible days completed
                          </p>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
                            <Flame className="w-3.5 h-3.5" />
                            <span>{habit.currentStreak}d streak</span>
                          </div>
                          <span className="font-mono text-sm font-bold text-zinc-900 dark:text-white w-14 text-right">
                            {habit.completionPercentage !== null
                              ? `${habit.completionPercentage.toFixed(0)}%`
                              : '0%'}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-zinc-200 dark:bg-zinc-800/80 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Actionable Insights */}
          <div className="border border-zinc-200 dark:border-zinc-800/80 rounded-2xl bg-white dark:bg-zinc-900/40 p-6 shadow-sm dark:shadow-none">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-base font-semibold text-zinc-900 dark:text-white">Actionable Insights</h3>
            </div>

            {insights.length === 0 ? (
              <p className="text-xs text-zinc-500">
                Keep tracking habits daily to generate tailored behavioral insights.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insights.map((insight, idx) => {
                  const isPositive = insight.type === 'POSITIVE';
                  const isTip = insight.type === 'TIP';

                  const badgeBorder = isPositive
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : isTip
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : 'border-zinc-300 dark:border-zinc-700/50 bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300';

                  const Icon = isPositive ? CheckCircle2 : isTip ? Lightbulb : AlertCircle;

                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/70 flex items-start gap-3.5"
                    >
                      <div className={`p-2 rounded-lg border shrink-0 ${badgeBorder}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{insight.title}</h4>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
                          {insight.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
