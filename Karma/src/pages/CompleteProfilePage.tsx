import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Phone, Mail, Upload, AlertCircle, Loader2, Check } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { updateProfile, uploadProfilePhoto, AuthError } from '../lib/auth';
import { supabase } from '../lib/supabase';

const NEPAL_CITIES = ['Kathmandu', 'Lalitpur', 'Bhaktapur', 'Pokhara', 'Biratnagar', 'Janakpur', 'Dharan', 'Birgunj', 'Butwal', 'Nepalgunj'];

export default function CompleteProfilePage() {
  const { user, profile, fetchProfile } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState(profile?.avatar_url || '');
  const [formData, setFormData] = useState({
    city: profile?.city || '',
    phone: profile?.phone || '',
    email: profile?.email || '',
  });

  if (!user) {
    navigate('/login');
    return null;
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.city) {
      setError('City is required');
      return;
    }
    if (!formData.phone) {
      setError('Phone number is required');
      return;
    }

    setLoading(true);
    try {
      if (photoFile && user.id) {
        await uploadProfilePhoto(user.id, photoFile);
      }
      await updateProfile(user.id, {
        city: formData.city,
        phone: formData.phone,
        email: formData.email,
      });
      await fetchProfile(user.id);
      navigate('/dashboard');
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message);
      } else {
        setError('Failed to update profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="-m-4 lg:-m-6 bg-white dark:bg-slate-900 min-h-[calc(100vh-65px)]">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-heading text-slate-900 dark:text-slate-100 mb-2">
            Complete Your Profile
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Add your photo and location details
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 space-y-6"
        >
          {error && (
            <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle size={18} className="text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
              Profile Photo
            </label>
            <div className="flex items-end gap-6">
              <div className="flex-shrink-0">
                <div className="w-32 h-32 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center overflow-hidden border-2 border-slate-200 dark:border-slate-700">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <Upload size={32} className="text-slate-400 mx-auto mb-2" />
                      <p className="text-xs text-slate-500">Add photo</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                  id="photo-input"
                  disabled={loading}
                />
                <label htmlFor="photo-input" className="block">
                  <div className="px-6 py-4 border-2 border-dashed border-violet-300 dark:border-violet-700 rounded-lg bg-violet-50 dark:bg-violet-900/10 cursor-pointer hover:bg-violet-100 dark:hover:bg-violet-900/20 transition-smooth text-center">
                    <Upload size={24} className="text-violet-600 dark:text-violet-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-violet-700 dark:text-violet-300">Click to upload</p>
                    <p className="text-xs text-violet-500 dark:text-violet-400">JPG, PNG (max 5MB)</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              City/Location
            </label>
            <div className="relative">
              <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm"
                disabled={loading}
              >
                <option value="">Select your city</option>
                {NEPAL_CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+977 98XXXXXXXX"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-sm"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-700 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? 'Saving...' : 'Complete Profile'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              disabled={loading}
              className="flex-1 py-2.5 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-smooth disabled:opacity-50"
            >
              Skip for now
            </button>
          </div>

          <div className="p-3 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-lg flex items-start gap-3">
            <Check size={18} className="text-violet-600 dark:text-violet-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-violet-700 dark:text-violet-300">
              You can update your profile anytime in settings. Adding a photo increases your profile visibility.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
