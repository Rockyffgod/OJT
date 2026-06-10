/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  X, Check, CheckCircle2, Loader2, Calendar, MapPin, CreditCard,
  Navigation, Flag, UserCircle, AlertTriangle, MessageCircle,
  LocateFixed, Locate, ShieldAlert, ExternalLink, Star, MapIcon
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useLocationStore } from '../store/locationStore';
import { api } from '../lib/api';
import { useTrans } from '../i18n';
import { useToast } from '../hooks/useToast';
import BookingMap from '../components/BookingMap';

const STATUS_STYLES: Record<string, string> = {
  REQUESTED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  CONFIRMED: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  IN_PROGRESS: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  CANCELLED: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  DISPUTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

const CUSTOMER_REPORT_TYPES = ['NO_SHOW', 'POOR_SERVICE', 'OVERCHARGED', 'INAPPROPRIATE', 'SCAM'] as const;
const PROVIDER_REPORT_TYPES = ['DIDNT_PAY', 'DAMAGE_TO_PROPERTY', 'INAPPROPRIATE', 'SCAM', 'OTHER'] as const;

const REPORT_TYPE_KEYS: Record<string, string> = {
  NO_SHOW: 'booking.reportTypeNoShow',
  POOR_SERVICE: 'booking.reportTypePoorService',
  OVERCHARGED: 'booking.reportTypeOvercharged',
  INAPPROPRIATE: 'booking.reportTypeInappropriate',
  SCAM: 'booking.reportTypeScam',
  DIDNT_PAY: 'booking.reportTypeDidntPay',
  DAMAGE_TO_PROPERTY: 'booking.reportTypeDamage',
  OTHER: 'booking.reportTypeOther',
};

export default function BookingsPage() {
  const { profile } = useAuthStore();
  const { t, isNp } = useTrans();
  const toast = useToast();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [suspended, setSuspended] = useState(false);
  const [tab, setTab] = useState<'active' | 'history'>('active');

  const [sharingBookings, setSharingBookings] = useState<Set<string>>(new Set());
  const shareIntervals = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  const [mapsOpen, setMapsOpen] = useState<Set<string>>(new Set());
  const pollRefs = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());
  const [liveLocations, setLiveLocations] = useState<Map<string, any>>(new Map());

  const [reportModal, setReportModal] = useState<{ booking: any; open: boolean }>({ booking: null, open: false });
  const [reportType, setReportType] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const isCustomer = profile?.account_type === 'CUSTOMER';
  const isProvider = profile?.account_type === 'PROVIDER';

  const activeStatuses = ['REQUESTED', 'CONFIRMED', 'IN_PROGRESS'];
  const historyStatuses = ['COMPLETED', 'CANCELLED', 'DISPUTED'];

  const activeBookings = bookings.filter((b) => activeStatuses.includes(b.status));
  const historyBookings = bookings.filter((b) => historyStatuses.includes(b.status));
  const displayedBookings = tab === 'active' ? activeBookings : historyBookings;

  const loadBookings = useCallback(async () => {
    setLoading(true);
    if (!profile?.id) {
      setBookings([]);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/api/bookings/');
      setBookings(Array.isArray(res) ? res : res?.results || []);
      setSuspended(false);
    } catch (e: any) {
      if (e?.message?.includes('suspended') || e?.message?.includes('Account suspended')) {
        setSuspended(true);
      }
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => { loadBookings(); }, [loadBookings]);

  useEffect(() => {
    return () => {
      shareIntervals.current.forEach((id) => clearInterval(id));
      shareIntervals.current.clear();
      pollRefs.current.forEach((id) => clearInterval(id));
      pollRefs.current.clear();
    };
  }, []);

  const updateStatus = async (id: string, newStatus: string, successKey: string) => {
    setActing(id);
    try {
      await api.patch(`/api/bookings/${id}/`, { status: newStatus });
      toast.success(t(successKey));
      await loadBookings();
    } catch (e: any) {
      toast.error(e?.message || t('toast.networkError'));
    } finally {
      setActing(null);
    }
  };

  const startSharing = (booking: any) => {
    if (!('geolocation' in navigator)) {
      toast.error('Geolocation not supported');
      return;
    }
    const bookingId = booking.id;
    const patch = () => {
      const loc = useLocationStore.getState();
      if (loc.lat && loc.lng) {
        api.patch(`/api/bookings/${bookingId}/location/`, { lat: loc.lat, lng: loc.lng }).catch(() => {});
      }
    };
    patch();
    const interval = setInterval(patch, 10000);
    shareIntervals.current.set(bookingId, interval);
    setSharingBookings((prev) => new Set(prev).add(bookingId));
    toast.success(t('booking.sharingLocation'));
  };

  const stopSharing = (bookingId: string) => {
    const interval = shareIntervals.current.get(bookingId);
    if (interval !== undefined) {
      clearInterval(interval);
      shareIntervals.current.delete(bookingId);
    }
    setSharingBookings((prev) => {
      const next = new Set(prev);
      next.delete(bookingId);
      return next;
    });
  };

  const markArrived = async (bookingId: string) => {
    setActing(bookingId);
    try {
      await api.post(`/api/bookings/${bookingId}/arrived/`, {});
      toast.success(t('booking.arrived'));
      await loadBookings();
    } catch (e: any) {
      toast.error(e?.message || t('toast.networkError'));
    } finally {
      setActing(null);
    }
  };

  const toggleMap = (bookingId: string) => {
    setMapsOpen((prev) => {
      const next = new Set(prev);
      if (next.has(bookingId)) {
        next.delete(bookingId);
        stopPoll(bookingId);
      } else {
        next.add(bookingId);
        startPoll(bookingId);
      }
      return next;
    });
  };

  const startPoll = (bookingId: string) => {
    if (pollRefs.current.has(bookingId)) return;
    const fetchLoc = async () => {
      try {
        const loc = await api.get(`/api/bookings/${bookingId}/location/`);
        setLiveLocations((prev) => {
          const next = new Map(prev);
          next.set(bookingId, loc);
          return next;
        });
      } catch { /* silent */ }
    };
    fetchLoc();
    const interval = setInterval(fetchLoc, 10000);
    pollRefs.current.set(bookingId, interval);
  };

  const stopPoll = (bookingId: string) => {
    const interval = pollRefs.current.get(bookingId);
    if (interval) {
      clearInterval(interval);
      pollRefs.current.delete(bookingId);
    }
  };

  const openReportModal = (booking: any) => {
    setReportModal({ booking, open: true });
    setReportType('');
    setReportDesc('');
  };

  const submitReport = async () => {
    if (!reportType || !reportDesc.trim()) return;
    setSubmittingReport(true);
    try {
      const isReporterCustomer = reportModal.booking.customer_id === profile?.id;
      await api.post('/api/bookings/reports/create/', {
        booking_id: reportModal.booking.id,
        reported_user_id: isReporterCustomer ? reportModal.booking.provider_id : reportModal.booking.customer_id,
        report_type: reportType,
        description: reportDesc.trim(),
      });
      toast.success(t('booking.reportSubmitted'));
      setReportModal({ booking: null, open: false });
    } catch (e: any) {
      toast.error(e?.message || t('toast.networkError'));
    } finally {
      setSubmittingReport(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-slate-500">{t('common.loading')}</div>;

  if (suspended) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <ShieldAlert size={32} className="text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('booking.suspendedTitle')}</h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm">{t('booking.suspendedMessage')}</p>
        <p className="text-slate-500 dark:text-slate-500 text-sm">{t('booking.suspendedNepali')}</p>
        <a
          href="https://discord.gg/hb8GuuSsfb"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-smooth"
        >
          <MessageCircle size={16} />
          Discord Support
        </a>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold font-heading text-slate-900 dark:text-slate-100">
          {t('nav.bookings')}
        </h1>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab('active')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-smooth ${
            tab === 'active'
              ? 'bg-violet-600 text-white'
              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
          }`}
        >
          {t('booking.activeTab')} ({activeBookings.length})
        </button>
        <button
          onClick={() => setTab('history')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-smooth ${
            tab === 'history'
              ? 'bg-violet-600 text-white'
              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
          }`}
        >
          {t('booking.historyTab')} ({historyBookings.length})
        </button>
      </div>

      {displayedBookings.length === 0 ? (
        <div className="text-center py-20 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          {tab === 'active' ? t('dashboard.noBookings') : t('booking.history')}
        </div>
      ) : (
        <div className="grid gap-4">
          {displayedBookings.map((b: any) => {
            const isActing = acting === b.id;
            const isSharing = sharingBookings.has(b.id);
            const isMapOpen = mapsOpen.has(b.id);
            const isActive = activeStatuses.includes(b.status);
            const isBookingCustomer = b.customer_id === profile?.id;
            const isBookingProvider = b.provider_user_id === profile?.id;
            const showLocationShare = isActive && (isBookingProvider || isBookingCustomer);
            const showArrived = isBookingProvider && b.status === 'CONFIRMED' && !b.arrived_at;

            const locData = liveLocations.get(b.id);
            const providerLat = locData?.lat ?? b.provider_lat;
            const providerLng = locData?.lng ?? b.provider_lng;
            const customerLat = locData?.customer_lat ?? b.customer_lat;
            const customerLng = locData?.customer_lng ?? b.customer_lng;
            const destLat = customerLat ?? b.destination_lat;
            const destLng = customerLng ?? b.destination_lng;
            const otherLat = isBookingCustomer ? providerLat : (customerLat ?? b.destination_lat);
            const otherLng = isBookingCustomer ? providerLng : (customerLng ?? b.destination_lng);
            const otherName = isBookingCustomer ? (b.provider_full_name || b.provider_name) : (b.customer_full_name || b.customer_name);
            const centerLat = providerLat ?? destLat ?? otherLat;
            const centerLng = providerLng ?? destLng ?? otherLng;
            const hasLocation = !!(providerLat && providerLng) || !!(destLat && destLng);
            const selfLat = isBookingCustomer ? null : (customerLat ?? null);
            const selfLng = isBookingCustomer ? null : (customerLng ?? null);

            return (
              <div
                key={b.id}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[b.status] || ''}`}>
                        {b.status}
                      </span>
                      {b.arrived_at && !isMapOpen && (
                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          {t('booking.arrived')}
                        </span>
                      )}
                    </div>

                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                      {b.job_description?.substring(0, 80) || 'Service'}
                    </h3>

                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {isBookingCustomer ? `${t('booking.with')} ` : `${t('booking.from')} `}
                      {isBookingProvider && b.customer_id ? (
                        <Link
                          to={`/customers/${b.customer_id}`}
                          className="font-medium text-violet-600 dark:text-violet-400 hover:underline"
                        >
                          {b.customer_full_name || b.customer_name || '—'}
                        </Link>
                      ) : (
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {isBookingCustomer && b.provider_id ? (
                            <Link
                              to={`/providers/${b.provider_id}`}
                              className="text-violet-600 dark:text-violet-400 hover:underline"
                            >
                              {b.provider_full_name || b.provider_name || '—'}
                            </Link>
                          ) : (
                            b.customer_full_name || b.customer_name || b.provider_name || '—'
                          )}
                        </span>
                      )}
                      {isBookingCustomer && b.provider_profession && (
                        <span> ({b.provider_profession})</span>
                      )}
                    </p>

                    {isBookingCustomer && b.provider_id && (
                      <div className="flex items-center gap-3 mt-3">
                        <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-300 text-sm font-bold overflow-hidden flex-shrink-0">
                          {b.provider_avatar ? (
                            <img src={b.provider_avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            (b.provider_full_name || b.provider_name || 'P').charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="text-sm">
                          <Link
                            to={`/providers/${b.provider_id}`}
                            className="font-medium text-violet-600 dark:text-violet-400 hover:underline"
                          >
                            {b.provider_full_name || b.provider_name}
                          </Link>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span>{b.provider_profession}</span>
                            {b.provider_rating != null && b.provider_rating > 0 && (
                              <span className="inline-flex items-center gap-0.5 text-amber-500">
                                <Star size={11} fill="currentColor" />
                                {b.provider_rating.toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-slate-500 dark:text-slate-400">
                      {b.scheduled_date && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(b.scheduled_date).toLocaleDateString(undefined, {
                            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      )}
                      {b.job_address && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={12} />
                          {b.job_address}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <CreditCard size={12} />
                        NPR {b.agreed_price || '—'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      {showLocationShare && (
                        isSharing ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                            <Locate size={12} className="animate-pulse" />
                            {t('booking.sharingLocation')}
                            <button onClick={() => stopSharing(b.id)} className="ml-1 text-red-500 hover:underline">
                              {t('booking.stopSharing')}
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => startSharing(b)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-medium hover:bg-violet-700 transition-smooth"
                          >
                            <Navigation size={12} />
                            {t('booking.shareLocation')}
                          </button>
                        )
                      )}

                      {showArrived && (
                        <button
                          onClick={() => markArrived(b.id)}
                          disabled={isActing}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-smooth disabled:opacity-50"
                        >
                          {isActing ? <Loader2 size={12} className="animate-spin" /> : <LocateFixed size={12} />}
                          {t('booking.markArrived')}
                        </button>
                      )}

                      {isActive && (
                        <button
                          onClick={() => toggleMap(b.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-smooth"
                        >
                          <MapIcon size={12} />
                          {isMapOpen ? t('booking.hideMap') : t('booking.showOnMap')}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isBookingCustomer && (b.status === 'REQUESTED' || b.status === 'CONFIRMED') && (
                      <button
                        onClick={() => updateStatus(b.id, 'CANCELLED', 'booking.bookingCancelled')}
                        disabled={isActing}
                        className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-smooth disabled:opacity-50"
                      >
                        {isActing ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                        {t('booking.cancel')}
                      </button>
                    )}
                    {isBookingProvider && b.status === 'REQUESTED' && (
                      <>
                        <button
                          onClick={() => updateStatus(b.id, 'CONFIRMED', 'booking.bookingAccepted')}
                          disabled={isActing}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-medium hover:bg-violet-700 transition-smooth disabled:opacity-50"
                        >
                          <Check size={12} /> {t('booking.accept')}
                        </button>
                        <button
                          onClick={() => updateStatus(b.id, 'CANCELLED', 'booking.bookingRejected')}
                          disabled={isActing}
                          className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-smooth disabled:opacity-50"
                        >
                          <X size={12} /> {t('booking.reject')}
                        </button>
                      </>
                    )}
                    {isBookingProvider && (b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS') && (
                      <button
                        onClick={() => updateStatus(b.id, 'COMPLETED', 'booking.bookingCompleted')}
                        disabled={isActing}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-smooth disabled:opacity-50"
                      >
                        <CheckCircle2 size={12} /> {t('booking.markComplete')}
                      </button>
                    )}
                    {historyStatuses.includes(b.status) && (
                      <button
                        onClick={() => openReportModal(b)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-smooth"
                      >
                        <Flag size={12} />
                        {t('booking.report')}
                      </button>
                    )}
                  </div>
                </div>

                {isMapOpen && isActive && (
                  <div className="mt-4">
                    {hasLocation ? (
                      <BookingMap
                        centerLat={centerLat}
                        centerLng={centerLng}
                        providerLat={providerLat}
                        providerLng={providerLng}
                        destLat={destLat}
                        destLng={destLng}
                        otherLat={otherLat}
                        otherLng={otherLng}
                        otherName={otherName}
                        selfLat={selfLat}
                        selfLng={selfLng}
                        arrivedAt={b.arrived_at || (locData?.arrived_at ?? null)}
                      />
                    ) : (
                      <div className="text-center py-8 text-sm text-slate-400 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <MapPin size={24} className="mx-auto mb-2 opacity-40" />
                        {b.job_address
                          ? t('booking.noLocationData')
                          : t('booking.noLocationAddress')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {reportModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setReportModal({ booking: null, open: false })}>
          <div
            className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">{t('booking.reportUser')}</h3>
              <button onClick={() => setReportModal({ booking: null, open: false })} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('booking.reportType')}
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
              >
                <option value="">Select...</option>
                {((reportModal.booking?.customer_id === profile?.id) ? CUSTOMER_REPORT_TYPES : PROVIDER_REPORT_TYPES).map((rt) => (
                  <option key={rt} value={rt}>{t(REPORT_TYPE_KEYS[rt])}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('booking.reportDescription')}
              </label>
              <textarea
                value={reportDesc}
                onChange={(e) => setReportDesc(e.target.value)}
                rows={3}
                placeholder={t('booking.reportPlaceholder')}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 resize-none"
              />
            </div>

            <button
              onClick={submitReport}
              disabled={!reportType || !reportDesc.trim() || submittingReport}
              className="w-full py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submittingReport ? (
                <Loader2 size={16} className="animate-spin mx-auto" />
              ) : (
                t('booking.submitReport')
              )}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
