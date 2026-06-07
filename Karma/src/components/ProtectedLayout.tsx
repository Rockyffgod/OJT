import { Outlet } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import PublicLayout from './PublicLayout';

export default function ProtectedLayout({ children }: { children?: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <PublicLayout>{children || <Outlet />}</PublicLayout>
    </ProtectedRoute>
  );
}
