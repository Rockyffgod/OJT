import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, MapPin, Search, Package, Cat, User, Car, ImageOff, ArrowRight, Loader2 } from 'lucide-react';
import type { FtlAlert, FtlType, FtlStatus } from '../lib/types';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useTrans } from '../i18n';

type FilterType = 'ALL' | FtlType;

const typeMeta: Record<FtlType, { labelKey: string; color: string; Icon: any }> = {
  PERSON: { labelKey: 'nav.notifications', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', Icon: User },
  PET: { labelKey: 'ftl.lostPet', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', Icon: Cat },
  ITEM: { labelKey: 'ftl.lostItem', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', Icon: Package },
  VEHICLE: { labelKey: 'ftl.filterVehicle', color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300', Icon: Car },
};

const statusMeta: Record<FtlStatus, { labelKey: string; color: string }> = {
  OPEN: { labelKey: 'ftl.open', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  MATCHED: { labelKey: 'ftl.matched', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  CLOSED: { labelKey: 'ftl.closed', color: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400' },
  EXPIRED: { labelKey: 'ftl.expired', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  REMOVED: { labelKey: 'ftl.expired', color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300' },
};

const filterPills: { key: FilterType; labelKey: string }[] = [
  { key: 'ALL', labelKey: 'ftl.filterAll' },
  { key: 'PERSON', labelKey: 'ftl.filterPerson' },
  { key: 'PET', labelKey: 'ftl.filterPet' },
  { key: 'ITEM', labelKey: 'ftl.lostItem' },
  { key: 'VEHICLE', labelKey: 'ftl.filterVehicle' },
];

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(hours / 24);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function FtlPage() {
  const { t } = useTrans();
  const { user } = useAuthStore();
  const [alerts, setAlerts] = useState<FtlAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('ALL');

  useEffect(() => {
    const fetchAlerts = async () => {
      setLoading(true);
      try {
        let path = '/api/ftl/';
        if (filter !== 'ALL') path += `?type=${filter}`;
        const res = await api.get(path);
        const list = Array.isArray(res) ? res : (res.results || []);
        const mapped = list.map((a: any) => ({ ...a, profiles: { full_name: a.user_name || 'User', avatar_url: null } }));
        setAlerts(mapped);
      } catch (e) {
        console.error('Failed to fetch FTL alerts:', e);
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, [filter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900 dark:text-slate-100">{t('ftl.title')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('ftl.subtitle')}</p>
        </div>
        {user ? (
          <Link to="/ftl/new" className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-smooth">
            <Plus size={18} /> {t('ftl.newAlert')}
          </Link>
        ) : (
          <Link to="/login" className="inline-flex items-center gap-2 px-5 py-2.5 border border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 rounded-lg text-sm font-medium hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-smooth">
            {t('ftl.signInToPost')}
          </Link>
        )}
      </div>


      {/* Filter pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {filterPills.map((p) => (
          <button key={p.key} onClick={() => setFilter(p.key)}
            className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-smooth ${
              filter === p.key ? 'bg-violet-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}>
            {t(p.labelKey)}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex gap-4 animate-pulse">
              <div className="w-20 h-20 bg-slate-200 dark:bg-slate-700 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-3 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-700 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <Search size={40} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('ftl.empty')}</h3>
          {user && (
            <Link to="/ftl/new" className="inline-flex items-center gap-1 text-sm text-violet-600 dark:text-violet-400 font-medium hover:underline mt-2">
              {t('ftl.newAlert')} <ArrowRight size={14} />
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const tm = typeMeta[alert.type] || typeMeta.ITEM;
            const sm = statusMeta[alert.status] || statusMeta.OPEN;
            const Icon = tm.Icon;
            return (
              <Link key={alert.id} to={`/ftl/${alert.id}`}
                className="block bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex gap-4 hover:shadow-sm transition-smooth cursor-pointer">
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {alert.image_url ? <img src={alert.image_url} alt={alert.title} className="w-full h-full object-cover" /> : <ImageOff size={24} className="text-slate-300 dark:text-slate-500" />}
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1 ${tm.color}`}>
                      <Icon size={11} /> {t(tm.labelKey)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sm.color}`}>{t(sm.labelKey)}</span>
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">{alert.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{alert.description}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                    {alert.last_seen_location && <span className="inline-flex items-center gap-1"><MapPin size={11} />{alert.last_seen_location}</span>}
                    <span>·</span>
                    <span>{timeAgo(alert.created_at)}</span>
                    {(alert as any).profiles?.full_name && <><span>·</span><span>{t('ftl.postedBy')} {(alert as any).profiles.full_name}</span></>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
