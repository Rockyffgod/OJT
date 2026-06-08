import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Wrench, Calendar, MessageSquare, Heart,
  Search, User, Settings, Shield, LogOut, X, Shuffle,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useTrans } from '../i18n';

const publicNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, key: 'nav.dashboard' },
  { to: '/services', icon: Wrench, key: 'nav.services' },
  { to: '/random-match', icon: Shuffle, key: 'nav.randomMatch' },
  { to: '/ftl', icon: Search, key: 'nav.ftl' },
  { to: '/karma', icon: Heart, key: 'nav.karma' },
];

const authNavItems = [
  { to: '/bookings', icon: Calendar, key: 'nav.bookings' },
  { to: '/messages', icon: MessageSquare, key: 'nav.messages' },
];

const accountNavItems = [
  { to: '/profile', icon: User, key: 'nav.profile' },
  { to: '/settings', icon: Settings, key: 'nav.settings' },
];

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const { user, profile, logout } = useAuthStore();
  const { t, logo, isNp } = useTrans();
  const location = useLocation();

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const navLink = (item: { to: string; icon: any; key: string }) => {
    const Icon = item.icon;
    const active = isActive(item.to);
    return (
      <Link
        key={item.to}
        to={item.to}
        onClick={onMobileClose}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-smooth ${
          active
            ? 'bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
        }`}
      >
        <Icon size={18} />
        <span>{t(item.key)}</span>
      </Link>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      <div className="flex items-center justify-between px-4 h-16 border-b border-slate-200 dark:border-slate-700">
        {user ? (
          <Link to="/dashboard" onClick={onMobileClose}>
            <span className={`font-bold text-violet-600 dark:text-violet-400 ${
              isNp 
                ? 'font-ne tracking-wider text-2xl' 
                : 'font-heading tracking-widest text-xl font-extrabold'
            }`}>
              {logo}
            </span>
          </Link>
        ) : (
          <div className="select-none py-1">
            <span className={`font-bold text-violet-600 dark:text-violet-400 ${
              isNp 
                ? 'font-ne tracking-wider text-2xl' 
                : 'font-heading tracking-widest text-xl font-extrabold'
            }`}>
              {logo}
            </span>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {publicNavItems.map(navLink)}

        {user && (
          <>
            <div className="border-t border-slate-200 dark:border-slate-700 my-3" />
            {authNavItems.map(navLink)}
          </>
        )}

        {user && (
          <>
            <div className="border-t border-slate-200 dark:border-slate-700 my-3" />
            {accountNavItems.map(navLink)}
            {profile?.account_type === 'ADMIN' &&
              navLink({ to: '/admin', icon: Shield, key: 'nav.admin' })}
          </>
        )}
      </nav>

      <div className="px-3 py-4 border-t border-slate-200 dark:border-slate-700 space-y-1">
        {user ? (
          <button
            onClick={() => {
              logout();
              onMobileClose();
            }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 w-full transition-smooth"
          >
            <LogOut size={18} />
            <span>{t('nav.logout')}</span>
          </button>
        ) : (
          <>
            <Link
              to="/login"
              onClick={onMobileClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-smooth"
            >
              <LogOut size={18} />
              <span>{t('nav.login')}</span>
            </Link>
            <Link
              to="/signup"
              onClick={onMobileClose}
              className="flex items-center gap-3 px-3 py-2.5 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-smooth justify-center"
            >
              <span>{t('nav.signup')}</span>
            </Link>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      <aside
        className="hidden md:flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 transition-all duration-200 w-60 flex-shrink-0"
      >
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={onMobileClose}
            aria-hidden="true"
          />
          <aside className="relative w-72 h-full bg-white dark:bg-slate-900">
            <div className="flex items-center justify-end p-4">
              <button
                onClick={onMobileClose}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 transition-smooth"
                aria-label="Close sidebar"
              >
                <X size={22} />
              </button>
            </div>
            <div className="h-full overflow-y-auto" style={{ marginTop: '-60px' }}>
              {sidebarContent}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
