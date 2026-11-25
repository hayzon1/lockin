export type Theme = 'dark' | 'light' | 'system';

export type PeriodStatus = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

export type UserRole = 'USER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  timezone: string;
  theme: Theme;
  fullName?: string | null;
  age?: number | null;
  gender?: string | null;
  role: UserRole;
}

export interface SessionResponse {
  authenticated: boolean;
  user: User | null;
}

export interface Habit {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  displayOrder: number;
  effectiveStartDate: string;
  archived: boolean;
  goalId?: string | null;
  goalTitle?: string | null;
  twoMinuteVersion?: string | null;
  habitStackCue?: string | null;
}

export interface TrackingPeriod {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  status: PeriodStatus;
  totalDays: number;
  daysElapsed: number;
  daysRemaining: number;
  habits: Habit[];
  createdAt: string;
  updatedAt: string;
}

export interface DailyChecklistItem {
  habitId: string;
  name: string;
  description: string | null;
  category: string | null;
  displayOrder: number;
  completed: boolean;
  completedAt: string | null;
  goalId?: string | null;
  goalTitle?: string | null;
  twoMinuteVersion?: string | null;
  habitStackCue?: string | null;
}

export interface DailyChecklist {
  date: string;
  dayOfWeek: string;
  periodId: string | null;
  periodName: string | null;
  habits: DailyChecklistItem[];
  eligibleCount: number;
  completedCount: number;
  completionPercentage: number | null;
}

export interface GrowthPoint {
  date: string;
  dayOfWeek: string;
  eligibleCount: number;
  completedCount: number;
  completionPercentage: number | null;
  future: boolean;
  elapsed: boolean;
}

export interface PeriodOverviewAnalytics {
  totalHabits: number;
  totalPossibleCompletions: number;
  actualCompletedEntries: number;
  overallCompletionPercentage: number | null;
  averageDailyCompletion: number | null;
  currentStreak: number;
  longestStreak: number;
  bestPerformingDay: string | null;
  bestPerformingDayPercentage: number | null;
  mostConsistentHabit: string | null;
  leastConsistentHabit: string | null;
}

export interface HabitAnalytics {
  habitId: string;
  name: string;
  category: string | null;
  totalCompletions: number;
  eligibleDays: number;
  completionPercentage: number | null;
  currentStreak: number;
  longestStreak: number;
  completionDates: string[];
}

export interface Insight {
  type: 'POSITIVE' | 'NEUTRAL' | 'TIP';
  title: string;
  description: string;
}

export interface CalendarDay {
  date: string;
  dayOfMonth: number;
  inPeriod: boolean;
  eligibleCount: number;
  completedCount: number;
  completionPercentage: number | null;
  intensity: number;
  future: boolean;
  today: boolean;
}

export interface CalendarMonth {
  year: number;
  month: number;
  monthName: string;
  periodId: string;
  periodName: string;
  days: CalendarDay[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
}

export interface AdminStats {
  totalUsers: number;
  verifiedUsers: number;
  totalPeriods: number;
  activePeriods: number;
  totalHabitCompletions: number;
  overallPlatformCompletionPercentage: number | null;
  genderDistribution: Record<string, number>;
  averageAge: number | null;
}

export interface AdminUserItem {
  id: string;
  email: string;
  fullName: string | null;
  age: number | null;
  gender: string | null;
  role: UserRole;
  emailVerified: boolean;
  createdAt: string;
  activePeriodName: string | null;
  activePeriodDays: number | null;
  totalHabitsCount: number;
  totalCompletionsCount: number;
  currentStreak: number;
}

export type GoalStatus = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

export interface GoalMilestone {
  id: string;
  title: string;
  description: string | null;
  targetDate: string | null;
  displayOrder: number;
  completed: boolean;
  completedAt: string | null;
}

export interface GoalSuggestedHabit {
  id: string;
  name: string;
  twoMinuteVersion: string | null;
  habitStackCue: string | null;
  category: string | null;
  whyItWorks: string | null;
  displayOrder: number;
  adopted: boolean;
}

export interface LongTermGoal {
  id: string;
  title: string;
  description: string | null;
  category: string;
  identityStatement: string | null;
  targetDate: string;
  daysRemaining: number;
  status: GoalStatus;
  aiProvider: 'GEMINI' | 'BUILT_IN' | string;
  roadmapSummary: string | null;
  milestones: GoalMilestone[];
  suggestedHabits: GoalSuggestedHabit[];
  linkedHabitsCount: number;
  identityVotesCount: number;
  progressPercentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface CoachStatus {
  aiEnabled: boolean;
  activeProvider: 'GEMINI' | 'BUILT_IN';
}

export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface TodoTask {
  id: string;
  title: string;
  notes: string | null;
  dueDate: string;
  scheduledTime: string | null;
  priority: TaskPriority;
  completed: boolean;
  completedAt: string | null;
  goalId: string | null;
  goalTitle: string | null;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}
