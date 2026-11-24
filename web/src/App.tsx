import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './layouts/AppLayout';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import PeriodsPage from './pages/PeriodsPage';
import CalendarPage from './pages/CalendarPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import AdminPage from './pages/AdminPage';
import { Target } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 30, // 30 seconds
    },
  },
});

type NavTab = 'dashboard' | 'periods' | 'calendar' | 'analytics' | 'settings' | 'admin';

function MainApp() {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center">
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 mb-4 animate-pulse">
          <Target className="w-8 h-8" />
        </div>
        <p className="text-xs text-zinc-500 font-mono tracking-wider uppercase">Loading LOCKIN...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <AppLayout currentTab={currentTab} setCurrentTab={setCurrentTab}>
      {currentTab === 'dashboard' && (
        <DashboardPage onNavigateToPeriods={() => setCurrentTab('periods')} />
      )}
      {currentTab === 'periods' && <PeriodsPage />}
      {currentTab === 'calendar' && <CalendarPage />}
      {currentTab === 'analytics' && <AnalyticsPage />}
      {currentTab === 'settings' && <SettingsPage />}
      {currentTab === 'admin' && <AdminPage />}
    </AppLayout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </QueryClientProvider>
  );
}
