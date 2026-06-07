import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useTrans } from '../i18n';
import { api } from '../lib/api';
import { useToast } from '../hooks/useToast';
import { transliterateName } from '../utils/nepaliTranslate';
import { Star, Shield, Briefcase, Award, CheckCircle2, MapPin, Mail, Phone, Settings, User, Edit2, Check, X } from 'lucide-react';

export default function ProfilePage() {
  const { profile, djangoToken, setProfile } = useAuthStore();
  const { t, isNp } = useTrans();
  const toast = useToast();
  const [providerDetails, setProviderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(profile?.username || '');
  const [usernameError, setUsernameError] = useState('');
  const [updatingUsername, setUpdatingUsername] = useState(false);

  // Sync state if profile loads
  useEffect(() => {
    if (profile?.username) {
      setNewUsername(profile.username);
    }
  }, [profile]);

  const handleUpdateUsername = async () => {
    if (!newUsername.trim()) {
      setUsernameError(isNp ? 'प्रयोगकर्ता नाम आवश्यक छ' : 'Username is required');
      return;
    }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(newUsername.trim())) {
      setUsernameError(isNp ? '३-२० वर्णहरू, अक्षर, अंक वा _ मात्र' : '3-20 characters, letters, numbers, or underscores only');
      return;
    }

    setUpdatingUsername(true);
    setUsernameError('');
    try {
      // 1. Update Django backend
      if (djangoToken) {
        const djangoRes = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/accounts/me/`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${djangoToken}`,
            },
            body: JSON.stringify({ username: newUsername.trim() }),
          }
        );
        if (!djangoRes.ok) {
          const err = await djangoRes.json().catch(() => null);
          throw new Error(err?.username?.[0] || err?.detail || 'Failed to update username in Django');
        }
      }

      // 2. Local database already updated via Django patch endpoint above.
      // Retaining this block comment to match structure.
      
      // 3. Update local store state
      if (profile) {
        setProfile({ ...profile, username: newUsername.trim() });
      }
      toast.success(isNp ? 'प्रयोगकर्ता नाम परिवर्तन भयो' : 'Username updated successfully');
      setIsEditingUsername(false);
    } catch (err: any) {
      setUsernameError(err.message || 'Failed to update username');
      toast.error(err.message || 'Failed to update username');
    } finally {
      setUpdatingUsername(false);
    }
  };

  useEffect(() => {
    const fetchProvider = async () => {
      if (!profile?.id || profile.account_type !== 'PROVIDER') return;
      setLoading(true);
      try {
        const data = await api.get('/api/services/my-profile/');
        setProviderDetails(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProvider();
  }, [profile]);

  if (!profile) return <div className="text-center py-20 text-slate-500">{t('common.loading')}</div>;

  const isProvider = profile.account_type === 'PROVIDER';

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900 dark:text-slate-100">
            {t('nav.profile')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isNp ? 'आफ्नो प्रोफाइल र खाता जानकारी व्यवस्थापन गर्नुहोस्' : 'Manage your profile and account details'}
          </p>
        </div>
        <Link
          to="/settings"
          className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-smooth"
        >
          <Settings size={16} />
          {isNp ? 'सेटिङ्ग' : 'Settings'}
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - User Info Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 text-center relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-violet-500 to-indigo-600" />
            
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-300 text-3xl font-bold overflow-hidden mx-auto mb-4 border-2 border-white dark:border-slate-800 shadow-sm mt-4">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
              ) : (
                profile.full_name?.charAt(0)?.toUpperCase() || '?'
              )}
            </div>

            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{profile.full_name}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{profile.email}</p>
            
            {/* Username Section */}
            <div className="mt-3 flex flex-col items-center justify-center">
              {isEditingUsername ? (
                <div className="w-full max-w-[200px] space-y-1">
                  <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1">
                    <span className="text-slate-400 text-sm">@</span>
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => {
                        setNewUsername(e.target.value);
                        setUsernameError('');
                      }}
                      className="w-full bg-transparent border-none outline-none text-sm text-slate-900 dark:text-slate-100 p-0"
                      placeholder="username"
                      disabled={updatingUsername}
                      autoFocus
                    />
                    <button
                      onClick={handleUpdateUsername}
                      disabled={updatingUsername}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-emerald-600 transition-smooth"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingUsername(false);
                        setNewUsername(profile.username || '');
                        setUsernameError('');
                      }}
                      disabled={updatingUsername}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-red-500 transition-smooth"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  {usernameError && (
                    <p className="text-[10px] text-red-500 dark:text-red-400 text-left px-1">{usernameError}</p>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 px-2.5 py-1 rounded-full border border-slate-100 dark:border-slate-800">
                  <span className="font-mono">@{profile.username || 'set_username'}</span>
                  <button
                    onClick={() => setIsEditingUsername(true)}
                    className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-smooth text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    title="Change Username"
                  >
                    <Edit2 size={12} />
                  </button>
                </div>
              )}

              {/* Show Auto-translated Username if language is Nepali */}
              {isNp && profile.username && (
                <span className="text-[11px] text-violet-600 dark:text-violet-400 mt-1 bg-violet-50 dark:bg-violet-950/40 px-2 py-0.5 rounded-md border border-violet-100 dark:border-violet-900/30">
                  नेपाली: {transliterateName(profile.username.replace(/_/g, ' '))}
                </span>
              )}
            </div>

            <div className="mt-4 flex justify-center">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                isProvider
                  ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
              }`}>
                {isProvider ? (
                  <>
                    <Briefcase size={12} />
                    {isNp ? 'प्रदायक' : 'Service Provider'}
                  </>
                ) : (
                  <>
                    <User size={12} />
                    {isNp ? 'ग्राहक' : 'Customer'}
                  </>
                )}
              </span>
            </div>

            {/* Quick stats for customer */}
            {!isProvider && (
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 flex justify-around text-center">
                <div>
                  <span className="block text-xl font-bold text-slate-900 dark:text-slate-100">Customer</span>
                  <span className="text-2xs text-slate-400 dark:text-slate-500 uppercase font-semibold">Account Role</span>
                </div>
              </div>
            )}
          </div>

          {/* Contact Details */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm border-b border-slate-100 dark:border-slate-700 pb-2">
              {isNp ? 'सम्पर्क विवरण' : 'Contact Information'}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                <Mail size={16} className="text-slate-400" />
                <span className="truncate">{profile.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                <Phone size={16} className="text-slate-400" />
                <span>{profile.phone || '—'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                <MapPin size={16} className="text-slate-400" />
                <span>{profile.city || '—'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Detail section */}
        <div className="md:col-span-2 space-y-6">
          {isProvider ? (
            <>
              {loading ? (
                <div className="bg-white dark:bg-slate-800 p-12 rounded-xl border border-slate-200 dark:border-slate-700 text-center text-slate-400">
                  {t('common.loading')}
                </div>
              ) : providerDetails ? (
                <>
                  {/* Provider Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                      <span className="block text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {providerDetails.karma_points || 0}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {isNp ? 'कर्म अंक' : 'Karma Points'}
                      </span>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                      <span className="block text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {providerDetails.total_jobs_completed || 0}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {isNp ? 'कुल काम' : 'Completed Jobs'}
                      </span>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center col-span-2 sm:col-span-1">
                      <span className="block text-2xl font-bold text-amber-500 dark:text-amber-400 flex items-center justify-center gap-1">
                        <Star size={18} fill="currentColor" />
                        {providerDetails.average_rating?.toFixed(1) || 'New'}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {isNp ? 'औसत मूल्याङ्कन' : 'Average Rating'}
                      </span>
                    </div>
                  </div>

                  {/* Level & Profession */}
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                    <div>
                      <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                        {isNp ? 'पेशा' : 'Profession'}
                      </h3>
                      <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        {providerDetails.profession || 'Service Provider'}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                        {isNp ? 'कर्म स्तर' : 'Karma Level'}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          providerDetails.karma_level === 'PLATINUM' ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30' :
                          providerDetails.karma_level === 'GOLD' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30' :
                          providerDetails.karma_level === 'SILVER' ? 'bg-slate-200 text-slate-700 dark:bg-slate-600' :
                          'bg-amber-100 text-amber-700 dark:bg-amber-900/30'
                        }`}>
                          {providerDetails.karma_level || 'BRONZE'}
                        </span>
                        {profile.is_verified && (
                          <span className="inline-flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 font-semibold ml-2">
                            <Shield size={14} className="fill-violet-600 dark:fill-violet-400" />
                            {isNp ? 'प्रमाणित प्रदायक' : 'Verified Provider'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  {providerDetails.bio && (
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {isNp ? 'बायो' : 'Biography'}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {providerDetails.bio}
                      </p>
                    </div>
                  )}

                  {/* Skills */}
                  {providerDetails.skills && providerDetails.skills.length > 0 && (
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {isNp ? 'दक्षता' : 'Skills & Expertise'}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {providerDetails.skills.map((s: string) => (
                          <span
                            key={s}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700"
                          >
                            <CheckCircle2 size={12} className="text-violet-600 dark:text-violet-400" />
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 text-center py-12">
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                    {isNp ? 'प्रदायक विवरण सेटअप गरिएको छैन।' : 'No provider details setup yet.'}
                  </p>
                  <Link
                    to="/profile/edit"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-smooth"
                  >
                    Setup Provider Profile
                  </Link>
                </div>
              )}
            </>
          ) : (
              // Customer details info
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  {isNp ? 'हाम्रो कर्म समुदायमा स्वागत छ!' : 'Welcome to Hamro Karma Community!'}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {isNp 
                    ? 'हाम्रो कर्म नेपालको पहिलो कर्म-आधारित सेवा बजार हो। ग्राहकको रूपमा, तपाईंले स्थानीय सेवाहरू खोज्न, बुकिंग गर्न र प्रदायकहरूलाई मूल्याङ्कन गरेर उनीहरूको कर्म प्रोफाइल सुधार गर्न सक्नुहुन्छ।' 
                    : 'Hamro Karma is Nepal\'s first karma-based service marketplace. As a customer, you can search for local services, request bookings, and help service providers improve their community score by giving them fair ratings.'}
                </p>
                <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row gap-3">
                  <Link
                    to="/services"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-smooth"
                  >
                    {isNp ? 'सेवाहरू खोज्नुहोस्' : 'Find Services'}
                  </Link>
                  <Link
                    to="/ftl"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-smooth"
                  >
                    {isNp ? 'हराएको र भेटिएको' : 'Lost & Found'}
                  </Link>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
