import { Target, CheckCircle2, Calendar, TrendingUp } from 'lucide-react';

export default function App() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full border border-zinc-800 rounded-xl p-8 bg-zinc-900/60 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">LOCKIN</h1>
            <p className="text-xs text-zinc-400">Consistency over perfection</p>
          </div>
        </div>

        <p className="text-sm text-zinc-300 mb-6 leading-relaxed">
          Foundation initialized. Ready for habit tracking, customizable tracking periods, and consistency analytics.
        </p>

        <div className="space-y-3 pt-2 border-t border-zinc-800/80">
          <div className="flex items-center gap-3 text-xs text-zinc-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Database migrations verified in PostgreSQL</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-400">
            <Calendar className="w-4 h-4 text-emerald-500" />
            <span>Period & Habit schema configured</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-400">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span>Spring Boot 3.3 API ready</span>
          </div>
        </div>
      </div>
    </main>
  );
}
