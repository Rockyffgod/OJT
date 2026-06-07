import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { djangoToken, user, fetchProfile, isInitialized, setInitialized } = useAuthStore();
  const [checking, setChecking] = useState(!isInitialized);

  useEffect(() => {
    if (isInitialized) return;
    
    const initializeAuth = async () => {
      if (djangoToken && user) {
        try {
          await fetchProfile(user.id);
        } catch (e) {
          console.error('Failed to restore user profile:', e);
        }
      }
      setInitialized(true);
      setChecking(false);
    };

    initializeAuth();
  }, [isInitialized, djangoToken, user, fetchProfile, setInitialized]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 size={32} className="animate-spin text-violet-600" />
      </div>
    );
  }

  if (!djangoToken) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
