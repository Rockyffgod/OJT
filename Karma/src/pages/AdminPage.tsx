import { useState, useEffect, useRef } from 'react';
import { Check, X, Shield, AlertCircle, RefreshCw, UserPlus, UserX, Flag, Ban, MapIcon } from 'lucide-react';
import { useTrans } from '../i18n';
import { useToast } from '../hooks/useToast';
import { api } from '../lib/api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
  RESOLVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  DISMISSED: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
};

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

export default function AdminPage() {
  const { t, isNp } = useTrans();
  const toast = useToast();
  const [tab, setTab] = useState<'users' | 'providers' | 'bookings' | 'reports' | 'liveMap'>('users');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [suspendModal, setSuspendModal] = useState<{ report: any; reason: string } | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const mapMarkersRef = useRef<L.Marker[]>([]);

  const fetchData = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      let result: any;
      if (tab === 'users') {
        result = await api.get('/api/admin/users/');
      } else if (tab === 'providers') {
        result = await api.get('/api/admin/providers/');
      } else if (tab === 'bookings') {
        result = await api.get('/api/admin/bookings/');
      } else if (tab === 'reports') {
        result = await api.get('/api/bookings/reports/');
      } else {
        result = await api.get('/api/admin/locations/');
      }
      setData(Array.isArray(result) ? result : result?.results || []);
    } catch (e: any) {
      setFetchError(e?.message || 'Failed to fetch data');
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
    { key: 'reports', label: isNp ? 'रिपोर्टहरू' : 'Reports' },
    { key: 'liveMap', label: isNp ? 'लाइभ नक्सा' : 'Live Map' },
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

  const promoteUser = async (userId: string) => {
    setActing(userId);
    try {
      await api.patch(`/api/admin/users/${userId}/promote/`, {});
      toast.success('User promoted to admin');
      await fetchData();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to promote user');
    } finally {
      setActing(null);
    }
  };

  const demoteUser = async (userId: string) => {
    setActing(userId);
    try {
      await api.patch(`/api/admin/users/${userId}/demote/`, {});
      toast.success('User demoted from admin');
      await fetchData();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to demote user');
    } finally {
      setActing(null);
    }
  };

  const resolveReport = async (reportId: string) => {
    setActing(reportId);
    try {
      await api.patch(`/api/bookings/reports/${reportId}/`, { status: 'RESOLVED' });
      toast.success(t('admin.resolved'));
      await fetchData();
    } catch (e: any) {
      toast.error(e?.message || t('toast.networkError'));
    } finally {
      setActing(null);
    }
  };

  const dismissReport = async (reportId: string) => {
    setActing(reportId);
    try {
      await api.patch(`/api/bookings/reports/${reportId}/`, { status: 'DISMISSED' });
      toast.success(t('admin.dismissReport'));
      await fetchData();
    } catch (e: any) {
      toast.error(e?.message || t('toast.networkError'));
    } finally {
      setActing(null);
    }
  };

  const dismissAndSuspend = async (report: any, reason: string) => {
    setActing(report.id);
    try {
      await api.patch(`/api/bookings/reports/${report.id}/`, { status: 'DISMISSED' });
      await api.patch(`/api/admin/users/${report.reported_user}/suspend/`, { reason });
      toast.success('Report dismissed & user suspended');
      setSuspendModal(null);
      await fetchData();
    } catch (e: any) {
      toast.error(e?.message || t('toast.networkError'));
    } finally {
      setActing(null);
    }
  };

  const suspendUserDirect = async (userId: string) => {
    setActing(userId);
    try {
      await api.patch(`/api/admin/users/${userId}/suspend/`, { reason: 'Admin action' });
      toast.success(t('admin.suspendUser'));
      await fetchData();
    } catch (e: any) {
      toast.error(e?.message || t('toast.networkError'));
    } finally {
      setActing(null);
    }
  };

  const unsuspendUser = async (userId: string) => {
    setActing(userId);
    try {
      await api.patch(`/api/admin/users/${userId}/unsuspend/`, {});
      toast.success(t('admin.unsuspendUser'));
      await fetchData();
    } catch (e: any) {
      toast.error(e?.message || t('toast.networkError'));
    } finally {
      setActing(null);
    }
  };

  // Live map: init map and update markers
  useEffect(() => {
    if (tab !== 'liveMap' || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [27.7, 85.3],
        zoom: 12,
        attributionControl: false,
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear old markers
    mapMarkersRef.current.forEach((m) => map.removeLayer(m));
    mapMarkersRef.current = [];

    const allBounds: [number, number][] = [];

    data.forEach((b: any) => {
      const colors = ['#7c3aed', '#059669', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'];
      const color = colors[Math.floor(Math.random() * colors.length)];

      if (b.provider?.lat && b.provider?.lng) {
        const icon = L.divIcon({
          html: `<div style="width:28px;height:28px;background:#7c3aed;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:700;">P</div>`,
          iconSize: [28, 28], iconAnchor: [14, 14], className: '',
        });
        const marker = L.marker([b.provider.lat, b.provider.lng], { icon })
          .addTo(map)
          .bindPopup(`
            <strong>${b.provider.name}</strong><br/>
            ${b.provider.profession || 'Provider'}<br/>
            <span style="font-size:11px;color:#666;">
              Booking: ${b.job_description || ''}<br/>
              Status: ${b.status}${b.arrived_at ? ' ✓ Arrived' : ''}
            </span>
          `);
        mapMarkersRef.current.push(marker);
        allBounds.push([b.provider.lat, b.provider.lng]);
      }

      if (b.customer?.lat && b.customer?.lng) {
        const icon = L.divIcon({
          html: `<div style="width:28px;height:28px;background:#059669;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:700;">C</div>`,
          iconSize: [28, 28], iconAnchor: [14, 14], className: '',
        });
        const marker = L.marker([b.customer.lat, b.customer.lng], { icon })
          .addTo(map)
          .bindPopup(`
            <strong>${b.customer.name}</strong> (Customer)<br/>
            <span style="font-size:11px;color:#666;">
              Booking: ${b.job_description || ''}<br/>
              Status: ${b.status}
            </span>
          `);
        mapMarkersRef.current.push(marker);
        allBounds.push([b.customer.lat, b.customer.lng]);
      }

      // Draw polyline between provider and customer
      if (b.provider?.lat && b.provider?.lng && b.customer?.lat && b.customer?.lng) {
        L.polyline(
          [[b.provider.lat, b.provider.lng], [b.customer.lat, b.customer.lng]],
          { color, weight: 2, opacity: 0.5, dashArray: '5, 8' }
        ).addTo(map);
      }
    });

    if (allBounds.length > 0) {
      const group = L.featureGroup(allBounds.map((b) => L.marker(b)));
      map.fitBounds(group.getBounds().pad(0.15));
    }

    return () => {
      // markers cleaned up above on next render; not unmounting map
    };
  }, [tab, data]);

  // Auto-refresh live map every 15s
  useEffect(() => {
    if (tab !== 'liveMap') return;
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [tab]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
            <Shield size={20} className="text-violet-600 dark:text-violet-400" />
          </div>
          <h1 className="text-2xl font-bold font-heading text-slate-900 dark:text-slate-100">
            {t('nav.admin')}
          </h1>
        </div>
        <button
          onClick={fetchData}
          className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-smooth"
          title="Refresh"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
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

      {fetchError && !loading && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-center">
          <AlertCircle size={36} className="text-red-400 mx-auto mb-3" />
          <p className="text-slate-700 dark:text-slate-300 font-medium mb-1">Failed to load {tab}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{fetchError}</p>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-smooth"
          >
            <RefreshCw size={14} /> Retry
          </button>
          {fetchError.includes('403') || fetchError.includes('401') ? (
            <p className="text-xs text-slate-400 mt-3">
              Only the master admin (admin@example.com) can access this page.
            </p>
          ) : null}
        </div>
      )}

      {!fetchError && !loading && data.length === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <AlertCircle size={32} className="text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {tab === 'reports' ? t('admin.noReports') : `No ${tab} found`}
          </p>
        </div>
      )}

      {!fetchError && data.length > 0 && tab !== 'liveMap' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  {tab === 'users' && (
                    <>
                      <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Name</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Email</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Phone</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Type</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Suspended</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Joined</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-500 dark:text-slate-400">Actions</th>
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
                      <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Customer</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Provider</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Job</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Price</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Payment</th>
                    </>
                  )}
                  {tab === 'reports' && (
                    <>
                      <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Reporter</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Reported</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Type</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Description</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Date</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-500 dark:text-slate-400">Actions</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {tab === 'users' &&
                  data.map((u: any) => {
                    const isAdminMaster = u.email === 'admin@example.com';
                    return (
                      <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3 text-slate-900 dark:text-slate-100 font-medium">
                          {u.full_name || u.username || '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{u.email || '—'}</td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{u.phone || '—'}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {u.account_type}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {u.is_suspended ? (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">Yes</span>
                          ) : (
                            <span className="text-xs text-slate-400">No</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs">
                          {u.date_joined ? new Date(u.date_joined).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {!isAdminMaster && (
                            <div className="flex items-center justify-end gap-2">
                              {u.account_type === 'ADMIN' ? (
                                <button
                                  onClick={() => demoteUser(u.id)}
                                  disabled={acting === u.id}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-md text-xs font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-smooth disabled:opacity-50"
                                >
                                  <UserX size={12} /> Demote
                                </button>
                              ) : (
                                <button
                                  onClick={() => promoteUser(u.id)}
                                  disabled={acting === u.id}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-md text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-smooth disabled:opacity-50"
                                >
                                  <UserPlus size={12} /> Promote
                                </button>
                              )}
                              {u.is_suspended ? (
                                <button
                                  onClick={() => unsuspendUser(u.id)}
                                  disabled={acting === u.id}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 rounded-md text-xs font-medium hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-smooth disabled:opacity-50"
                                >
                                  <Check size={12} /> Unsuspend
                                </button>
                              ) : u.account_type !== 'ADMIN' && (
                                <button
                                  onClick={() => suspendUserDirect(u.id)}
                                  disabled={acting === u.id}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-md text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-smooth disabled:opacity-50"
                                >
                                  <Ban size={12} /> Suspend
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                {tab === 'providers' &&
                  data.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 text-slate-900 dark:text-slate-100 font-medium">
                        {p.user_name || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                        {p.profession || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-slate-900 dark:text-slate-100 font-semibold">{p.karma_points || 0}</span>
                        <span className="text-xs text-slate-400 ml-1">{p.karma_level || ''}</span>
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
                      <td className="px-4 py-3 text-slate-900 dark:text-slate-100">{b.customer_name || '—'}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{b.provider_name || '—'}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300 max-w-[200px] truncate">
                        {b.job_description || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium">
                        {b.agreed_price ? `NPR ${b.agreed_price}` : '—'}
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
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-500">{b.payment_status || '—'}</span>
                      </td>
                    </tr>
                  ))}
                {tab === 'reports' &&
                  data.map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 text-slate-900 dark:text-slate-100 font-medium">
                        {r.reporter_name || r.reporter_email || r.reporter || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                        {r.reported_user_name || r.reported_user_email || r.reported_user || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {t(REPORT_TYPE_KEYS[r.report_type] || r.report_type)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 max-w-[200px] truncate">
                        {r.description || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            STATUS_STYLES[r.status] || 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {r.status === 'PENDING' && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => resolveReport(r.id)}
                              disabled={acting === r.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 text-white rounded-md text-xs font-medium hover:bg-emerald-700 transition-smooth disabled:opacity-50"
                            >
                              <Check size={12} /> {t('admin.resolveReport')}
                            </button>
                            <button
                              onClick={() => dismissReport(r.id)}
                              disabled={acting === r.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-md text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-smooth disabled:opacity-50"
                            >
                              <X size={12} /> {t('admin.dismissReport')}
                            </button>
                            {r.reported_user && (
                              <button
                                onClick={() => setSuspendModal({ report: r, reason: r.description || '' })}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-md text-xs font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-smooth"
                              >
                                <Ban size={12} /> {t('admin.dismissAndSuspend')}
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-400">
            {data.length} record{data.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {tab === 'liveMap' && !fetchError && (
        <div>
          {data.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
              <MapIcon size={32} className="text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-slate-500 dark:text-slate-400 text-sm">{t('admin.noActiveLocations')}</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="p-3 border-b border-slate-100 dark:border-slate-700 text-xs text-slate-500 flex items-center justify-between">
                <span>{data.length} active booking{data.length !== 1 ? 's' : ''}</span>
                <span className="text-violet-500">Auto-refreshes every 15s</span>
              </div>
              <div ref={mapContainerRef} className="h-[600px]" />
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <div className="animate-spin w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-slate-400">{t('common.loading')}</p>
        </div>
      )}

      {suspendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSuspendModal(null)}>
          <div
            className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">{t('booking.suspensionReason')}</h3>
              <button onClick={() => setSuspendModal(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <textarea
              value={suspendModal.reason}
              onChange={(e) => setSuspendModal({ ...suspendModal, reason: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 resize-none"
              placeholder={t('booking.reportPlaceholder')}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setSuspendModal(null)}
                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-smooth"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => dismissAndSuspend(suspendModal.report, suspendModal.reason)}
                disabled={acting === suspendModal.report.id}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-smooth disabled:opacity-50"
              >
                {acting === suspendModal.report.id ? 'Suspending...' : t('admin.dismissAndSuspend')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
