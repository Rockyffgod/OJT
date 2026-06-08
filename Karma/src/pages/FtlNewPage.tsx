import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Upload, Check, X, Image as ImageIcon } from 'lucide-react';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useTrans } from '../i18n';
import { useToast } from '../hooks/useToast';

const FTL_TYPES: { key: string; labelKey: string }[] = [
  { key: 'ITEM', labelKey: 'ftl.lostItem' },
  { key: 'PET', labelKey: 'ftl.lostPet' },
  { key: 'PERSON', labelKey: 'ftl.missingPerson' },
  { key: 'VEHICLE', labelKey: 'ftl.filterVehicle' },
];

export default function FtlNewPage() {
  const { t } = useTrans();
  const { user } = useAuthStore();
  const toast = useToast();
  const navigate = useNavigate();

  const [type, setType] = useState<string>('ITEM');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [lastSeen, setLastSeen] = useState('');
  const [contactMethod, setContactMethod] = useState<'PHONE' | 'EMAIL'>('PHONE');
  const [contactValue, setContactValue] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  const [submitting, setSubmitting] = useState(false);

  if (!user) {
    navigate('/login', { replace: true });
    return null;
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !lastSeen.trim() || !contactValue.trim()) {
      toast.error('Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        const fd = new FormData();
        fd.append('file', imageFile);
        const uploadResult: any = await api.upload('/api/services/upload/', fd);
        imageUrl = uploadResult.url || null;
      }

      await api.post('/api/ftl/', {
        type,
        title: title.trim(),
        description: description.trim(),
        last_seen_location: lastSeen.trim(),
        contact_method: contactMethod,
        contact_value: contactValue.trim(),
        image_url: imageUrl,
        status: 'OPEN',
      });

      toast.success(t('ftl.alertPosted'));
      navigate('/ftl');
    } catch (e: any) {
      console.error('Failed to create alert:', e);
      toast.error(e?.message || t('toast.networkError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-8">
      <Link
        to="/ftl"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-6 transition-smooth"
      >
        <ArrowLeft size={16} />
        {t('common.back')}
      </Link>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h1 className="text-2xl font-bold font-heading text-slate-900 dark:text-slate-100 mb-1">
          {t('ftl.newAlert')}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          {t('ftl.subtitle')}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t('ftl.description')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="Describe what was lost, who was missing, or what happened..."
                className="w-full px-4 py-3 pr-28 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm resize-none"
              />

            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t('ftl.type')} <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {FTL_TYPES.map((ft) => (
                <button
                  key={ft.key}
                  type="button"
                  onClick={() => setType(ft.key)}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium border transition-smooth ${
                    type === ft.key
                      ? 'border-violet-600 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
                      : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {t(ft.labelKey)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t('ftl.titleLabel')} <span className="text-red-500">*</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Black wallet near Thamel"
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t('ftl.lastSeen')} <span className="text-red-500">*</span>
            </label>
            <input
              value={lastSeen}
              onChange={(e) => setLastSeen(e.target.value)}
              placeholder="e.g. New Road, Kathmandu"
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('ftl.contactMethod')}
              </label>
              <select
                value={contactMethod}
                onChange={(e) => setContactMethod(e.target.value as 'PHONE' | 'EMAIL')}
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm"
              >
                <option value="PHONE">{t('ftl.phone')}</option>
                <option value="EMAIL">{t('ftl.email')}</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('ftl.contactValue')} <span className="text-red-500">*</span>
              </label>
              <input
                value={contactValue}
                onChange={(e) => setContactValue(e.target.value)}
                placeholder={contactMethod === 'PHONE' ? '+977 98XXXXXXXX' : 'name@example.com'}
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t('ftl.uploadImage')}
            </label>
            {imagePreview ? (
              <div className="relative inline-block">
                <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded-lg border border-slate-200 dark:border-slate-600" />
                <button type="button" onClick={removeImage} className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-smooth" aria-label="Remove image">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center px-6 py-8 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900/50 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-smooth">
                <ImageIcon size={28} className="text-slate-400 mb-2" />
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Click to upload</p>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">JPG, PNG (max 5MB)</p>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={submitting} className="flex-1 px-6 py-2.5 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-smooth disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {t('ftl.submit')}
            </button>
            <Link to="/ftl" className="px-5 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-smooth">
              {t('common.cancel')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
