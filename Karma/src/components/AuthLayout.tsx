import { useEffect } from 'react';
import { I18nProvider } from '../i18n';
import { ToastProvider } from '../hooks/useToast';
import ToastContainer from './ToastContainer';
import { Outlet } from 'react-router-dom';
import { useTrans } from '../i18n';
import { Sparkles } from 'lucide-react';

function AuthHeader() {
  const { logo, isNp } = useTrans();
  return (
    <header className="absolute top-0 left-0 right-0 p-4 z-10">
      <div className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-200 select-none">
        <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
          <Sparkles size={16} className="text-white" />
        </div>
        <span className={`font-bold text-violet-600 dark:text-violet-400 ${
          isNp 
            ? 'font-ne tracking-wider text-xl' 
            : 'font-heading tracking-widest text-lg font-extrabold'
        }`}>{logo}</span>
      </div>
    </header>
  );
}

export default function AuthLayout({ children }: { children?: React.ReactNode }) {
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') document.documentElement.classList.add('dark');
  }, []);
  return (
    <I18nProvider>
      <ToastProvider>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
          <AuthHeader />
          {children || <Outlet />}
          <ToastContainer />
        </div>
      </ToastProvider>
    </I18nProvider>
  );
}
