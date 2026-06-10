import { useEffect, useState, useRef } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import ToastContainer from './ToastContainer';
import { I18nProvider } from '../i18n';
import { ToastProvider, useToast } from '../hooks/useToast';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/api';

const POLL_MS = 30000;

function NotificationPoller() {
  const token = useAuthStore((s) => s.djangoToken);
  const toast = useToast();
  const lastSeen = useRef<string | null>(sessionStorage.getItem('last_notif_at'));

  useEffect(() => {
    if (!token) return;

    const poll = async () => {
      try {
        const data: any = await api.get('/api/notifications/');
        const notifs: any[] = Array.isArray(data) ? data : data?.results || [];
        if (notifs.length === 0) return;

        const latestCreated = notifs[0].created_at;
        if (latestCreated === lastSeen.current) return;

        const newOnes = lastSeen.current
          ? notifs.filter(
              (n: any) =>
                n.type === 'ftl_new_alert' &&
                n.is_global &&
                new Date(n.created_at) > new Date(lastSeen.current!)
            )
          : [];

        for (const n of newOnes.reverse()) {
          toast.info(n.title);
        }

        lastSeen.current = latestCreated;
        sessionStorage.setItem('last_notif_at', latestCreated);
      } catch {
        // silent
      }
    };

    poll();
    const interval = setInterval(poll, POLL_MS);
    return () => clearInterval(interval);
  }, [token, toast]);

  return null;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Theme is initialized in index.html <head> to prevent flash.
  // This effect is just a safety net for SPA route changes.
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const wantsDark = saved === 'dark';
    if (wantsDark) document.documentElement.classList.add('dark');
  }, []);

  return (
    <I18nProvider>
      <ToastProvider>
        <NotificationPoller />
        <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 overflow-hidden">
          <Sidebar
            mobileOpen={mobileOpen}
            onMobileClose={() => setMobileOpen(false)}
          />
          <div className="flex-1 flex flex-col min-w-0">
            <Header onMenuClick={() => setMobileOpen(true)} />
            <main className="flex-1 overflow-y-auto px-4 lg:px-8 py-4 lg:py-6">
              {children}
            </main>
          </div>
          <ToastContainer />
        </div>
      </ToastProvider>
    </I18nProvider>
  );
}
