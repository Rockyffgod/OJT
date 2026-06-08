import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  Wrench, Calendar, MessageSquare, ArrowRight,
  Star, Bell, Sparkles, Package, Heart, Trophy, Medal, Award
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useTrans, translateName, translateProfession } from '../i18n';
import { api } from '../lib/api';
import { transliterateName } from '../utils/nepaliTranslate';

const QUICK_ACTIONS = [
  {
    to: '/services',
    icon: Wrench,
    bgClass: 'bg-violet-50 dark:bg-violet-900/20',
    iconClass: 'text-violet-600 dark:text-violet-400',
    titleKey: 'home.browseServices',
    subKey: 'dashboard.findServicesSub',
  },
  {
    to: '/bookings',
    icon: Calendar,
    bgClass: 'bg-emerald-50 dark:bg-emerald-900/20',
    iconClass: 'text-emerald-600 dark:text-emerald-400',
    titleKey: 'home.viewBookings',
    subKey: 'dashboard.myBookingsSub',
  },
  {
    to: '/messages',
    icon: MessageSquare,
    bgClass: 'bg-violet-50 dark:bg-violet-900/20',
    iconClass: 'text-violet-600 dark:text-violet-400',
    titleKey: 'nav.messages',
    subKey: 'dashboard.messagesSub',
  },
  {
    to: '/ftl',
    icon: Package,
    bgClass: 'bg-amber-50 dark:bg-amber-900/20',
    iconClass: 'text-amber-600 dark:text-amber-400',
    titleKey: 'home.lostFound',
    subKey: 'dashboard.ftlSub',
  },
];

const SERVICES = [
  { img: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=200&q=80', name: 'Electrician', rating: 4.8, reviews: 120, price: 'Rs. 500 - 800' },
  { img: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=200&q=80', name: 'Plumber', rating: 4.7, reviews: 98, price: 'Rs. 700 - 1200' },
  { img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=80', name: 'Home Cleaning', rating: 4.6, reviews: 76, price: 'Rs. 1000 - 2000' },
  { img: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=200&q=80', name: 'Painter', rating: 4.6, reviews: 65, price: 'Rs. 800 - 1500' },
];

const BOOKINGS = [
  { icon: '🏠', title: 'Home Cleaning', date: 'June 6, 2025 • 10:00 AM', status: 'Confirmed', statusClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  { icon: '🔧', title: 'Plumber', date: 'June 7, 2025 • 2:00 PM', status: 'Pending', statusClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  { icon: '⚡', title: 'Electrician', date: 'June 8, 2025 • 11:00 AM', status: 'Completed', statusClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
];

const NOTIFICATIONS = [
  { icon: Calendar, iconClass: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300', textKey: 'dashboard.notifBookingConfirmed', time: '2 min ago' },
  { icon: MessageSquare, iconClass: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300', textKey: 'dashboard.notifNewMessage', time: '15 min ago' },
  { icon: Star, iconClass: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300', textKey: 'dashboard.notifKarmaPoints', time: '1 hour ago' },
  { icon: Package, iconClass: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300', textKey: 'dashboard.notifFtlMatch', time: '2 hours ago' },
];

const LEVEL_COLORS: Record<string, string> = {
  NONE: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  BRONZE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  SILVER: 'bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-200',
  GOLD: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  PLATINUM: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
};

const STATIC_KARMA = [
  { id: 'demo-k1', profession: 'Electrician', karma_points: 2450, karma_level: 'PLATINUM', average_rating: 4.9, profiles: { full_name: 'Ram Bahadur Thapa', avatar_url: null } },
  { id: 'demo-k2', profession: 'Home Cleaning', karma_points: 1890, karma_level: 'GOLD', average_rating: 4.9, profiles: { full_name: 'Sita Gurung', avatar_url: null } },
  { id: 'demo-k3', profession: 'Plumber', karma_points: 1340, karma_level: 'GOLD', average_rating: 4.7, profiles: { full_name: 'Bikash Shrestha', avatar_url: null } },
];

export default function DashboardPage() {
  const { user, profile } = useAuthStore();
  const { t, isNp } = useTrans();
  const [topProviders, setTopProviders] = useState<any[]>([]);

  useEffect(() => {
    const fetchTop = async () => {
      try {
        const res = await api.get('/api/karma/leaderboard/');
        const list = Array.isArray(res) ? res : (res.results || []);
        const mapped = list.map((p: any) => ({
          id: p.id,
          profession: p.profession,
          karma_level: p.karma_level,
          karma_points: p.karma_points,
          profiles: {
            full_name: p.user_name || 'Provider',
            avatar_url: p.user_photo || null,
          }
        }));
        setTopProviders(mapped.length > 0 ? mapped.slice(0, 3) : STATIC_KARMA);
      } catch (err) {
        setTopProviders(STATIC_KARMA);
      }
    };
    fetchTop();
  }, []);

  const getGreetingName = () => {
    if (profile?.full_name) {
      return profile.full_name.split(' ')[0];
    }
    if (user?.email) {
      const parts = user.email.split('@')[0].split(/[^a-zA-Z]/);
      const name = parts[0] || 'User';
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return 'Guest';
  };

  const firstName = getGreetingName();
  const displayName = isNp ? transliterateName(firstName) : firstName;

  return (
    <div className="pb-8 space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-heading flex items-center gap-2 mb-1">
          {t('dashboard.greeting').replace('{name}', displayName)}
          <span className="inline-block" aria-hidden="true">👋</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">{t('dashboard.whatToday')}</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {QUICK_ACTIONS.map((a) => {
          const Icon = a.icon;
          return (
            <Link
              key={a.to}
              to={a.to}
              className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3 transition-smooth hover:shadow-sm group"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${a.bgClass}`}>
                  <Icon size={20} className={a.iconClass} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{t(a.titleKey)}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{t(a.subKey)}</p>
                </div>
              </div>
              <ArrowRight
                size={16}
                className="text-slate-300 dark:text-slate-600 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-smooth flex-shrink-0"
              />
            </Link>
          );
        })}
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Popular Services */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900 dark:text-slate-100 font-heading">{t('dashboard.popularServices')}</h2>
              <Link to="/services" className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline">
                {t('dashboard.viewAll')}
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SERVICES.map((s) => (
                <Link
                  key={s.name}
                  to={`/services?q=${encodeURIComponent(s.name)}`}
                  className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden transition-smooth hover:shadow-sm cursor-pointer group block"
                >
                  <img
                    src={s.img}
                    alt={s.name}
                    className="w-full h-24 object-cover transition-smooth group-hover:opacity-90"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.background = '#E5E7EB';
                    }}
                  />
                  <div className="p-3">
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-xs truncate">{s.name}</h4>
                    <div className="flex items-center gap-1 text-[11px] text-amber-500 font-medium mt-1">
                      <Star size={11} className="fill-current" />
                      <span>{s.rating}</span>
                      <span className="text-slate-400 dark:text-slate-500">({s.reviews})</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 font-medium">{s.price}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Top Rated Providers Leaderboard */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-slate-900 dark:text-slate-100 font-heading">
                  {t('dashboard.topProviders')}
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {t('dashboard.staticNotice')}
                </p>
              </div>
              <Link to="/karma" className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1">
                Leaderboard <ArrowRight size={12} />
              </Link>
            </div>
            <div className="space-y-3">
              {topProviders.map((p, i) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-700 hover:shadow-sm transition-smooth"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 flex-shrink-0 font-bold">
                      {i === 0 ? (
                        <Trophy size={16} className="text-amber-500 fill-amber-500" />
                      ) : i === 1 ? (
                        <Medal size={16} className="text-slate-400 fill-slate-400" />
                      ) : (
                        <Medal size={16} className="text-amber-600 fill-amber-600" />
                      )}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 font-semibold overflow-hidden flex-shrink-0">
                      {p.profiles?.avatar_url ? (
                        <img src={p.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (p.profiles?.full_name || 'P').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {translateName(p.profiles?.full_name || '', isNp) || 'Provider'}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{p.profession || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${
                        LEVEL_COLORS[p.karma_level || 'NONE']
                      }`}
                    >
                      {p.karma_level || 'NONE'}
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {p.karma_points || 0} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Upcoming Bookings */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900 dark:text-slate-100 font-heading">{t('dashboard.upcomingBookings')}</h2>
              <Link to="/bookings" className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline">
                {t('dashboard.viewAll')}
              </Link>
            </div>
            <div className="space-y-4">
              {BOOKINGS.map((b, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between gap-3 ${
                    i < BOOKINGS.length - 1 ? 'pb-4 border-b border-slate-100 dark:border-slate-700' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center border border-slate-200 dark:border-slate-600 text-sm flex-shrink-0">
                      <span aria-hidden="true">{b.icon}</span>
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{b.title}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{b.date}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${b.statusClass}`}>
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Notifications */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900 dark:text-slate-100 font-heading">{t('dashboard.recentNotifications')}</h2>
              <Link to="/notifications" className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline inline-flex items-center gap-1">
                <Bell size={12} />
                {t('dashboard.viewAll')}
              </Link>
            </div>
            <div className="space-y-4">
              {NOTIFICATIONS.map((n, i) => {
                const Icon = n.icon;
                return (
                  <div
                    key={i}
                    className={`flex items-start justify-between gap-3 ${
                      i < NOTIFICATIONS.length - 1 ? 'pb-4 border-b border-slate-100 dark:border-slate-700' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${n.iconClass}`}>
                        <Icon size={14} />
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-snug">
                        {t(n.textKey)}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap pt-0.5">
                      {n.time}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <footer className="text-center pt-6 mt-6 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-400 dark:text-slate-500 font-medium">
        © 2026 Karma. {t('dashboard.allRightsReserved')}
      </footer>
    </div>
  );
}
