import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import ToastContainer from './ToastContainer';
import { I18nProvider } from '../i18n';
import { ToastProvider } from '../hooks/useToast';

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
