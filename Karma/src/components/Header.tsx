import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, Moon, Sun, Menu, User, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useTrans } from '../i18n';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, profile, logout } = useAuthStore();
  const { t, isNp, setLang } = useTrans();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return document.documentElement.classList.contains('dark');
  });
  const [searchQuery, setSearchQuery] = useState('');
interface Suggestion {
  text: string;
  text_nepali?: string;
  icon?: string;
  type: string;
}
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const profileRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  // Click outside to close menus
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  // Fetch search suggestions
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        const resp = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/services/suggest/?q=${encodeURIComponent(q)}`
        );
        if (resp.ok) {
          const data = await resp.json();
          setSuggestions(data);
          setShowSuggestions(data.length > 0);
        }
      } catch (e) {
        console.error('Failed to fetch suggestions:', e);
      }
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const toggleLang = () => setLang(isNp ? 'en' : 'np');

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    setShowSuggestions(false);
    navigate(q ? `/services?q=${encodeURIComponent(q)}` : '/services');
  };

  const onLogout = async () => {
    setShowProfileMenu(false);
    await logout();
    navigate('/');
  };

  const avatarInitial = profile?.full_name?.charAt(0)?.toUpperCase() || '';

  return (
    <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 lg:px-6 flex-shrink-0 z-30">
      <div className="flex items-center gap-3 flex-1 min-w-0 relative" ref={searchContainerRef}>
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-smooth"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <form onSubmit={onSearchSubmit} className="flex-1 flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg max-w-md relative">
          <Search size={16} className="text-slate-400 flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            placeholder={t('header.search')}
            className="bg-transparent outline-none text-sm w-full min-w-0 text-slate-700 dark:text-slate-200 placeholder-slate-400"
          />
        </form>

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 md:left-10 mt-1.5 w-full max-w-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-700">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSearchQuery(s.text);
                  setShowSuggestions(false);
                  navigate(`/services?q=${encodeURIComponent(s.text)}`);
                }}
                className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-3 transition-smooth text-sm"
              >
                <span className="text-lg shrink-0">{s.icon || '💼'}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                    {isNp && s.text_nepali ? s.text_nepali : s.text}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 capitalize">
                    {s.type}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 lg:gap-2 flex-shrink-0">
        <button
          onClick={() => setDark(!dark)}
          className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-smooth"
          aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={dark ? 'Light mode' : 'Dark mode'}
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button
          onClick={toggleLang}
          className="px-2 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-smooth"
          aria-label="Toggle language"
        >
          {isNp ? 'EN' : 'NP'}
        </button>

        {user && (
          <Link
            to="/notifications"
            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-smooth relative"
            aria-label="Notifications"
          >
            <Bell size={18} />
          </Link>
        )}

        {user ? (
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfileMenu((v) => !v)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-smooth"
              aria-label="Profile menu"
            >
              <div className="w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0 overflow-hidden">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile?.full_name || 'avatar'}
                    className="w-full h-full object-cover"
                  />
                ) : avatarInitial ? (
                  avatarInitial
                ) : (
                  <User size={16} />
                )}
              </div>
            </button>
            {showProfileMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm z-20 py-1">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {profile?.full_name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {profile?.email}
                  </p>
                </div>
                <Link
                  to="/profile"
                  onClick={() => setShowProfileMenu(false)}
                  className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  {t('nav.profile')}
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  {t('nav.settings')}
                </Link>
                <button
                  onClick={onLogout}
                  className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <LogOut size={14} />
                  {t('nav.logout')}
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            to="/login"
            className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-smooth"
          >
            {t('nav.login')}
          </Link>
        )}
      </div>
    </header>
  );
}
