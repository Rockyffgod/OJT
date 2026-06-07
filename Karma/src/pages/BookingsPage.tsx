import { useState, useEffect } from 'react';
import { X, Check, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/api';
import { useTrans } from '../i18n';
import { useToast } from '../hooks/useToast';

const STATUS_STYLES: Record<string, string> = {
  REQUESTED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  CONFIRMED: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  IN_PROGRESS: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  CANCELLED: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  DISPUTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

export default function BookingsPage() {
  const { profile } = useAuthStore();
  const { t, isNp } = useTrans();
  const toast = useToast();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    if (!profile?.id) {
      setBookings([]);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/api/bookings/');
      setBookings(Array.isArray(res) ? res : res?.results || []);
    } catch (e) {
      console.error(e);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, [profile?.id]);

  const updateStatus = async (id: string, newStatus: string, successKey: string) => {
    setActing(id);
    try {
      await api.patch(`/api/bookings/${id}/`, { status: newStatus });
      toast.success(t(successKey));
      await fetch();
    } catch (e: any) {
      toast.error(e?.message || t('toast.networkError'));
    } finally {
      setActing(null);
    }
  };

  if (loading) return <div className="text-center py-20 text-slate-500">{t('common.loading')}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold font-heading text-slate-900 dark:text-slate-100 mb-6">
        {t('nav.bookings')}
      </h1>

      {bookings.length === 0 ? (
        <div className="text-center py-20 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          {t('dashboard.noBookings')}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left px-5 py-3 font-medium text-slate-500 dark:text-slate-400">{isNp ? 'विवरण' : 'Description'}</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-500 dark:text-slate-400">{isNp ? 'मूल्य' : 'Price'}</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-500 dark:text-slate-400">{isNp ? 'स्थिति' : 'Status'}</th>
                  <th className="text-right px-5 py-3 font-medium text-slate-500 dark:text-slate-400">{isNp ? 'कार्य' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {bookings.map((b: any) => {
                  const isCustomer = profile?.account_type === 'CUSTOMER';
                  const isProvider = profile?.account_type === 'PROVIDER';
                  const isActing = acting === b.id;
                  return (
                    <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-5 py-4 text-slate-700 dark:text-slate-300">{b.job_description?.substring(0, 50) || '—'}</td>
                      <td className="px-5 py-4 font-medium text-slate-900 dark:text-slate-100">NPR {b.agreed_price || '—'}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[b.status] || ''}`}>{b.status}</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          {isCustomer && (b.status === 'REQUESTED' || b.status === 'CONFIRMED') && (
                            <button onClick={() => updateStatus(b.id, 'CANCELLED', 'booking.bookingCancelled')} disabled={isActing}
                              className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-smooth disabled:opacity-50">
                              {isActing ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                              {t('booking.cancel')}
                            </button>
                          )}
                          {isProvider && b.status === 'REQUESTED' && (
                            <>
                              <button onClick={() => updateStatus(b.id, 'CONFIRMED', 'booking.bookingAccepted')} disabled={isActing}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-medium hover:bg-violet-700 transition-smooth disabled:opacity-50">
                                <Check size={12} /> {t('booking.accept')}
                              </button>
                              <button onClick={() => updateStatus(b.id, 'CANCELLED', 'booking.bookingRejected')} disabled={isActing}
                                className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-smooth disabled:opacity-50">
                                <X size={12} /> {t('booking.reject')}
                              </button>
                            </>
                          )}
                          {isProvider && (b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS') && (
                            <button onClick={() => updateStatus(b.id, 'COMPLETED', 'booking.bookingCompleted')} disabled={isActing}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-smooth disabled:opacity-50">
                              <CheckCircle2 size={12} /> {t('booking.markComplete')}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
