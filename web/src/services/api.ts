import axios from 'axios';
import {
  AdminStats,
  AdminUserItem,
  ApiResponse,
  CalendarMonth,
  CoachStatus,
  DailyChecklist,
  GrowthPoint,
  Habit,
  HabitAnalytics,
  Insight,
  LearningPlan,
  TodayLesson,
  LongTermGoal,
  PeriodOverviewAnalytics,
  SessionResponse,
  TaskPriority,
  TodoTask,
  TrackingPeriod,
  User,
} from '../types';

function resolveApiBaseUrl(): string {
  const raw = (import.meta.env.VITE_API_URL || '').trim();
  if (!raw) {
    return '/api/v1';
  }
  const withScheme = raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
  const trimmed = withScheme.replace(/\/+$/, '');
  return trimmed.endsWith('/api/v1') ? trimmed : `${trimmed}/api/v1`;
}

export const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message = error.response?.data?.error || error.response?.data?.message || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

// Auth
export async function getSession(): Promise<SessionResponse> {
  const { data } = await api.get<ApiResponse<SessionResponse>>('/auth/session');
  return data.data;
}

export async function login(req: { email: string; password: string }): Promise<User> {
  const { data } = await api.post<ApiResponse<User>>('/auth/login', req);
  return data.data;
}

export async function register(req: {
  email: string;
  password: string;
  confirmPassword: string;
  fullName?: string;
  age?: number;
  gender?: string;
}): Promise<User> {
  const { data } = await api.post<ApiResponse<User>>('/auth/register', req);
  return data.data;
}

export async function verifyEmail(token: string): Promise<void> {
  await api.post('/auth/verify-email', { token });
}

export async function resendVerification(email: string): Promise<void> {
  await api.post('/auth/resend-verification', { email });
}

export async function forgotPassword(email: string): Promise<void> {
  await api.post('/auth/forgot-password', { email });
}

export async function resetPassword(req: { token: string; newPassword: string; confirmNewPassword: string }): Promise<void> {
  await api.post('/auth/reset-password', req);
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

// Periods
export async function getActivePeriod(): Promise<TrackingPeriod | null> {
  const { data } = await api.get<ApiResponse<TrackingPeriod | null>>('/periods/active');
  return data.data;
}

export async function getUserPeriods(): Promise<TrackingPeriod[]> {
  const { data } = await api.get<ApiResponse<TrackingPeriod[]>>('/periods');
  return data.data;
}

export async function createPeriod(req: {
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  presetDays?: number;
  habitNames?: string[];
}): Promise<TrackingPeriod> {
  const { data } = await api.post<ApiResponse<TrackingPeriod>>('/periods', req);
  return data.data;
}

export async function completePeriod(periodId: string): Promise<TrackingPeriod> {
  const { data } = await api.post<ApiResponse<TrackingPeriod>>(`/periods/${periodId}/complete`);
  return data.data;
}

export async function updatePeriod(periodId: string, req: { name?: string; description?: string }): Promise<TrackingPeriod> {
  const { data } = await api.patch<ApiResponse<TrackingPeriod>>(`/periods/${periodId}`, req);
  return data.data;
}

// Habits
export async function createHabit(periodId: string, req: {
  name: string;
  description?: string;
  category?: string;
  effectiveStartDate?: string;
}): Promise<Habit> {
  const { data } = await api.post<ApiResponse<Habit>>(`/periods/${periodId}/habits`, req);
  return data.data;
}

export async function updateHabit(habitId: string, req: {
  name: string;
  description?: string;
  category?: string;
  displayOrder?: number;
}): Promise<Habit> {
  const { data } = await api.put<ApiResponse<Habit>>(`/habits/${habitId}`, req);
  return data.data;
}

export async function archiveHabit(habitId: string): Promise<Habit> {
  const { data } = await api.patch<ApiResponse<Habit>>(`/habits/${habitId}/archive`);
  return data.data;
}

export async function reorderHabits(periodId: string, habitIds: string[]): Promise<Habit[]> {
  const { data } = await api.put<ApiResponse<Habit[]>>(`/periods/${periodId}/habits/reorder`, { habitIds });
  return data.data;
}

// Daily Tracking
export async function getDailyChecklist(date?: string): Promise<DailyChecklist> {
  const url = date ? `/tracking/daily?date=${date}` : '/tracking/daily';
  const { data } = await api.get<ApiResponse<DailyChecklist>>(url);
  return data.data;
}

export async function checkHabit(habitId: string, date: string): Promise<DailyChecklist> {
  const { data } = await api.put<ApiResponse<DailyChecklist>>(`/tracking/${habitId}/${date}`);
  return data.data;
}

export async function uncheckHabit(habitId: string, date: string): Promise<DailyChecklist> {
  const { data } = await api.delete<ApiResponse<DailyChecklist>>(`/tracking/${habitId}/${date}`);
  return data.data;
}

// Analytics
export async function getGrowthTrajectory(periodId: string): Promise<GrowthPoint[]> {
  const { data } = await api.get<ApiResponse<GrowthPoint[]>>(`/analytics/period/${periodId}/growth`);
  return data.data;
}

export async function getPeriodOverview(periodId: string): Promise<PeriodOverviewAnalytics> {
  const { data } = await api.get<ApiResponse<PeriodOverviewAnalytics>>(`/analytics/period/${periodId}/overview`);
  return data.data;
}

export async function getHabitsAnalytics(periodId: string): Promise<HabitAnalytics[]> {
  const { data } = await api.get<ApiResponse<HabitAnalytics[]>>(`/analytics/period/${periodId}/habits`);
  return data.data;
}

export async function getInsights(periodId: string): Promise<Insight[]> {
  const { data } = await api.get<ApiResponse<Insight[]>>(`/analytics/period/${periodId}/insights`);
  return data.data;
}

// Calendar
export async function getMonthView(periodId: string, year: number, month: number): Promise<CalendarMonth> {
  const { data } = await api.get<ApiResponse<CalendarMonth>>(`/calendar/month?periodId=${periodId}&year=${year}&month=${month}`);
  return data.data;
}

// User Profile & Settings
export async function getCurrentUser(): Promise<User> {
  const { data } = await api.get<ApiResponse<User>>('/users/me');
  return data.data;
}

export async function updateUser(req: {
  timezone?: string;
  theme?: string;
  fullName?: string;
  age?: number;
  gender?: string;
  currentPassword?: string;
  newPassword?: string;
}): Promise<User> {
  const { data } = await api.patch<ApiResponse<User>>('/users/me', req);
  return data.data;
}

export async function exportUserData(): Promise<Blob> {
  const response = await api.get('/users/me/export', { responseType: 'blob' });
  return response.data;
}

export async function deleteAccount(password: string): Promise<void> {
  await api.delete('/users/me', { data: { password } });
}

// Admin
export async function getAdminStats(): Promise<AdminStats> {
  const { data } = await api.get<ApiResponse<AdminStats>>('/admin/stats');
  return data.data;
}

export async function getAdminUsers(): Promise<AdminUserItem[]> {
  const { data } = await api.get<ApiResponse<AdminUserItem[]>>('/admin/users');
  return data.data;
}

export async function updateUserRole(userId: string, role: string): Promise<void> {
  await api.patch(`/admin/users/${userId}/role`, { role });
}

// Long-Term Goals & Atomic Habits Coach
export async function getCoachStatus(): Promise<CoachStatus> {
  const { data } = await api.get<ApiResponse<CoachStatus>>('/goals/coach-status');
  return data.data;
}

export async function getGoals(): Promise<LongTermGoal[]> {
  const { data } = await api.get<ApiResponse<LongTermGoal[]>>('/goals');
  return data.data;
}

export async function createGoal(req: {
  title: string;
  description?: string;
  category?: string;
  identityStatement?: string;
  targetDate: string;
}): Promise<LongTermGoal> {
  const { data } = await api.post<ApiResponse<LongTermGoal>>('/goals', req);
  return data.data;
}

export async function regenerateGoalBlueprint(goalId: string): Promise<LongTermGoal> {
  const { data } = await api.post<ApiResponse<LongTermGoal>>(`/goals/${goalId}/regenerate`);
  return data.data;
}

export async function toggleGoalMilestone(goalId: string, milestoneId: string): Promise<LongTermGoal> {
  const { data } = await api.patch<ApiResponse<LongTermGoal>>(`/goals/${goalId}/milestones/${milestoneId}/toggle`);
  return data.data;
}

export async function addGoalMilestone(
  goalId: string,
  req: { title: string; description?: string; targetDate?: string }
): Promise<LongTermGoal> {
  const { data } = await api.post<ApiResponse<LongTermGoal>>(`/goals/${goalId}/milestones`, req);
  return data.data;
}

export async function updateGoalStatus(goalId: string, status: string): Promise<LongTermGoal> {
  const { data } = await api.patch<ApiResponse<LongTermGoal>>(`/goals/${goalId}/status`, { status });
  return data.data;
}

export async function deleteGoal(goalId: string): Promise<void> {
  await api.delete(`/goals/${goalId}`);
}

export async function adoptGoalHabits(
  goalId: string,
  req: {
    suggestedHabitIds: string[];
    mode: 'ADD_TO_ACTIVE_PERIOD' | 'START_NEW_PERIOD';
    periodName?: string;
    presetDays?: number;
    replaceActivePeriod?: boolean;
  }
): Promise<{ addedHabitsCount: number; periodId: string; periodName: string; goal: LongTermGoal }> {
  const { data } = await api.post<
    ApiResponse<{ addedHabitsCount: number; periodId: string; periodName: string; goal: LongTermGoal }>
  >(`/goals/${goalId}/adopt-habits`, req);
  return data.data;
}

/** One-step start: adds the goal's habits to your active period, or opens a new period of that many days. */
export function startGoalTracking(goalId: string, habitIds: string[], hasActivePeriod: boolean, days: number) {
  return adoptGoalHabits(goalId, {
    suggestedHabitIds: habitIds,
    mode: hasActivePeriod ? 'ADD_TO_ACTIVE_PERIOD' : 'START_NEW_PERIOD',
    presetDays: Math.max(7, days),
  });
}

// Daily To-Do & Plan Ahead
export async function getTodos(params?: { date?: string; view?: 'upcoming' | 'overdue' | 'all' }): Promise<TodoTask[]> {
  const search = new URLSearchParams();
  if (params?.date) search.set('date', params.date);
  if (params?.view) search.set('view', params.view);
  const qs = search.toString();
  const { data } = await api.get<ApiResponse<TodoTask[]>>(qs ? `/todos?${qs}` : '/todos');
  return data.data;
}

export async function createTodo(req: {
  title: string;
  notes?: string;
  dueDate?: string;
  scheduledTime?: string;
  priority?: TaskPriority;
  goalId?: string;
}): Promise<TodoTask> {
  const { data } = await api.post<ApiResponse<TodoTask>>('/todos', req);
  return data.data;
}

export async function updateTodo(
  taskId: string,
  req: {
    title?: string;
    notes?: string;
    dueDate?: string;
    scheduledTime?: string;
    priority?: TaskPriority;
    goalId?: string;
    clearGoal?: boolean;
  }
): Promise<TodoTask> {
  const { data } = await api.patch<ApiResponse<TodoTask>>(`/todos/${taskId}`, req);
  return data.data;
}

export async function toggleTodo(taskId: string): Promise<TodoTask> {
  const { data } = await api.patch<ApiResponse<TodoTask>>(`/todos/${taskId}/toggle`);
  return data.data;
}

export async function rescheduleTodo(taskId: string, dueDate: string): Promise<TodoTask> {
  const { data } = await api.patch<ApiResponse<TodoTask>>(`/todos/${taskId}/reschedule`, { dueDate });
  return data.data;
}

export async function carryOverOverdueTodos(targetDate?: string): Promise<{ movedCount: number; targetDate: string }> {
  const { data } = await api.post<ApiResponse<{ movedCount: number; targetDate: string }>>(
    '/todos/carry-over',
    targetDate ? { targetDate } : {}
  );
  return data.data;
}

export async function deleteTodo(taskId: string): Promise<void> {
  await api.delete(`/todos/${taskId}`);
}

// Learning plans
export async function getLearningPlan(goalId: string): Promise<LearningPlan | null> {
  const { data } = await api.get<ApiResponse<LearningPlan | null>>(`/goals/${goalId}/learning-plan`);
  return data.data ?? null;
}

export async function createLearningPlan(
  goalId: string,
  req: { level: string; minutesPerDay: number; learningStyle: string; days: number }
): Promise<LearningPlan> {
  // Live web search and link checks can take a while, so allow up to three minutes.
  const { data } = await api.post<ApiResponse<LearningPlan>>(`/goals/${goalId}/learning-plan`, req, {
    timeout: 180000,
  });
  return data.data;
}

export async function toggleLearningLesson(goalId: string, lessonId: string): Promise<LearningPlan> {
  const { data } = await api.patch<ApiResponse<LearningPlan>>(
    `/goals/${goalId}/learning-plan/lessons/${lessonId}/toggle`
  );
  return data.data;
}

export async function deleteLearningPlan(goalId: string): Promise<void> {
  await api.delete(`/goals/${goalId}/learning-plan`);
}

export async function getTodayLessons(): Promise<TodayLesson[]> {
  const { data } = await api.get<ApiResponse<TodayLesson[]>>('/learning/today');
  return data.data ?? [];
}
