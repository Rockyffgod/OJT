import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCheck, Bell } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { useTrans } from '../i18n';
import { useToast } from '../hooks/useToast';

export default function NotificationsPage() {
  const { profile } = useAuthStore();
  const { t, isNp } = useTrans();
  const toast = useToast();
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState<any[]>([]);

  const fetch = async () => {
    if (!profile?.id) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });
    setNotifs(data || []);
  };

  useEffect(() => {
    fetch();
  }, [profile?.id]);

  const markAllRead = async () => {
    try {
      const update: any = {};
      // Try both common field names — Supabase schema may use either
      update.is_read = true;
      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', profile?.id)
        .is('read_at', null);
      await fetch();
      toast.success(t('notif.markAllRead'));
    } catch (e) {
      console.error('Mark all read failed:', e);
      toast.error(t('toast.networkError'));
    }
  };

  const handleClick = async (n: any) => {
    // Mark as read
    if (!n.is_read && !n.read_at) {
      try {
        await supabase
          .from('notifications')
          .update({ read_at: new Date().toISOString() })
          .eq('id', n.id);
        setNotifs((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x))
        );
      } catch (e) {
        console.error('Mark read failed:', e);
      }
    }
    // Navigate
    if (n.link) navigate(n.link);
  };

  const isRead = (n: any) => !!(n.is_read || n.read_at);

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
                  <div className="min-w-0">
                    <p
                      className={`text-sm ${read ? 'font-normal text-slate-700 dark:text-slate-300' : 'font-semibold text-slate-900 dark:text-slate-100'}`}
                    >
                      {n.title || n.body || (isNp ? 'सूचना' : 'Notification')}
                    </p>
                    {n.title && n.body && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{n.body}</p>
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
