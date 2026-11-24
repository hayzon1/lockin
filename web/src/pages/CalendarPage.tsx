import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as api from '../services/api';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2, Circle } from 'lucide-react';

export default function CalendarPage() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(today.toISOString().split('T')[0]);

  const { data: activePeriod } = useQuery({
    queryKey: ['activePeriod'],
    queryFn: api.getActivePeriod,
  });

  const { data: calendarData, isLoading } = useQuery({
    queryKey: ['calendarMonth', activePeriod?.id, currentYear, currentMonth],
    queryFn: () => api.getMonthView(activePeriod!.id, currentYear, currentMonth),
    enabled: !!activePeriod?.id,
  });

  const { data: dayDetails, isLoading: dayLoading } = useQuery({
    queryKey: ['dayDetails', selectedDate],
    queryFn: () => api.getDailyChecklist(selectedDate!),
    enabled: !!selectedDate,
  });

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const getIntensityColor = (intensity: number, inPeriod: boolean, isFuture: boolean) => {
    if (!inPeriod) return 'bg-zinc-100/70 dark:bg-zinc-950/30 border-zinc-200/70 dark:border-zinc-900/40 text-zinc-400 dark:text-zinc-700';
    if (isFuture) return 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800/80 text-zinc-400 dark:text-zinc-500';
    switch (intensity) {
      case 4:
        return 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-zinc-950 font-bold border-emerald-700 dark:border-emerald-400';
      case 3:
        return 'bg-emerald-400 dark:bg-emerald-600/80 text-white font-semibold border-emerald-500 dark:border-emerald-500/80';
      case 2:
        return 'bg-emerald-200 dark:bg-emerald-700/50 text-emerald-900 dark:text-emerald-100 border-emerald-300 dark:border-emerald-600/50';
      case 1:
        return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40';
      default:
        return 'bg-white dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800';
    }
  };

  if (!activePeriod) {
    return (
      <div className="py-16 text-center text-sm text-zinc-500">
        Please create or activate a tracking period to view the growth calendar.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Calendar Heatmap</h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Visual consistency matrix and historical drilldown.
          </p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-2 bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 self-start sm:self-auto shadow-sm dark:shadow-none">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold px-2 min-w-[110px] text-center text-zinc-800 dark:text-zinc-200">
            {calendarData?.monthName || 'Month'} {currentYear}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-sm dark:shadow-none backdrop-blur-md">
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {isLoading ? (
            <div className="py-16 text-center text-xs text-zinc-500">Loading calendar...</div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {calendarData?.days.map((day) => {
                const isSelected = selectedDate === day.date;
                return (
                  <button
                    key={day.date}
                    onClick={() => setSelectedDate(day.date)}
                    className={`aspect-square p-2 rounded-xl border flex flex-col justify-between transition-all cursor-pointer ${
                      getIntensityColor(day.intensity, day.inPeriod, day.future)
                    } ${isSelected ? 'ring-2 ring-emerald-500 dark:ring-emerald-400 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950 scale-105 z-10' : ''}`}
                  >
                    <span className="text-xs font-semibold">{day.dayOfMonth}</span>
                    {day.inPeriod && !day.future && (
                      <span className="text-[10px] opacity-80 text-right">
                        {day.completionPercentage !== null ? `${Math.round(day.completionPercentage)}%` : ''}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Intensity Legend */}
          <div className="flex items-center justify-between text-xs text-zinc-500 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800/80">
            <span>Less consistent</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800" />
              <span className="w-3.5 h-3.5 rounded bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40" />
              <span className="w-3.5 h-3.5 rounded bg-emerald-200 dark:bg-emerald-700/50 border border-emerald-300 dark:border-emerald-600/50" />
              <span className="w-3.5 h-3.5 rounded bg-emerald-400 dark:bg-emerald-600/80 border border-emerald-500 dark:border-emerald-500/80" />
              <span className="w-3.5 h-3.5 rounded bg-emerald-600 dark:bg-emerald-500 border border-emerald-700 dark:border-emerald-400" />
            </div>
            <span>100% Locked In</span>
          </div>
        </div>

        {/* Day Details Drawer (1 Col) */}
        <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-sm dark:shadow-none backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-200 dark:border-zinc-800">
            <CalendarIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
              {selectedDate || 'Select a Date'}
            </h3>
          </div>

          {dayLoading ? (
            <div className="py-8 text-center text-xs text-zinc-500">Loading checklist...</div>
          ) : !dayDetails || dayDetails.habits.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              No habits recorded or scheduled for this date.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 pb-2">
                <span>Performance</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {dayDetails.completedCount} of {dayDetails.eligibleCount} (
                  {dayDetails.completionPercentage !== null ? `${dayDetails.completionPercentage}%` : '0%'})
                </span>
              </div>

              <div className="space-y-2">
                {dayDetails.habits.map((h) => (
                  <div
                    key={h.habitId}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800/80 text-xs text-zinc-700 dark:text-zinc-300"
                  >
                    <div className="flex items-center gap-2 truncate">
                      {h.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-zinc-400 dark:text-zinc-600 shrink-0" />
                      )}
                      <span className={h.completed ? 'line-through text-zinc-400 dark:text-zinc-500' : 'text-zinc-800 dark:text-zinc-200'}>
                        {h.name}
                      </span>
                    </div>
                    {h.completed && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-500 font-semibold uppercase">Done</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
