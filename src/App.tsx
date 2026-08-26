import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './authStore';
import { useStore } from './store';
import Shell from './components/layout/Shell';
import LoginPage from './pages/LoginPage';
import HomeScreen from './pages/HomeScreen';
import ProgressPage from './pages/ProgressPage';
import CalendarPage from './pages/CalendarPage';
import PracticePage from './pages/PracticePage';
import TopicBankPage from './pages/TopicBankPage';
import SettingsPage from './pages/SettingsPage';
import ResultPage from './pages/ResultPage';
import ReportPage from './pages/ReportPage';
import FamilyDashboardPage from './pages/FamilyDashboardPage';
import FamilyMemberPage from './pages/FamilyMemberPage';
import FamilyMemberResultPage from './pages/FamilyMemberResultPage';
import { isSupabaseConfigured } from './lib/supabaseClient';

function ConfigMissing() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-center text-zinc-400">
      <div>
        <p className="text-lg font-semibold text-white">Supabase isn't configured yet</p>
        <p className="mt-2 max-w-md text-sm">
          Add <code className="text-violet-300">VITE_SUPABASE_URL</code> and{' '}
          <code className="text-violet-300">VITE_SUPABASE_ANON_KEY</code> to <code>.env.local</code>, then
          restart the dev server. See README.md.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const init = useAuthStore((s) => s.init);
  const initialized = useAuthStore((s) => s.initialized);
  const user = useAuthStore((s) => s.user);
  const loadForUser = useStore((s) => s.loadForUser);
  const resetData = useStore((s) => s.reset);

  useEffect(() => {
    if (isSupabaseConfigured) init();
  }, [init]);

  useEffect(() => {
    if (user) loadForUser(user.id);
    else resetData();
  }, [user, loadForUser, resetData]);

  if (!isSupabaseConfigured) return <ConfigMissing />;

  if (!initialized) {
    return <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-500">Loading Speak60…</div>;
  }

  if (!user) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Shell />}>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/practice" element={<PracticePage />} />
          <Route path="/topics" element={<TopicBankPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/result/:id" element={<ResultPage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/family" element={<FamilyDashboardPage />} />
          <Route path="/family/:userId" element={<FamilyMemberPage />} />
          <Route path="/family/:userId/result/:id" element={<FamilyMemberResultPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
