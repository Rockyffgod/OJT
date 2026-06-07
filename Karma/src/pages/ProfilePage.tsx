import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useTrans } from '../i18n';
import { api } from '../lib/api';
import { updateProfile, uploadProfilePhoto } from '../lib/auth';
import { Star, MapPin, Mail, Phone, User, Save, X, Camera, Loader2, Briefcase } from 'lucide-react';

const NEPAL_CITIES = ['Kathmandu', 'Lalitpur', 'Bhaktapur', 'Pokhara', 'Biratnagar', 'Janakpur', 'Dharan', 'Birgunj', 'Butwal', 'Nepalgunj'];
type Tab = 'view' | 'edit';

export default function ProfilePage() {
  const { profile, user, fetchProfile } = useAuthStore();
  const { t, isNp } = useTrans();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('view');
  const [providerDetails, setProviderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState(profile?.avatar_url || '');

  const initialNames = (() => {
    const full = profile?.full_name || '';
    const parts = full.split(' ');
    return { first: parts[0] || '', last: parts.slice(1).join(' ') || '' };
  })();

  const [formData, setFormData] = useState({
    firstName: initialNames.first,
    lastName: initialNames.last,
    email: profile?.email || '',
    phone: profile?.phone || '',
    city: profile?.city || '',
  });

  const [providerForm, setProviderForm] = useState({
    bio: '',
    profession: '',
    skills: '',
    hourly_rate: '',
    service_area: '',
  });

  if (!profile || !user) {
    navigate('/login', { replace: true });
    return null;
  }

  const isProvider = profile.account_type === 'PROVIDER';

  useEffect(() => {
    if (!isProvider) return;
    (async () => {
      try {
        const data = await api.get('/api/services/my-profile/');
        setProviderDetails(data);
        setProviderForm({
          bio: data.bio || '',
          profession: data.profession || '',
          skills: (data.skills || []).join(', '),
          hourly_rate: data.hourly_rate?.toString() || '',
          service_area: data.service_area || '',
        });
      } catch { /* no provider profile yet */ }
    })();
  }, [isProvider]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Only image files allowed'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Image must be less than 5MB'); return; }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
    setError('');
  };

  const handleSave = async () => {
    setSaving(true); setError(''); setSuccess('');
    try {
      if (photoFile) await uploadProfilePhoto(user.id, photoFile);
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
      await updateProfile(user.id, { full_name: fullName, email: formData.email, phone: formData.phone, city: formData.city } as any);
      if (isProvider) {
        const body: any = {};
        if (providerForm.bio) body.bio = providerForm.bio;
        if (providerForm.profession) body.profession = providerForm.profession;
        if (providerForm.skills.trim()) body.skills = providerForm.skills.split(',').map((s) => s.trim()).filter(Boolean);
        if (providerForm.hourly_rate) body.hourly_rate = parseFloat(providerForm.hourly_rate);
        if (providerForm.service_area) body.service_area = providerForm.service_area;
        if (Object.keys(body).length) await api.patch('/api/services/my-profile/', body);
      }
      await fetchProfile(user.id);
      if (isProvider) {
        const data = await api.get('/api/services/my-profile/');
        setProviderDetails(data);
      }
      setSuccess(isNp ? 'प्रोफाइल अपडेट गरियो' : 'Profile updated');
      setPhotoFile(null);
      setTab('view');
    } catch (err: any) {
      setError(err?.message || 'Failed to update profile');
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-heading text-slate-900 dark:text-slate-100">
          {t('nav.profile')}
        </h1>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2">
        <button onClick={() => { setTab('view'); setError(''); setSuccess(''); }}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-smooth ${
            tab === 'view' ? 'bg-violet-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-slate-100'
          }`}>
          {isNp ? 'हेर्नुहोस्' : 'View'}
        </button>
        <button onClick={() => { setTab('edit'); setError(''); setSuccess(''); }}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-smooth ${
            tab === 'edit' ? 'bg-violet-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-slate-100'
          }`}>
          {isNp ? 'सम्पादन गर्नुहोस्' : 'Edit'}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
        </div>
      )}
      {success && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
          <p className="text-sm text-emerald-700 dark:text-emerald-300">{success}</p>
        </div>
      )}

      {tab === 'view' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 text-center relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-violet-500 to-indigo-600" />
              <div className="w-24 h-24 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-300 text-3xl font-bold overflow-hidden mx-auto mb-4 border-2 border-white dark:border-slate-800 shadow-sm mt-4">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                ) : (
                  profile.full_name?.charAt(0)?.toUpperCase() || '?'
                )}
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{profile.full_name}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{profile.email}</p>
              <div className="mt-4 flex justify-center">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                  isProvider
                    ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                }`}>
                  {isProvider ? <Briefcase size={12} /> : <User size={12} />}
                  {isProvider ? (isNp ? 'प्रदायक' : 'Service Provider') : (isNp ? 'ग्राहक' : 'Customer')}
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm border-b border-slate-100 dark:border-slate-700 pb-2">
                {isNp ? 'सम्पर्क' : 'Contact'}
              </h3>
              <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                {profile.email && <div className="flex items-center gap-3"><Mail size={16} className="text-slate-400 flex-shrink-0" /><span className="truncate">{profile.email}</span></div>}
                {profile.phone && <div className="flex items-center gap-3"><Phone size={16} className="text-slate-400 flex-shrink-0" /><span>{profile.phone}</span></div>}
                {profile.city && <div className="flex items-center gap-3"><MapPin size={16} className="text-slate-400 flex-shrink-0" /><span>{profile.city}</span></div>}
              </div>
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            {isProvider ? (
              loading ? (
                <div className="bg-white dark:bg-slate-800 p-12 rounded-xl border border-slate-200 dark:border-slate-700 text-center text-slate-400">{t('common.loading')}</div>
              ) : providerDetails ? (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                      <span className="block text-2xl font-bold text-slate-900 dark:text-slate-100">{providerDetails.karma_points || 0}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{isNp ? 'कर्म' : 'Karma'}</span>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                      <span className="block text-2xl font-bold text-slate-900 dark:text-slate-100">{providerDetails.total_jobs_completed || 0}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{isNp ? 'कामहरू' : 'Jobs'}</span>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                      <span className="block text-2xl font-bold text-amber-500 dark:text-amber-400 flex items-center justify-center gap-1">
                        <Star size={18} fill="currentColor" />{providerDetails.average_rating?.toFixed(1) || 'New'}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{isNp ? 'रेटिङ' : 'Rating'}</span>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                    <div>
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{isNp ? 'पेशा' : 'Profession'}</h3>
                      <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{providerDetails.profession || 'Service Provider'}</p>
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{isNp ? 'कर्म स्तर' : 'Karma Level'}</h3>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          providerDetails.karma_level === 'PLATINUM' ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30' :
                          providerDetails.karma_level === 'GOLD' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30' :
                          providerDetails.karma_level === 'SILVER' ? 'bg-slate-200 text-slate-700 dark:bg-slate-600' :
                          'bg-amber-100 text-amber-700 dark:bg-amber-900/30'
                        }`}>{providerDetails.karma_level || 'BRONZE'}</span>
                      </div>
                    </div>
                  </div>

                  {providerDetails.bio && (
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">{isNp ? 'बायो' : 'Bio'}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{providerDetails.bio}</p>
                    </div>
                  )}

                  {providerDetails.skills?.length > 0 && (
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">{isNp ? 'दक्षता' : 'Skills'}</h3>
                      <div className="flex flex-wrap gap-2">
                        {providerDetails.skills.map((s: string) => (
                          <span key={s} className="px-3 py-1 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700">
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
                    {isNp ? 'प्रदायक प्रोफाइल सेटअप गरिएको छैन।' : 'No provider profile yet.'}
                  </p>
                  <button onClick={() => setTab('edit')} className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-smooth">
                    {isNp ? 'सेटअप गर्नुहोस्' : 'Setup Profile'}
                  </button>
                </div>
              )
            ) : (
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">{isNp ? 'हाम्रो कर्म समुदायमा स्वागत छ!' : 'Welcome to Hamro Karma!'}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {isNp
                    ? 'हाम्रो कर्म नेपालको पहिलो कर्म-आधारित सेवा बजार हो। ग्राहकको रूपमा, तपाईंले स्थानीय सेवाहरू खोज्न, बुकिंग गर्न र प्रदायकहरूलाई मूल्याङ्कन गर्न सक्नुहुन्छ।'
                    : 'Browse local services, request bookings, and help providers build their community reputation.'}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Edit tab - Profile photo */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-5">
            <h2 className="text-lg font-bold font-heading text-slate-900 dark:text-slate-100">
              {isNp ? 'प्रोफाइल फोटो' : 'Profile Photo'}
            </h2>
            <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" id="edit-photo-input" />
            <label htmlFor="edit-photo-input" className="cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-300 text-2xl font-bold overflow-hidden border-2 border-slate-200 dark:border-slate-600">
                  {photoPreview ? (
                    <img src={photoPreview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    profile.full_name?.charAt(0)?.toUpperCase() || '?'
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-smooth">
                    <Camera size={20} className="text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-violet-700 dark:text-violet-300">{isNp ? 'फोटो परिवर्तन गर्न क्लिक गर्नुहोस्' : 'Click to change photo'}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">JPG, PNG (max 5MB)</p>
                </div>
              </div>
            </label>
            {photoFile && (
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <span>{photoFile.name}</span>
                <button onClick={() => { setPhotoFile(null); setPhotoPreview(profile?.avatar_url || ''); }}>
                  <X size={14} className="text-red-500" />
                </button>
              </div>
            )}
          </div>

          {/* Edit tab - Personal info */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-5">
            <h2 className="text-lg font-bold font-heading text-slate-900 dark:text-slate-100">
              {isNp ? 'व्यक्तिगत जानकारी' : 'Personal Information'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{isNp ? 'पहिलो नाम' : 'First Name'}</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={formData.firstName} onChange={(e) => setFormData((p) => ({ ...p, firstName: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{isNp ? 'थर' : 'Last Name'}</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={formData.lastName} onChange={(e) => setFormData((p) => ({ ...p, lastName: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={formData.email} onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{isNp ? 'फोन' : 'Phone'}</label>
              <div className="relative">
                <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={formData.phone} onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{isNp ? 'शहर' : 'City'}</label>
              <div className="relative">
                <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select value={formData.city} onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm">
                  <option value="">{isNp ? 'शहर चयन गर्नुहोस्' : 'Select city'}</option>
                  {NEPAL_CITIES.map((c) => (<option key={c} value={c}>{c}</option>))}
                </select>
              </div>
            </div>
          </div>

          {/* Edit tab - Provider section */}
          {isProvider && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-5">
              <h2 className="text-lg font-bold font-heading text-slate-900 dark:text-slate-100">
                {isNp ? 'प्रदायक विवरण' : 'Provider Details'}
              </h2>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{isNp ? 'पेशा' : 'Profession'}</label>
                <input value={providerForm.profession} onChange={(e) => setProviderForm((p) => ({ ...p, profession: e.target.value }))}
                  placeholder="e.g. Plumber, Electrician"
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{isNp ? 'बायो' : 'Bio'}</label>
                <textarea value={providerForm.bio} onChange={(e) => setProviderForm((p) => ({ ...p, bio: e.target.value }))} rows={4}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{isNp ? 'दक्षता' : 'Skills'} <span className="text-xs text-slate-400">(comma-separated)</span></label>
                <input value={providerForm.skills} onChange={(e) => setProviderForm((p) => ({ ...p, skills: e.target.value }))}
                  placeholder="e.g. Plumbing, Pipe Repair, Water Heater"
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{isNp ? 'प्रति घण्टा दर' : 'Hourly Rate (NPR)'}</label>
                  <input type="number" value={providerForm.hourly_rate} onChange={(e) => setProviderForm((p) => ({ ...p, hourly_rate: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{isNp ? 'सेवा क्षेत्र' : 'Service Area'}</label>
                  <input value={providerForm.service_area} onChange={(e) => setProviderForm((p) => ({ ...p, service_area: e.target.value }))}
                    placeholder="e.g. Kathmandu, Lalitpur"
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm" />
                </div>
              </div>
            </div>
          )}

          {/* Save / Cancel */}
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-2.5 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-700 transition-smooth disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={16} />}
              {saving ? (isNp ? 'बचत गर्दै...' : 'Saving...') : (isNp ? 'बचत गर्नुहोस्' : 'Save Changes')}
            </button>
            <button onClick={() => { setTab('view'); setError(''); setSuccess(''); }}
              className="px-6 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-smooth flex items-center gap-2">
              <X size={16} />
              {isNp ? 'रद्द गर्नुहोस्' : 'Cancel'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
