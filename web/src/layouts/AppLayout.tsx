import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Target, LayoutDashboard, Calendar, BarChart3, Settings, LogOut, ShieldAlert } from 'lucide-react';

export type TabId = 'dashboard' | 'periods' | 'calendar' | 'analytics' | 'settings' | 'admin';

interface AppLayoutProps {
  currentTab: TabId;
  setCurrentTab: (tab: TabId) => void;
  children: React.ReactNode;
}

export default function AppLayout({ currentTab, setCurrentTab, children }: AppLayoutProps) {
  const { user, logout } = useAuth();

  const baseNavItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'periods' as const, label: 'Periods', icon: Target },
    { id: 'calendar' as const, label: 'Calendar', icon: Calendar },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  const navItems = user?.role === 'ADMIN'
    ? [...baseNavItems, { id: 'admin' as const, label: 'Admin', icon: ShieldAlert }]
    : baseNavItems;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-zinc-800/80 bg-zinc-900/40 p-5 shrink-0 justify-between">
        <div>
          <div className="flex items-center gap-3 px-2 py-3 mb-6">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white">LOCKIN</h1>
              <p className="text-[11px] text-zinc-500 font-medium">Growth Calendar</p>
            </div>
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
                      ? 'bg-zinc-800/90 text-white shadow-sm border border-zinc-700/60'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-zinc-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-zinc-800/80">
          <div className="flex items-center justify-between px-2 py-2 mb-2">
            <div className="truncate mr-2">
              <p className="text-xs font-medium text-zinc-300 truncate">{user?.email}</p>
              <p className="text-[10px] text-zinc-500 uppercase">{user?.timezone || 'UTC'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/60 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
              <Target className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm tracking-tight">LOCKIN</span>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </header>

        <div className="p-4 sm:p-6 md:p-8 max-w-6xl w-full mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-lg flex items-center justify-around py-2 px-1 z-40">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
                isActive ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
