import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Calendar, User, Phone, Mail, Share2, Package, Cat, Car,
  ImageOff, Trash2, Check, XCircle, QrCode,
} from 'lucide-react';
import { FtlAlert, FtlType, FtlStatus } from '../lib/types';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useTrans } from '../i18n';
import { useToast } from '../hooks/useToast';
import FtlQrModal from '../components/FtlQrModal';

const typeMeta: Record<FtlType, { labelKey: string; color: string; Icon: any }> = {
  PERSON: { labelKey: 'ftl.missingPerson', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', Icon: User },
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

export default function FtlDetailPage() {
  const { t } = useTrans();
  const toast = useToast();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const [alert, setAlert] = useState<FtlAlert | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      try {
        const data = await api.get(`/api/ftl/${id}/`);
        const mapped = {
          ...data,
          profiles: {
            full_name: data.user_name || 'Reporter',
            phone: data.contact_value || '',
            avatar_url: null
          }
        };
        setAlert(mapped);
      } catch (e) {
        console.error('Failed to fetch alert:', e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: alert?.title, url }).catch(() => {});
      } else {
        await navigator.clipboard.writeText(url);
        toast.info('Link copied to clipboard');
      }
    } catch (e) {
      console.error('Share failed:', e);
    }
  };

  const updateStatus = async (newStatus: FtlStatus) => {
    if (!alert) return;
    setUpdating(true);
    try {
      await api.patch(`/api/ftl/${alert.id}/`, { status: newStatus });
      setAlert({ ...alert, status: newStatus });
      toast.success(
        newStatus === 'MATCHED'
          ? t('ftl.alertMatched')
          : newStatus === 'CLOSED'
          ? t('ftl.alertClosed')
          : t('toast.saved')
      );
    } catch (e: any) {
      console.error('Status update failed:', e);
      toast.error(e?.message || t('toast.networkError'));
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!alert) return;
    if (!confirm(t('ftl.confirmDelete'))) return;
    setUpdating(true);
    try {
      await api.delete(`/api/ftl/${alert.id}/`);
      toast.success(t('ftl.alertDeleted'));
      navigate('/ftl');
    } catch (e: any) {
      console.error('Delete failed:', e);
      toast.error(e?.message || t('toast.networkError'));
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="text-center py-16 text-slate-400">{t('common.loading')}</div>;
  }

  if (!alert) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500 dark:text-slate-400 mb-4">{t('common.noData')}</p>
        <Link to="/ftl" className="text-violet-600 dark:text-violet-400 font-medium hover:underline">
          {t('ftl.backToAlerts')}
        </Link>
      </div>
    );
  }

  const tm = typeMeta[alert.type] || typeMeta.ITEM;
  const sm = statusMeta[alert.status] || statusMeta.OPEN;
  const TypeIcon = tm.Icon;
  const isOwner = user?.id === alert.user_id;
  const contactValue = (alert as any).contact_value || (alert as any).contact_method;
  const contactMethod = (alert as any).contact_method;
  const reporterName = (alert as any).profiles?.full_name;

  return (
    <div className="max-w-3xl mx-auto pb-8 space-y-4">
      <Link
        to="/ftl"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-smooth"
      >
        <ArrowLeft size={16} />
        {t('ftl.backToAlerts')}
      </Link>

      {/* Image / placeholder */}
      <div className="bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 h-64 flex items-center justify-center">
        {alert.image_url ? (
          <img src={alert.image_url} alt={alert.title} className="w-full h-full object-cover" />
        ) : (
          <div className="text-center">
            <ImageOff size={48} className="text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400">No image provided</p>
          </div>
        )}
      </div>

      {/* Main card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${tm.color}`}>
            <TypeIcon size={12} />
            {t(tm.labelKey)}
          </span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${sm.color}`}>
            {t(sm.labelKey)}
          </span>
        </div>

        <h1 className="text-2xl font-bold font-heading text-slate-900 dark:text-slate-100 mb-3">
          {alert.title}
        </h1>

        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
          {alert.description}
        </p>

        <div className="border-t border-slate-200 dark:border-slate-700 my-5" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <MapPin size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('ftl.location')}</p>
              <p className="text-slate-700 dark:text-slate-300">
                {alert.last_seen_location || '—'}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Calendar size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('ftl.created')}</p>
              <p className="text-slate-700 dark:text-slate-300">
                {new Date(alert.created_at).toLocaleString()}
              </p>
            </div>
          </div>
          {reporterName && (
            <div className="flex items-start gap-2">
              <User size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('ftl.reportedBy')}</p>
                <p className="text-slate-700 dark:text-slate-300">{reporterName}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contact card */}
      {contactValue && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
            {t('ftl.contactReporter')}
          </h2>
          {contactMethod === 'PHONE' ? (
            <a
              href={`tel:${contactValue}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-smooth"
            >
              <Phone size={14} />
              {contactValue}
            </a>
          ) : contactMethod === 'EMAIL' ? (
            <a
              href={`mailto:${contactValue}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-smooth"
            >
              <Mail size={14} />
              {contactValue}
            </a>
          ) : (
            <p className="text-sm text-slate-700 dark:text-slate-300">{contactValue}</p>
          )}
        </div>
      )}

      {/* Actions row */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 flex items-center gap-3 flex-wrap">
        <button
          onClick={handleShare}
          className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-smooth"
        >
          <Share2 size={14} />
          {t('ftl.share')}
        </button>
        <button
          onClick={() => setShowQr(true)}
          className="inline-flex items-center gap-2 px-4 py-2 border border-violet-200 dark:border-violet-800 rounded-lg text-sm font-medium text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-smooth"
        >
          <QrCode size={14} />
          {t('ftl.generateQr')}
        </button>
      </div>

      <FtlQrModal open={showQr} onClose={() => setShowQr(false)} alert={alert} />

      {/* Owner actions */}
      {isOwner && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
            {t('ftl.manageAlert')}
          </h2>
          <div className="flex flex-wrap gap-2">
            {alert.status === 'OPEN' && (
              <button
                onClick={() => updateStatus('MATCHED')}
                disabled={updating}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg text-sm font-medium hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-smooth disabled:opacity-50"
              >
                <Check size={14} />
                {t('ftl.markMatched')}
              </button>
            )}
            {alert.status !== 'CLOSED' && (
              <button
                onClick={() => updateStatus('CLOSED')}
                disabled={updating}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-smooth disabled:opacity-50"
              >
                <XCircle size={14} />
                {t('ftl.closeAlert')}
              </button>
            )}
            <button
              onClick={handleDelete}
              disabled={updating}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-smooth disabled:opacity-50"
            >
              <Trash2 size={14} />
              {t('ftl.deleteAlert')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
