import axios from 'axios';
import {
  AdminStats,
  AdminUserItem,
  ApiResponse,
  CalendarMonth,
  DailyChecklist,
  GrowthPoint,
  Habit,
  HabitAnalytics,
  Insight,
  PeriodOverviewAnalytics,
  SessionResponse,
  TrackingPeriod,
  User,
} from '../types';

export const api = axios.create({
  baseURL: '/api/v1',
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
