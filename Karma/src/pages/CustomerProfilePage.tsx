import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin, Shield, MessageSquare } from 'lucide-react';
import { api } from '../lib/api';
import { useTrans } from '../i18n';

export default function CustomerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { t, isNp } = useTrans();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      try {
        const userData = await api.get(`/api/admin/users/${id}/`);
        setUser(userData);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) return <div className="text-center py-16 text-slate-400">{t('common.loading')}</div>;

  if (!user) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">{t('common.noData')}</p>
        <Link to="/bookings" className="text-violet-600 font-medium hover:underline mt-2 inline-block">
          Back to bookings
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto pb-8 space-y-4">
      <Link
        to="/bookings"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-smooth"
      >
        <ArrowLeft size={16} />
        Back to bookings
      </Link>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-300 text-2xl font-bold overflow-hidden mb-4">
          {user.profile_photo ? (
            <img src={user.profile_photo} alt="" className="w-full h-full object-cover" />
          ) : (
            (user.full_name || user.username || '?').charAt(0).toUpperCase()
          )}
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          {user.full_name || user.username || 'User'}
        </h1>
        {user.full_name_nepali && (
          <p className="text-sm text-slate-500">{user.full_name_nepali}</p>
        )}
        <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
          {user.account_type}
        </span>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-3">
        {user.email && (
          <div className="flex items-center gap-3 text-sm">
            <Mail size={16} className="text-slate-400" />
            <span className="text-slate-700 dark:text-slate-300">{user.email}</span>
          </div>
        )}
        {user.phone && (
          <div className="flex items-center gap-3 text-sm">
            <Phone size={16} className="text-slate-400" />
            <span className="text-slate-700 dark:text-slate-300">{user.phone}</span>
          </div>
        )}
        {user.city && (
          <div className="flex items-center gap-3 text-sm">
            <MapPin size={16} className="text-slate-400" />
            <span className="text-slate-700 dark:text-slate-300">{user.city}</span>
          </div>
        )}
        {user.is_email_verified && (
          <div className="flex items-center gap-3 text-sm">
            <Shield size={16} className="text-emerald-400" />
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Verified</span>
          </div>
        )}
      </div>

      {user.account_type === 'PROVIDER' && (
        <Link
          to={`/providers/${user.id}`}
          className="block w-full text-center py-3 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-smooth"
        >
          <MessageSquare size={16} className="inline mr-2" />
          View Provider Profile
        </Link>
      )}
    </div>
  );
}
