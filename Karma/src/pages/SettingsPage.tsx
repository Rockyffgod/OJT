import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, Globe, User, Upload, Loader2, Shield, Bell, Eye, Trash2, AlertTriangle, X, Check } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { updateProfile, uploadProfilePhoto } from '../lib/auth';
import { api } from '../lib/api';
import { useTrans } from '../i18n';

const NEPAL_CITIES = ['Kathmandu', 'Lalitpur', 'Bhaktapur', 'Pokhara', 'Biratnagar', 'Janakpur', 'Dharan', 'Birgunj', 'Butwal', 'Nepalgunj'];

export default function SettingsPage() {
  const { user, profile, fetchProfile, logout } = useAuthStore();
  const { isNp, setLang, lang } = useTrans();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState(profile?.avatar_url || '');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return document.documentElement.classList.contains('dark');
  });

  const [notifPrefs, setNotifPrefs] = useState(() => ({
    email: localStorage.getItem('notif_email') !== 'false',
    push: localStorage.getItem('notif_push') !== 'false',
  }));

  const [privacyPrefs, setPrivacyPrefs] = useState(() => ({
    showProfile: localStorage.getItem('privacy_show_profile') !== 'false',
    showPhone: localStorage.getItem('privacy_show_phone') === 'true',
  }));

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

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  if (!user || !profile) {
    navigate('/login');
    return null;
  }

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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      if (photoFile) await uploadProfilePhoto(user.id, photoFile);
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
      await updateProfile(user.id, { full_name: fullName, email: formData.email, phone: formData.phone, city: formData.city } as any);
      await fetchProfile(user.id);
      setSuccess(isNp ? 'प्रोफाइल अपडेट गरियो' : 'Profile updated');
      setPhotoFile(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to update profile');
    } finally { setSaving(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!passwordData.newPassword) { setError('New password is required'); return; }
    if (passwordData.newPassword.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (passwordData.newPassword !== passwordData.confirmPassword) { setError('Passwords do not match'); return; }
    setSaving(true);
    try {
      await api.post('/api/accounts/change-password/', { old_password: passwordData.currentPassword, new_password: passwordData.newPassword });
      setSuccess(isNp ? 'पासवर्ड परिवर्तन गरियो' : 'Password changed');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setError(err?.message || 'Failed to change password');
    } finally { setSaving(false); }
  };

  const toggleNotif = (key: 'email' | 'push') => {
    setNotifPrefs((p) => {
      const next = { ...p, [key]: !p[key] };
      localStorage.setItem(`notif_${key}`, String(next[key]));
      return next;
    });
  };

  const togglePrivacy = (key: 'showProfile' | 'showPhone') => {
    setPrivacyPrefs((p) => {
      const next = { ...p, [key]: !p[key] };
      const mapped = key === 'showProfile' ? 'privacy_show_profile' : 'privacy_show_phone';
      localStorage.setItem(mapped, String(next[key]));
      return next;
    });
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await api.delete('/api/accounts/me/');
      logout();
      navigate('/login');
    } catch (err: any) {
      setError(err?.message || 'Failed to delete account');
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-5 ${className}`}>
      {children}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto pb-8 space-y-6">
      <h1 className="text-2xl font-bold font-heading text-slate-900 dark:text-slate-100">
        {isNp ? 'सेटिङ्गहरू' : 'Settings'}
      </h1>

      {error && (
        <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertTriangle size={18} className="text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}
      {success && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
          <div className="flex items-center gap-2">
            <Check size={16} className="text-emerald-600 dark:text-emerald-400" />
            <p className="text-sm text-emerald-700 dark:text-emerald-300">{success}</p>
          </div>
        </div>
      )}

      {/* Theme */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              {dark ? <Moon size={20} className="text-amber-600 dark:text-amber-400" /> : <Sun size={20} className="text-amber-600 dark:text-amber-400" />}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{isNp ? 'थिम' : 'Theme'}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{isNp ? 'गाढा वा हल्का मोड' : 'Dark or light mode'}</p>
            </div>
          </div>
          <button onClick={() => setDark(!dark)}
            className={`relative w-12 h-6 rounded-full transition-smooth ${dark ? 'bg-violet-600' : 'bg-slate-300'}`}>
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-smooth ${dark ? 'left-6' : 'left-0.5'}`} />
          </button>
        </div>
      </Card>

      {/* Language */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <Globe size={20} className="text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{isNp ? 'भाषा' : 'Language'}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{isNp ? 'अन्तरफल भाषा' : 'Interface language'}</p>
            </div>
          </div>
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 p-0.5 rounded-lg">
            <button onClick={() => setLang('en')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-smooth ${lang === 'en' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500'}`}>
              EN
            </button>
            <button onClick={() => setLang('np')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-smooth ${lang === 'np' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500'}`}>
              नेपाली
            </button>
          </div>
        </div>
      </Card>

      {/* Profile Info */}
      <Card>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
            <User size={20} className="text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{isNp ? 'प्रोफाइल' : 'Profile Information'}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{isNp ? 'तपाईंको व्यक्तिगत विवरणहरू' : 'Your personal details'}</p>
          </div>
        </div>
        <form onSubmit={handleSaveProfile} className="space-y-5 pt-2">
          <div>
            <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" id="settings-photo" />
            <label htmlFor="settings-photo">
              <div className="flex items-center gap-4 p-4 border-2 border-dashed border-violet-300 dark:border-violet-700 rounded-lg bg-violet-50 dark:bg-violet-900/10 cursor-pointer hover:bg-violet-100 dark:hover:bg-violet-900/20 transition-smooth">
                <div className="w-14 h-14 rounded-full bg-violet-200 dark:bg-violet-800 flex items-center justify-center overflow-hidden text-violet-700 dark:text-violet-300 text-xl font-bold flex-shrink-0">
                  {photoPreview ? (
                    <img src={photoPreview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    profile.full_name?.charAt(0)?.toUpperCase() || '?'
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-violet-700 dark:text-violet-300 flex items-center gap-1.5">
                    <Upload size={14} /> {isNp ? 'फोटो अपलोड गर्नुहोस्' : 'Upload Photo'}
                  </p>
                  <p className="text-xs text-violet-500 dark:text-violet-400">JPG, PNG (max 5MB)</p>
                </div>
              </div>
            </label>
            {photoFile && (
              <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                <span>{photoFile.name}</span>
                <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview(profile?.avatar_url || ''); }}>
                  <X size={14} className="text-red-500" />
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{isNp ? 'पहिलो नाम' : 'First Name'}</label>
              <input value={formData.firstName} onChange={(e) => setFormData((p) => ({ ...p, firstName: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{isNp ? 'थर' : 'Last Name'}</label>
              <input value={formData.lastName} onChange={(e) => setFormData((p) => ({ ...p, lastName: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500" />
            </div>
          </div>
          <input value={formData.email} onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} placeholder="Email"
            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500" />
          <input value={formData.phone} onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))} placeholder="Phone"
            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500" />
          <select value={formData.city} onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500">
            <option value="">{isNp ? 'शहर चयन गर्नुहोस्' : 'Select city'}</option>
            {NEPAL_CITIES.map((c) => (<option key={c} value={c}>{c}</option>))}
          </select>
          <button type="submit" disabled={saving}
            className="w-full py-2.5 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-700 transition-smooth disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? (isNp ? 'बचत गर्दै...' : 'Saving...') : (isNp ? 'परिवर्तनहरू बचत गर्नुहोस्' : 'Save Changes')}
          </button>
        </form>
      </Card>

      {/* Password */}
      <Card>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
            <Shield size={20} className="text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{isNp ? 'पासवर्ड' : 'Password'}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{isNp ? 'तपाईंको पासवर्ड परिवर्तन गर्नुहोस्' : 'Change your password'}</p>
          </div>
        </div>
        <form onSubmit={handleChangePassword} className="space-y-4 pt-2">
          <input type="password" placeholder={isNp ? 'हालको पासवर्ड' : 'Current Password'} value={passwordData.currentPassword} onChange={(e) => setPasswordData((p) => ({ ...p, currentPassword: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500" />
          <input type="password" placeholder={isNp ? 'नयाँ पासवर्ड (कम्तीमा ८ वर्ण)' : 'New Password (min 8 chars)'} value={passwordData.newPassword} onChange={(e) => setPasswordData((p) => ({ ...p, newPassword: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500" />
          <input type="password" placeholder={isNp ? 'नयाँ पासवर्ड पुष्टि गर्नुहोस्' : 'Confirm New Password'} value={passwordData.confirmPassword} onChange={(e) => setPasswordData((p) => ({ ...p, confirmPassword: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500" />
          <button type="submit" disabled={saving}
            className="w-full py-2.5 bg-rose-600 text-white font-semibold rounded-lg hover:bg-rose-700 transition-smooth disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? (isNp ? 'अपडेट गर्दै...' : 'Updating...') : (isNp ? 'पासवर्ड अपडेट गर्नुहोस्' : 'Update Password')}
          </button>
        </form>
      </Card>

      {/* Notifications */}
      <Card>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <Bell size={20} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{isNp ? 'सूचनाहरू' : 'Notifications'}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{isNp ? 'सूचना प्राथमिकताहरू' : 'Notification preferences'}</p>
          </div>
        </div>
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-700 dark:text-slate-300">{isNp ? 'इमेल सूचनाहरू' : 'Email notifications'}</span>
            <button onClick={() => toggleNotif('email')}
              className={`relative w-10 h-5 rounded-full transition-smooth ${notifPrefs.email ? 'bg-violet-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-smooth ${notifPrefs.email ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-700 dark:text-slate-300">{isNp ? 'पुश सूचनाहरू' : 'Push notifications'}</span>
            <button onClick={() => toggleNotif('push')}
              className={`relative w-10 h-5 rounded-full transition-smooth ${notifPrefs.push ? 'bg-violet-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-smooth ${notifPrefs.push ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>
        </div>
      </Card>

      {/* Privacy */}
      <Card>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <Eye size={20} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{isNp ? 'गोपनीयता' : 'Privacy'}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{isNp ? 'तपाईंको प्रोफाइल दृश्यता' : 'Profile visibility controls'}</p>
          </div>
        </div>
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-700 dark:text-slate-300">{isNp ? 'प्रोफाइल देखाउनुहोस्' : 'Show profile publicly'}</span>
            <button onClick={() => togglePrivacy('showProfile')}
              className={`relative w-10 h-5 rounded-full transition-smooth ${privacyPrefs.showProfile ? 'bg-violet-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-smooth ${privacyPrefs.showProfile ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-700 dark:text-slate-300">{isNp ? 'फोन नम्बर देखाउनुहोस्' : 'Show phone number'}</span>
            <button onClick={() => togglePrivacy('showPhone')}
              className={`relative w-10 h-5 rounded-full transition-smooth ${privacyPrefs.showPhone ? 'bg-violet-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-smooth ${privacyPrefs.showPhone ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-red-200 dark:border-red-900/50 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <Trash2 size={20} className="text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-red-700 dark:text-red-400">{isNp ? 'खतरा क्षेत्र' : 'Danger Zone'}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{isNp ? 'यी कार्यहरू उल्टाउन सकिँदैन' : 'These actions cannot be undone'}</p>
          </div>
        </div>
        <button onClick={() => setShowDeleteModal(true)}
          className="w-full py-2.5 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 font-semibold rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-smooth flex items-center justify-center gap-2 text-sm">
          <Trash2 size={16} />
          {isNp ? 'खाता मेटाउनुहोस्' : 'Delete Account'}
        </button>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">{isNp ? 'खाता मेटाउने?' : 'Delete account?'}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{isNp ? 'यो कार्य उल्टाउन सकिँदैन।' : 'This action is permanent.'}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} disabled={deleting}
                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-smooth">
                {isNp ? 'रद्द गर्नुहोस्' : 'Cancel'}
              </button>
              <button onClick={handleDeleteAccount} disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 text-white font-semibold rounded-lg text-sm hover:bg-red-700 transition-smooth disabled:opacity-50 flex items-center justify-center gap-2">
                {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                {deleting ? (isNp ? 'मेट्दै...' : 'Deleting...') : (isNp ? 'मेटाउनुहोस्' : 'Delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
