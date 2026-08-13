import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useEffect } from 'react';
import { AppShell, AuthGate } from './components/layout';
import { LoginPage, RegisterPage, ForgotPasswordPage } from './pages/auth';
import { LandingPage } from './pages/landing';
import { DashboardPage } from './pages/dashboard';
import { CourseDetailPage, CoursesPage } from './pages/courses';
import { LessonPage } from './pages/lesson';
import { CharactersPage, GrammarPage, RadicalsPage, ReviewPage, SkillPage, VocabularyPage } from './pages/learning';
import { HskPage, NotebookPage, NotificationsPage, SearchPage, SettingsPage } from './pages/misc';
import { LeaderboardPage, ProfilePage, StatisticsPage } from './pages/progress';
import { AdminCoursesPage, AdminHskPage, AdminLessonContentPage, AdminLessonsContentTreePage, AdminNotificationsPage, AdminPage, AdminStatisticsPage, AdminUsersPage, AdminVocabularyPage } from './pages/admin';
import { NotFoundPage } from './components/states';
import { useAuthStore } from './stores/auth.store';

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } } });

function Bootstrap() {
  const bootstrap = useAuthStore((state) => state.bootstrap);
  useEffect(() => { void bootstrap(); }, [bootstrap]);
  return <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route element={<AuthGate><AppShell /></AuthGate>}>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/courses" element={<CoursesPage />} />
      <Route path="/courses/:slug" element={<CourseDetailPage />} />
      <Route path="/lessons/:id" element={<LessonPage />} />
      <Route path="/vocabulary" element={<VocabularyPage />} />
      <Route path="/my-vocabulary" element={<VocabularyPage />} />
      <Route path="/review" element={<ReviewPage />} />
      <Route path="/listening" element={<SkillPage type="listening" />} />
      <Route path="/speaking" element={<SkillPage type="speaking" />} />
      <Route path="/speaking/conversation" element={<SkillPage type="speaking" />} />
      <Route path="/reading" element={<SkillPage type="reading" />} />
      <Route path="/writing" element={<SkillPage type="writing" />} />
      <Route path="/characters" element={<CharactersPage />} />
      <Route path="/radicals" element={<RadicalsPage />} />
      <Route path="/grammar" element={<GrammarPage />} />
      <Route path="/hsk" element={<HskPage />} />
      <Route path="/hsk/:level" element={<HskPage />} />
      <Route path="/statistics" element={<StatisticsPage />} />
      <Route path="/leaderboard" element={<LeaderboardPage />} />
      <Route path="/notebook" element={<NotebookPage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/admin/users" element={<AdminUsersPage />} />
      <Route path="/admin/courses" element={<AdminCoursesPage />} />
      <Route path="/admin/lessons" element={<AdminLessonsContentTreePage />} />
      <Route path="/admin/lessons/:id/content" element={<AdminLessonContentPage />} />
      <Route path="/admin/vocabulary" element={<AdminVocabularyPage />} />
      <Route path="/admin/hsk" element={<AdminHskPage />} />
      <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
      <Route path="/admin/statistics" element={<AdminStatisticsPage />} />
    </Route>
    <Route path="/home" element={<Navigate to="/dashboard" replace />} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes>;
}

export default function App() {
  return <QueryClientProvider client={queryClient}><BrowserRouter><Bootstrap /></BrowserRouter></QueryClientProvider>;
}
