import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCheck, Bell, Globe, User, Package, Cat, Car } from 'lucide-react';
import { api } from '../lib/api';
import { useTrans } from '../i18n';
import { useToast } from '../hooks/useToast';

const ftlTypeMeta: Record<string, { Icon: any; color: string }> = {
  PERSON: { Icon: User, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  PET: { Icon: Cat, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  ITEM: { Icon: Package, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  VEHICLE: { Icon: Car, color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' },
};

export default function NotificationsPage() {
  const { t, isNp } = useTrans();
  const toast = useToast();
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState<any[]>([]);

  const fetch = async () => {
    try {
      const data: any = await api.get('/api/notifications/');
      setNotifs(Array.isArray(data) ? data : data?.results || []);
    } catch {
      setNotifs([]);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  const markAllRead = async () => {
    try {
      await api.post('/api/notifications/read-all/', {});
      await fetch();
      toast.success(t('notif.markAllRead'));
    } catch {
      toast.error(t('toast.networkError'));
    }
  };

  const handleClick = async (n: any) => {
    if (!n.is_global && !n.read_at) {
      try {
        await api.patch(`/api/notifications/${n.id}/read/`, {});
        setNotifs((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x))
        );
      } catch (e) {
        console.error('Mark read failed:', e);
      }
    }
    if (n.link) navigate(n.link);
  };

  const isRead = (n: any) => n.is_global || !!n.read_at;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
            <Bell size={20} className="text-violet-600 dark:text-violet-400" />
          </div>
          <h1 className="text-2xl font-bold font-heading text-slate-900 dark:text-slate-100">
            {t('nav.notifications')}
          </h1>
        </div>
        {notifs.length > 0 && (
          <button
            onClick={markAllRead}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-smooth"
          >
            <CheckCheck size={16} /> {t('notif.markAllRead')}
          </button>
        )}
      </div>

      {notifs.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <Bell size={36} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">{t('notif.empty')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifs.map((n) => {
            const read = isRead(n);
            const ftlMeta = n.type === 'ftl_new_alert'
              ? ftlTypeMeta[n.data?.ftl_type]
              : null;

            return (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full text-left bg-white dark:bg-slate-800 rounded-xl border p-4 transition-smooth ${
                  read
                    ? 'border-slate-200 dark:border-slate-700'
                    : 'border-l-4 border-l-violet-500 border-slate-200 dark:border-slate-700'
                } hover:bg-slate-50 dark:hover:bg-slate-800/50`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {n.is_global && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                          <Globe size={10} />
                          {t('notif.global')}
                        </span>
                      )}
                      {ftlMeta && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${ftlMeta.color}`}>
                          <ftlMeta.Icon size={10} />
                          {n.data?.ftl_type === 'PERSON'
                            ? t('ftl.missingPerson')
                            : n.data?.ftl_type === 'PET'
                            ? t('ftl.lostPet')
                            : n.data?.ftl_type === 'VEHICLE'
                            ? t('ftl.filterVehicle')
                            : t('ftl.lostItem')}
                        </span>
                      )}
                      {n.data?.image_url && (
                        <img
                          src={n.data.image_url}
                          alt=""
                          className="w-8 h-8 rounded-md object-cover border border-slate-200 dark:border-slate-700"
                        />
                      )}
                    </div>
                    <p
                      className={`text-sm ${read ? 'font-normal text-slate-700 dark:text-slate-300' : 'font-semibold text-slate-900 dark:text-slate-100'}`}
                    >
                      {n.title || n.body || (isNp ? 'सूचना' : 'Notification')}
                    </p>
                    {n.title && n.body && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{n.body}</p>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">
                    {new Date(n.created_at).toLocaleDateString()}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
