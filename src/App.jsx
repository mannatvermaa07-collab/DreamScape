import { Routes, Route, Navigate } from 'react-router-dom';
import { useTheme } from './hooks/useTheme';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProtectedLayout } from './components/layout/ProtectedLayout';
import { DashboardPage } from './pages/DashboardPage';
import { HabitsPage } from './pages/HabitsPage';
import { JournalPage } from './pages/JournalPage';
import { CalendarPage } from './pages/CalendarPage';
import { ChatbotPage } from './pages/ChatbotPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
  // Runs once at the app root so the stored theme (localStorage or user
  // settings) is applied to <html data-theme="..."> no matter which route
  // is loaded first — visiting /register or /app/dashboard directly still
  // gets the right theme, not just the landing page.
  useTheme();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected App Layout & Sub-routes */}
      <Route path="/app" element={<ProtectedLayout />}>
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="habits" element={<HabitsPage />} />
        <Route path="journal" element={<JournalPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="chatbot" element={<ChatbotPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}