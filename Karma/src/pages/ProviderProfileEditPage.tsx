import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, MapPin, Award, Loader2, AlertCircle, Save, Upload } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { updateProfile, uploadProfilePhoto, AuthError } from '../lib/auth';
import { api } from '../lib/api';

const NEPAL_CITIES = ['Kathmandu', 'Lalitpur', 'Bhaktapur', 'Pokhara', 'Biratnagar', 'Janakpur', 'Dharan', 'Birgunj', 'Butwal', 'Nepalgunj'];

const PROFESSIONS = [
  'Plumber', 'Electrician', 'Carpenter', 'Painter', 'AC Technician',
  'Phone & Computer Repair', 'House Cleaner', 'Home Tutor', 'Driver',
  'Gardener', 'Mason', 'Welder',
];

export default function ProviderProfileEditPage() {
  const { user, profile, fetchProfile } = useAuthStore();
  const navigate = useNavigate();
  const [provider, setProvider] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState(profile?.avatar_url || '');

  const [formData, setFormData] = useState({
    profession: '',
    service_area: '',
    experience: 0,
    hourly_rate: 0,
    bio: '',
    skills: [] as string[],
    languages: [] as string[],
  });

  useEffect(() => {
    const fetchProvider = async () => {
      if (!profile?.id) return;
      try {
        const data = await api.get('/api/services/my-profile/');
        if (data) {
          setProvider(data);
          setFormData({
            profession: data.profession || '',
            service_area: data.service_area || '',
            experience: data.experience || 0,
            hourly_rate: data.hourly_rate || 0,
            bio: data.bio || '',
            skills: data.skills || [],
            languages: data.languages || [],
          });
          if (data.avatar_url) setPhotoPreview(data.avatar_url);
        }
      } catch (error) {
        console.error('Error fetching provider:', error);
      }
    };
    fetchProvider();
  }, [profile?.id]);

  if (!user || !profile) {
    navigate('/login');
    return null;
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB');
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'experience' || name === 'hourly_rate') {
      setFormData((prev) => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddSkill = () => {
    const skill = prompt('Enter a skill (e.g., "Plumbing repair")');
    if (skill && !formData.skills.includes(skill)) {
      setFormData((prev) => ({ ...prev, skills: [...prev.skills, skill] }));
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData((prev) => ({ ...prev, skills: prev.skills.filter((s) => s !== skillToRemove) }));
  };

  const handleAddLanguage = () => {
    const lang = prompt('Enter language (e.g., "English", "Nepali")');
    if (lang && !formData.languages.includes(lang)) {
      setFormData((prev) => ({ ...prev, languages: [...prev.languages, lang] }));
    }
  };

  const handleRemoveLanguage = (langToRemove: string) => {
    setFormData((prev) => ({ ...prev, languages: prev.languages.filter((l) => l !== langToRemove) }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      if (!formData.profession) { setError('Profession is required'); setSaving(false); return; }
      if (!formData.service_area) { setError('Service area is required'); setSaving(false); return; }
      if (photoFile && user.id) await uploadProfilePhoto(user.id, photoFile);
      if (provider?.id) {
        await api.patch('/api/services/my-profile/', {
          profession: formData.profession,
          service_area: formData.service_area,
          experience: formData.experience,
          hourly_rate: formData.hourly_rate,
          bio: formData.bio,
          skills: formData.skills,
          languages: formData.languages,
        });
      }
      await updateProfile(user.id, { city: formData.service_area });
      await fetchProfile(user.id);
      setSuccess('Profile updated successfully!');
      setPhotoFile(null);
    } catch (err) {
      if (err instanceof AuthError) setError(err.message);
      else setError('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const calculateCompletion = () => {
    let completed = 0;
    if (formData.profession) completed += 20;
    if (formData.service_area) completed += 20;
    if (formData.bio) completed += 20;
    if (formData.experience > 0) completed += 20;
    if (formData.hourly_rate > 0) completed += 20;
    return completed;
  };

  const completion = calculateCompletion();

  return (
    <div className="-m-4 lg:-m-6 bg-white dark:bg-slate-900 min-h-[calc(100vh-65px)]">
      <div className="relative h-48 bg-violet-600 overflow-hidden">
        {photoPreview && (
          <img
            src={photoPreview}
            alt="Profile background"
            className="w-full h-full object-cover opacity-30"
          />
        )}
        <div className="absolute inset-0 bg-violet-600/80" />
        <div className="relative h-full flex items-end px-4 md:px-6 pb-6">
          <div className="flex items-end gap-6">
            <div className="relative -mb-16">
              <div className="w-32 h-32 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden border-4 border-white dark:border-slate-800">
                {photoPreview ? (
                  <img src={photoPreview} alt={profile.full_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-4xl font-bold text-violet-600">
                    {profile.full_name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            <div className="mb-4">
              <h1 className="text-2xl font-bold font-heading text-white">{profile.full_name}</h1>
              <p className="text-violet-100">{formData.profession || 'Service Provider'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        {error && (
          <div className="mb-6 flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <AlertCircle size={18} className="text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
            <p className="text-sm text-emerald-700 dark:text-emerald-300">{success}</p>
          </div>
        )}

        <div className="mb-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Profile Completion</h2>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div
              className="bg-violet-600 h-2 rounded-full transition-all"
              style={{ width: `${completion}%` }}
            />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{completion}% complete</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-bold font-heading text-slate-900 dark:text-slate-100 mb-6">
              Profile Photo
            </h2>
            <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" id="photo-input" />
            <label htmlFor="photo-input">
              <div className="px-6 py-8 border-2 border-dashed border-violet-300 dark:border-violet-700 rounded-lg bg-violet-50 dark:bg-violet-900/10 cursor-pointer hover:bg-violet-100 dark:hover:bg-violet-900/20 transition-smooth text-center">
                <Upload size={32} className="text-violet-600 dark:text-violet-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-violet-700 dark:text-violet-300">Click to upload new photo</p>
                <p className="text-xs text-violet-500 dark:text-violet-400">JPG, PNG (max 5MB)</p>
              </div>
            </label>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-5">
            <h2 className="text-lg font-bold font-heading text-slate-900 dark:text-slate-100">
              Professional Information
            </h2>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Profession/Trade
              </label>
              <div className="relative">
                <Briefcase size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  name="profession"
                  value={formData.profession}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm"
                >
                  <option value="">Select your profession</option>
                  {PROFESSIONS.map((prof) => (
                    <option key={prof} value={prof}>{prof}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Service Area
              </label>
              <div className="relative">
                <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  name="service_area"
                  value={formData.service_area}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm"
                >
                  <option value="">Select your service area</option>
                  {NEPAL_CITIES.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Years of Experience
              </label>
              <input
                type="number"
                name="experience"
                value={formData.experience}
                onChange={handleInputChange}
                min="0"
                max="50"
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Hourly Rate (NPR)
              </label>
              <input
                type="number"
                name="hourly_rate"
                value={formData.hourly_rate}
                onChange={handleInputChange}
                min="0"
                step="50"
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Starting rate. Final price is negotiated with each customer.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                About You
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Tell customers about your experience, specialties, and approach to work..."
                rows={4}
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {formData.bio.length}/500 characters
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-bold font-heading text-slate-900 dark:text-slate-100 mb-6">
              Skills & Languages
            </h2>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Skills
                </label>
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="text-sm px-3 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-lg hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-smooth"
                >
                  + Add Skill
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.skills.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No skills added yet</p>
                ) : (
                  formData.skills.map((skill) => (
                    <div
                      key={skill}
                      className="flex items-center gap-2 px-3 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full text-sm"
                    >
                      <span>{skill}</span>
                      <button type="button" onClick={() => handleRemoveSkill(skill)} className="hover:text-violet-900 dark:hover:text-violet-100">
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Languages
                </label>
                <button
                  type="button"
                  onClick={handleAddLanguage}
                  className="text-sm px-3 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-lg hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-smooth"
                >
                  + Add Language
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.languages.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No languages added yet</p>
                ) : (
                  formData.languages.map((lang) => (
                    <div
                      key={lang}
                      className="flex items-center gap-2 px-3 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full text-sm"
                    >
                      <span>{lang}</span>
                      <button type="button" onClick={() => handleRemoveLanguage(lang)} className="hover:text-violet-900 dark:hover:text-violet-100">
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-700 transition-smooth disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 size={18} className="animate-spin" />}
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
