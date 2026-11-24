import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/api';
import {
  ShieldAlert,
  Users,
  CheckCircle2,
  Calendar,
  Sparkles,
  TrendingUp,
  Search,
  UserCheck,
  ShieldCheck,
  Filter,
} from 'lucide-react';

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'USER'>('ALL');

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: api.getAdminStats,
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: api.getAdminUsers,
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      api.updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
  });

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.fullName && u.fullName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const formatGender = (gender: string | null) => {
    if (!gender) return 'Unspecified';
    switch (gender) {
      case 'MALE':
        return 'Male';
      case 'FEMALE':
        return 'Female';
      case 'NON_BINARY':
        return 'Non-Binary';
      case 'PREFER_NOT_TO_SAY':
        return 'Not Disclosed';
      default:
        return gender;
    }
  };

  const handleRoleToggle = (userId: string, currentRole: string) => {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    if (confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      updateRoleMutation.mutate({ userId, role: newRole });
    }
  };

  if (statsLoading || usersLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-zinc-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800/80">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2.5">
          <ShieldAlert className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          <span>Platform Administration & User Monitoring</span>
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Monitor user registrations, user demographics (age, gender), tracking periods, and system-wide activity.
        </p>
      </div>

      {/* KPI Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm dark:shadow-none backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Registered</span>
              <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">{stats.totalUsers}</div>
            <p className="text-[11px] text-zinc-500 mt-1">
              {stats.verifiedUsers} verified ({stats.totalUsers > 0 ? ((stats.verifiedUsers / stats.totalUsers) * 100).toFixed(0) : 0}%)
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm dark:shadow-none backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Active Tracking Periods</span>
              <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">{stats.activePeriods}</div>
            <p className="text-[11px] text-zinc-500 mt-1">
              {stats.totalPeriods} total created periods
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm dark:shadow-none backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Check-Ins Logged</span>
              <CheckCircle2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">{stats.totalHabitCompletions}</div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Across all habits & tracking days
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm dark:shadow-none backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Average User Age</span>
              <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            </div>
            <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight">
              {stats.averageAge !== null ? `${stats.averageAge.toFixed(0)} yrs` : 'N/A'}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Demographic average from profiles
            </p>
          </div>
        </div>
      )}

      {/* Demographics Summary Card */}
      {stats && stats.genderDistribution && (
        <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-sm dark:shadow-none">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Gender Distribution</span>
          </h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(stats.genderDistribution).map(([genderKey, count]) => {
              const label = formatGender(genderKey);
              const pct = stats.totalUsers > 0 ? ((count / stats.totalUsers) * 100).toFixed(0) : '0';
              return (
                <div
                  key={genderKey}
                  className="px-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center gap-3"
                >
                  <span className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">{label}</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                    {count} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Users Table Card */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900/40 shadow-sm dark:shadow-none overflow-hidden">
        {/* Table Controls */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-white">Registered Users Directory</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Listing {filteredUsers.length} of {users.length} registered accounts
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search email or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-300 dark:border-zinc-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-500 w-48 sm:w-60"
              />
            </div>

            {/* Role Filter */}
            <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-300 dark:border-zinc-800 rounded-xl px-2.5 py-1.5">
              <Filter className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as 'ALL' | 'ADMIN' | 'USER')}
                className="bg-transparent text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Roles</option>
                <option value="ADMIN">Admins</option>
                <option value="USER">Standard Users</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-950/50 text-zinc-500 dark:text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Demographics</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Verification</th>
                <th className="px-5 py-3">Active Period</th>
                <th className="px-5 py-3">Habits / Checks</th>
                <th className="px-5 py-3">Registered</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/60 text-zinc-700 dark:text-zinc-300">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-zinc-500">
                    No users match your current filter.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                    {/* User info */}
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-zinc-900 dark:text-white">{u.fullName || 'No name'}</div>
                      <div className="font-mono text-zinc-500 dark:text-zinc-400 text-[11px]">{u.email}</div>
                    </td>

                    {/* Demographics */}
                    <td className="px-5 py-3.5">
                      <div className="text-zinc-700 dark:text-zinc-200">
                        {u.age ? `${u.age} yrs` : '—'} • {formatGender(u.gender)}
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/30'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/60'
                        }`}
                      >
                        {u.role === 'ADMIN' && <ShieldCheck className="w-3 h-3" />}
                        {u.role}
                      </span>
                    </td>

                    {/* Email Verification */}
                    <td className="px-5 py-3.5">
                      {u.emailVerified ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                          <UserCheck className="w-3.5 h-3.5" /> Pending
                        </span>
                      )}
                    </td>

                    {/* Active Period */}
                    <td className="px-5 py-3.5">
                      {u.activePeriodName ? (
                        <div>
                          <span className="text-zinc-900 dark:text-zinc-100 font-medium">{u.activePeriodName}</span>
                          <span className="text-zinc-500 text-[10px] block">
                            {u.activePeriodDays ? `${u.activePeriodDays} days` : ''}
                          </span>
                        </div>
                      ) : (
                        <span className="text-zinc-400 dark:text-zinc-600">None</span>
                      )}
                    </td>

                    {/* Habits / Checks */}
                    <td className="px-5 py-3.5">
                      <span className="text-zinc-800 dark:text-zinc-200 font-medium">{u.totalHabitsCount} habits</span>
                      <span className="text-zinc-500 text-[10px] block">
                        {u.totalCompletionsCount} check-ins
                      </span>
                    </td>

                    {/* Registration date */}
                    <td className="px-5 py-3.5 text-zinc-500 text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleRoleToggle(u.id, u.role)}
                        disabled={updateRoleMutation.isPending}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-medium border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        title={u.role === 'ADMIN' ? 'Demote to USER' : 'Promote to ADMIN'}
                      >
                        {u.role === 'ADMIN' ? 'Demote' : 'Make Admin'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
