import { useState, useEffect } from 'react';
import { Check, X, Shield, AlertCircle } from 'lucide-react';
import { useTrans } from '../i18n';
import { useToast } from '../hooks/useToast';
import { api } from '../lib/api';

const STATUS_STYLES: Record<string, string> = {
  REQUESTED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  CONFIRMED: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  IN_PROGRESS: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  CANCELLED: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  DISPUTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  APPROVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  VERIFIED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  SUBMITTED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
};

export default function AdminPage() {
  const { t, isNp } = useTrans();
  const toast = useToast();
  const [tab, setTab] = useState<'users' | 'providers' | 'bookings'>('users');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      let result: any;
      if (tab === 'users') {
        result = await api.get('/api/admin/users/');
      } else if (tab === 'providers') {
        result = await api.get('/api/admin/providers/');
      } else {
        result = await api.get('/api/admin/bookings/');
      }
      setData(Array.isArray(result) ? result : result?.results || []);
    } catch (e) {
      console.error('Admin fetch error:', e);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [tab]);

  const tabs = [
    { key: 'users', label: isNp ? 'प्रयोगकर्ताहरू' : 'Users' },
    { key: 'providers', label: isNp ? 'प्रदायकहरू' : 'Providers' },
    { key: 'bookings', label: isNp ? 'बुकिङहरू' : 'Bookings' },
  ];

  const approveProvider = async (userId: string) => {
    setActing(userId);
    try {
      await api.patch(`/api/admin/users/${userId}/verify/`, { verification_status: 'APPROVED' });
      toast.success(t('toast.saved'));
      await fetchData();
    } catch (e: any) {
      toast.error(e?.message || t('toast.networkError'));
    } finally {
      setActing(null);
    }
  };

  const suspendProvider = async (userId: string) => {
    setActing(userId);
    try {
      await api.patch(`/api/admin/providers/${userId}/suspend/`, { is_available: false });
      toast.success(t('toast.saved'));
      await fetchData();
    } catch (e: any) {
      toast.error(e?.message || t('toast.networkError'));
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
          <Shield size={20} className="text-violet-600 dark:text-violet-400" />
        </div>
        <h1 className="text-2xl font-bold font-heading text-slate-900 dark:text-slate-100">
          {t('nav.admin')}
        </h1>
      </div>

      <div className="flex gap-2">
        {tabs.map((tabItem) => (
          <button
            key={tabItem.key}
            onClick={() => setTab(tabItem.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-smooth ${
              tab === tabItem.key
                ? 'bg-violet-600 text-white'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            {tabItem.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-slate-400">{t('common.loading')}</div>
        ) : data.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle size={32} className="text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-slate-500 dark:text-slate-400 text-sm">{t('notif.empty')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  {tab === 'users' && (
                    <>
                      <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Name</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Email</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Type</th>
                    </>
                  )}
                  {tab === 'providers' && (
                    <>
                      <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Name</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Profession</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Karma</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Verification</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Available</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-500 dark:text-slate-400">Actions</th>
                    </>
                  )}
                  {tab === 'bookings' && (
                    <>
                      <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Description</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Price</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Status</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {tab === 'users' &&
                  data.map((u: any) => (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 text-slate-900 dark:text-slate-100 font-medium">
                        {u.full_name || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{u.email || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {u.account_type}
                        </span>
                      </td>
                    </tr>
                  ))}
                {tab === 'providers' &&
                  data.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 text-slate-900 dark:text-slate-100 font-medium">
                        {p.user_name || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                        {p.profession || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-900 dark:text-slate-100 font-semibold">
                        {p.karma_points || 0}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            STATUS_STYLES[p.verification_status] || 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {p.verification_status || 'PENDING'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            p.is_available
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {p.is_available ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {p.verification_status !== 'APPROVED' && (
                            <button
                              onClick={() => approveProvider(p.user_id)}
                              disabled={acting === p.user_id}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-violet-600 text-white rounded-md text-xs font-medium hover:bg-violet-700 transition-smooth disabled:opacity-50"
                            >
                              <Check size={12} /> Approve
                            </button>
                          )}
                          {p.is_available && (
                            <button
                              onClick={() => suspendProvider(p.user_id)}
                              disabled={acting === p.user_id}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-md text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-smooth disabled:opacity-50"
                            >
                              <X size={12} /> Suspend
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                {tab === 'bookings' &&
                  data.map((b: any) => (
                    <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 text-slate-900 dark:text-slate-100">
                        {b.job_description?.substring(0, 50) || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium">
                        NPR {b.agreed_price || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            STATUS_STYLES[b.status] || 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
