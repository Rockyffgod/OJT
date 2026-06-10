import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import PublicLayout from './PublicLayout';
import { useLocationStore } from '../store/locationStore';

export default function ProtectedLayout({ children }: { children?: React.ReactNode }) {
  const startTracking = useLocationStore((s) => s.startTracking);
  const stopTracking = useLocationStore((s) => s.stopTracking);

  useEffect(() => {
    startTracking();
    return () => stopTracking();
  }, [startTracking, stopTracking]);

  return (
    <ProtectedRoute>
      <PublicLayout>{children || <Outlet />}</PublicLayout>
    </ProtectedRoute>
  );
}
