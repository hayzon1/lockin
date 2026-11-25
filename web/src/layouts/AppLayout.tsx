import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Target,
  Compass,
  CheckSquare,
  LayoutDashboard,
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  ShieldAlert,
  Sun,
  Moon,
} from 'lucide-react';

export type TabId = 'dashboard' | 'tasks' | 'goals' | 'periods' | 'calendar' | 'analytics' | 'settings' | 'admin';

interface AppLayoutProps {
  currentTab: TabId;
  setCurrentTab: (tab: TabId) => void;
  children: React.ReactNode;
}

export default function AppLayout({ currentTab, setCurrentTab, children }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();

  const toggleQuickTheme = () => {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(next, true);
  };

  const baseNavItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks' as const, label: 'Tasks', icon: CheckSquare },
    { id: 'goals' as const, label: 'Goals', icon: Compass },
    { id: 'periods' as const, label: 'Periods', icon: Target },
    { id: 'calendar' as const, label: 'Calendar', icon: Calendar },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  const navItems = user?.role === 'ADMIN'
    ? [...baseNavItems, { id: 'admin' as const, label: 'Admin', icon: ShieldAlert }]
    : baseNavItems;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col md:flex-row transition-colors duration-200">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 p-5 shrink-0 justify-between transition-colors">
        <div>
          <div className="flex items-center justify-between px-2 py-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight text-zinc-900 dark:text-white">LOCKIN</h1>
                <p className="text-[11px] text-zinc-500 font-medium">Growth Calendar</p>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleQuickTheme}
              title={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-zinc-100 dark:bg-zinc-800/90 text-zinc-900 dark:text-white shadow-sm border border-zinc-200 dark:border-zinc-700/60'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/40'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isActive
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-zinc-400 dark:text-zinc-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800/80">
          <div className="flex items-center justify-between px-2 py-2 mb-2">
            <div className="truncate mr-2">
              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">{user?.email}</p>
              <p className="text-[10px] text-zinc-500 uppercase">{user?.timezone || 'UTC'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-600 dark:text-emerald-400">
              <Target className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm tracking-tight text-zinc-900 dark:text-white">LOCKIN</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleQuickTheme}
              className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 cursor-pointer"
              title={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="p-4 sm:p-6 md:p-8 max-w-6xl w-full mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-lg flex items-center gap-0.5 overflow-x-auto py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] px-1 z-40">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex-1 min-w-[54px] flex flex-col items-center gap-0.5 py-1 px-1 rounded-lg text-[10px] font-medium transition-colors shrink-0 ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate max-w-full">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
