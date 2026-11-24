import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Theme } from '../types';
import * as api from '../services/api';
import {
  Settings,
  Globe,
  Moon,
  Sun,
  Monitor,
  KeyRound,
  Download,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X,
  Lock,
} from 'lucide-react';

const COMMON_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Africa/Lagos',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
];

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Moon }[] = [
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'system', label: 'System', icon: Monitor },
];

export default function SettingsPage() {
  const { user, refreshUser, logout } = useAuth();
  const { theme: activeTheme, setTheme: applyGlobalTheme } = useTheme();

  // Preferences form
  const [timezone, setTimezone] = useState(user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  const [theme, setTheme] = useState<Theme>(activeTheme || user?.theme || 'dark');
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [age, setAge] = useState(user?.age ? String(user.age) : '');
  const [gender, setGender] = useState(user?.gender || '');
  const [prefLoading, setPrefLoading] = useState(false);
  const [prefSuccess, setPrefSuccess] = useState<string | null>(null);
  const [prefError, setPrefError] = useState<string | null>(null);

  // Keep form theme in sync if toggled from sidebar/header
  useEffect(() => {
    setTheme(activeTheme);
  }, [activeTheme]);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Data Export
  const [exportLoading, setExportLoading] = useState(false);

  // Delete Account Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleSelectTheme = (nextTheme: Theme) => {
    setTheme(nextTheme);
    applyGlobalTheme(nextTheme, true);
  };

  const handleSavePreferences = async (e: FormEvent) => {
    e.preventDefault();
    setPrefLoading(true);
    setPrefSuccess(null);
    setPrefError(null);

    try {
      const parsedAge = age.trim() ? parseInt(age.trim(), 10) : undefined;
      await api.updateUser({
        timezone,
        theme,
        fullName: fullName.trim() || undefined,
        age: parsedAge,
        gender: gender || undefined,
      });
      applyGlobalTheme(theme);
      await refreshUser();
      setPrefSuccess('Profile details and preferences updated successfully.');
    } catch (err: unknown) {
      setPrefError(err instanceof Error ? err.message : 'Failed to update preferences.');
    } finally {
      setPrefLoading(false);
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordSuccess(null);
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      setPasswordLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      setPasswordLoading(false);
      return;
    }

    try {
      await api.updateUser({ currentPassword, newPassword });
      setPasswordSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleExportData = async () => {
    setExportLoading(true);
    try {
      const blob = await api.exportUserData();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lockin-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to export data.');
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteAccount = async (e: FormEvent) => {
    e.preventDefault();
    if (!deletePassword) return;

    setDeleteLoading(true);
    setDeleteError(null);

    try {
      await api.deleteAccount(deletePassword);
      setShowDeleteModal(false);
      await logout();
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete account.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800/80">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          <span>Account & Preferences</span>
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Manage your personal settings, time zone, security credentials, and data privacy.
        </p>
      </div>

      {/* Account Info Card */}
      <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-sm dark:shadow-none">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Account Profile</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-zinc-500 block mb-1">Email Address</span>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-zinc-800 dark:text-zinc-200 text-sm break-all">{user?.email}</span>
              {user?.emailVerified ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                  Pending Verification
                </span>
              )}
            </div>
          </div>
          <div>
            <span className="text-zinc-500 block mb-1">Account Role</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
              user?.role === 'ADMIN'
                ? 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/30'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60'
            }`}>
              {user?.role || 'USER'}
            </span>
          </div>
        </div>
      </div>

      {/* Preferences & Demographics Form */}
      <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-sm dark:shadow-none">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-1 flex items-center gap-2">
          <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Profile & Appearance</span>
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">
          Personal details and time zone for accurate local date calculations.
        </p>

        {prefSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs">
            {prefSuccess}
          </div>
        )}
        {prefError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
            {prefError}
          </div>
        )}

        <form onSubmit={handleSavePreferences} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Alex Morgan"
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Age
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 28"
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="">Select...</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="NON_BINARY">Non-Binary</option>
                <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="user-timezone" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Timezone (IANA)
            </label>
            <select
              id="user-timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              {!COMMON_TIMEZONES.includes(timezone) && (
                <option value={timezone}>{timezone} (Detected)</option>
              )}
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">Interface Theme</label>
            <div className="grid grid-cols-3 gap-3">
              {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleSelectTheme(value)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                    theme === value
                      ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-700 dark:text-emerald-400'
                      : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <Icon className="w-4 h-4 mx-auto mb-1 opacity-80" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={prefLoading}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 disabled:opacity-50 text-white dark:text-zinc-950 font-semibold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
          >
            {prefLoading ? 'Saving...' : 'Save Preferences'}
          </button>
        </form>
      </div>

      {/* Security & Password */}
      <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-sm dark:shadow-none">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-1 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Security & Password</span>
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">Update your account authentication password.</p>

        {passwordSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs">
            {passwordSuccess}
          </div>
        )}
        {passwordError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
            {passwordError}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="••••••••"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="At least 8 characters"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="Repeat new password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={passwordLoading}
            className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 disabled:opacity-50 text-zinc-900 dark:text-white font-medium text-xs rounded-xl transition-all cursor-pointer border border-zinc-300 dark:border-zinc-700"
          >
            {passwordLoading ? 'Updating Password...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* Data Portability */}
      <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-sm dark:shadow-none">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-1 flex items-center gap-2">
              <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Export Personal Data</span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-lg mt-1">
              Your data belongs to you. Download a comprehensive JSON export of your profile, tracking
              periods, habit configurations, and all historical completions.
            </p>
          </div>
          <button
            onClick={handleExportData}
            disabled={exportLoading}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-medium text-zinc-800 dark:text-zinc-200 transition-colors shrink-0 self-start cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{exportLoading ? 'Exporting...' : 'Export JSON'}</span>
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="p-6 rounded-2xl border border-rose-200 dark:border-rose-900/30 bg-rose-50/70 dark:bg-rose-950/10">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Delete Account</span>
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-lg mt-1">
              Permanently erase your account, active tracking period, archived habits, and history.
              This action is immediate and cannot be undone.
            </p>
          </div>
          <button
            onClick={() => {
              setShowDeleteModal(true);
              setDeleteError(null);
              setDeletePassword('');
            }}
            className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 transition-colors shrink-0 self-start cursor-pointer"
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="absolute top-4 right-4 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4 text-rose-600 dark:text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">Confirm Account Deletion</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">All habit records will be permanently removed.</p>
              </div>
            </div>

            {deleteError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
                {deleteError}
              </div>
            )}

            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Confirm Password to Proceed
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    required
                    placeholder="Enter current password"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700/80 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleteLoading || !deletePassword}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-lg shadow-rose-600/20"
                >
                  {deleteLoading ? 'Deleting...' : 'Permanently Delete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
