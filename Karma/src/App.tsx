import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PublicLayout from './components/PublicLayout';
import ProtectedLayout from './components/ProtectedLayout';
import AuthLayout from './components/AuthLayout';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import DashboardPage from './pages/DashboardPage';
import ServicesPage from './pages/ServicesPage';
import FtlPage from './pages/FtlPage';
import FtlNewPage from './pages/FtlNewPage';
import FtlDetailPage from './pages/FtlDetailPage';
import ProviderProfilePage from './pages/ProviderProfilePage';
import ProviderProfileEditPage from './pages/ProviderProfileEditPage';
import BookingsPage from './pages/BookingsPage';
import MessagesPage from './pages/MessagesPage';
import KarmaPage from './pages/KarmaPage';
import NotificationsPage from './pages/NotificationsPage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import VerifyIdentityPage from './pages/VerifyIdentityPage';
import CompleteProfilePage from './pages/CompleteProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import TermsAndConditionsPage from './pages/TermsAndConditionsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth pages — no sidebar */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/terms-of-service" element={<TermsOfServicePage />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} />
        </Route>

        {/* Public pages — sidebar visible, no auth required */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/ftl" element={<FtlPage />} />
          <Route path="/ftl/:id" element={<FtlDetailPage />} />
          <Route path="/providers/:id" element={<ProviderProfilePage />} />
          <Route path="/karma" element={<KarmaPage />} />
        </Route>

        {/* Protected pages — auth required */}
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/ftl/new" element={<FtlNewPage />} />
          <Route path="/bookings" element={<BookingsPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/messages/:bookingId" element={<MessagesPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/edit" element={<ProviderProfileEditPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/verify-identity" element={<VerifyIdentityPage />} />
          <Route path="/complete-profile" element={<CompleteProfilePage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
