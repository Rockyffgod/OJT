import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Shield, Upload, Lock, Loader2, CheckCircle2, AlertCircle, ArrowLeft,
  X,
} from 'lucide-react';
import { supabase, VerificationStatus } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useTrans } from '../i18n';
import { useToast } from '../hooks/useToast';

type DocType = 'CITIZENSHIP' | 'PASSPORT' | 'LICENSE';

const docLabels: Record<DocType, string> = {
  CITIZENSHIP: 'verify.citizenship',
  PASSPORT: 'verify.passport',
  LICENSE: 'verify.license',
};

interface BannerConfig {
  bg: string;
  text: string;
  border: string;
  Icon: any;
}

const bannerFor = (status: VerificationStatus | undefined): BannerConfig => {
  switch (status) {
    case 'APPROVED':
    case 'VERIFIED':
      return {
        bg: 'bg-green-50 dark:bg-green-900/20',
        text: 'text-green-700 dark:text-green-300',
        border: 'border-green-200 dark:border-green-800',
        Icon: CheckCircle2,
      };
    case 'SUBMITTED':
      return {
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-800',
        Icon: AlertCircle,
      };
    case 'REJECTED':
      return {
        bg: 'bg-red-50 dark:bg-red-900/20',
        text: 'text-red-700 dark:text-red-300',
        border: 'border-red-200 dark:border-red-800',
        Icon: AlertCircle,
      };
    default:
      return {
        bg: 'bg-slate-50 dark:bg-slate-800/50',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-200 dark:border-slate-700',
        Icon: Shield,
      };
  }
};

export default function VerifyIdentityPage() {
  const { t } = useTrans();
  const toast = useToast();
  const navigate = useNavigate();
  const { user, profile, fetchProfile } = useAuthStore();

  const [status, setStatus] = useState<VerificationStatus>(profile?.verification_status || 'PENDING');
  const [docType, setDocType] = useState<DocType>('CITIZENSHIP');
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string>('');
  const [backPreview, setBackPreview] = useState<string>('');
  const [selfiePreview, setSelfiePreview] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (profile?.verification_status) setStatus(profile.verification_status);
  }, [profile?.verification_status]);

  if (!user) {
    navigate('/login', { replace: true });
    return null;
  }

  const handleFile = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (f: File | null) => void,
    previewSetter: (s: string) => void
  ) => {
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
    setter(file);
    const reader = new FileReader();
    reader.onloadend = () => previewSetter(reader.result as string);
    reader.readAsDataURL(file);
  };

  const clearFile = (
    setter: (f: File | null) => void,
    previewSetter: (s: string) => void
  ) => {
    setter(null);
    previewSetter('');
  };

  const uploadDoc = async (file: File, docSlot: string): Promise<string> => {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${user.id}/${docSlot}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('identity-docs')
      .upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('identity-docs').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!frontFile) {
      toast.error('Front image is required');
      return;
    }

    setSubmitting(true);
    try {
      const frontUrl = await uploadDoc(frontFile, 'front');
      const backUrl = backFile ? await uploadDoc(backFile, 'back') : null;
      const selfieUrl = selfieFile ? await uploadDoc(selfieFile, 'selfie') : null;

      const { error } = await supabase
        .from('profiles')
        .update({
          verification_status: 'SUBMITTED',
          document_type: docType,
          document_front_url: frontUrl,
          document_back_url: backUrl,
          document_selfie_url: selfieUrl,
          document_submitted_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      await fetchProfile(user.id);
      setStatus('SUBMITTED');
      toast.success(t('verify.submitSuccess'));
    } catch (e: any) {
      console.error('Submit failed:', e);
      toast.error(e?.message || t('toast.networkError'));
    } finally {
      setSubmitting(false);
    }
  };

  const banner = bannerFor(status);
  const isApproved = status === 'APPROVED' || status === 'VERIFIED';
  const isSubmitted = status === 'SUBMITTED';
  const showForm = status === 'PENDING' || status === 'REJECTED' || !status;

  const bannerKey = (() => {
    if (isApproved) return 'verify.bannerVerified';
    if (isSubmitted) return 'verify.bannerSubmitted';
    if (status === 'REJECTED') return 'verify.bannerRejected';
    return 'verify.bannerPending';
  })();

  const BannerIcon = banner.Icon;

  return (
    <div className="max-w-xl mx-auto pb-8">
      <Link
        to="/profile"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-6 transition-smooth"
      >
        <ArrowLeft size={16} />
        {t('common.back')}
      </Link>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
            <Shield size={20} className="text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-heading text-slate-900 dark:text-slate-100">
              {t('verify.title')}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('verify.subtitle')}</p>
          </div>
        </div>

        {/* Status banner */}
        <div className={`mt-5 p-4 rounded-lg border flex items-start gap-3 ${banner.bg} ${banner.border}`}>
          <BannerIcon size={18} className={`${banner.text} flex-shrink-0 mt-0.5`} />
          <p className={`text-sm ${banner.text}`}>{t(bannerKey)}</p>
        </div>

        {isApproved && (
          <div className="mt-6">
            <Link
              to="/profile"
              className="block w-full text-center px-5 py-2.5 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-smooth"
            >
              {t('verify.returnToProfile')}
            </Link>
          </div>
        )}

        {isSubmitted && !isApproved && (
          <p className="mt-6 text-xs text-slate-500 dark:text-slate-400 text-center">
            We will notify you at <span className="font-medium text-slate-700 dark:text-slate-300">{profile?.email}</span> once your documents are reviewed.
          </p>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {/* Document type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('verify.documentType')} <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(docLabels) as DocType[]).map((dt) => (
                  <button
                    key={dt}
                    type="button"
                    onClick={() => setDocType(dt)}
                    className={`px-3 py-2.5 rounded-lg text-sm font-medium border transition-smooth ${
                      docType === dt
                        ? 'border-violet-600 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
                        : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {t(docLabels[dt])}
                  </button>
                ))}
              </div>
            </div>

            {/* Front image */}
            <DocDropzone
              label={t('verify.frontImage')}
              required
              preview={frontPreview}
              onChange={(e) => handleFile(e, setFrontFile, setFrontPreview)}
              onClear={() => clearFile(setFrontFile, setFrontPreview)}
            />

            {/* Back image */}
            <DocDropzone
              label={t('verify.backImage')}
              preview={backPreview}
              onChange={(e) => handleFile(e, setBackFile, setBackPreview)}
              onClear={() => clearFile(setBackFile, setBackPreview)}
            />

            {/* Selfie with doc */}
            <DocDropzone
              label={t('verify.selfieWithDoc')}
              preview={selfiePreview}
              onChange={(e) => handleFile(e, setSelfieFile, setSelfiePreview)}
              onClear={() => clearFile(setSelfieFile, setSelfiePreview)}
            />

            <div className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Lock size={12} className="mt-0.5 flex-shrink-0" />
              <p>{t('verify.encryptedNote')}</p>
            </div>

            <button
              type="submit"
              disabled={submitting || !frontFile}
              className="w-full px-5 py-2.5 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-smooth disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {t('verify.submit')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function DocDropzone({
  label,
  required,
  preview,
  onChange,
  onClear,
}: {
  label: string;
  required?: boolean;
  preview: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}) {
  const { t } = useTrans();
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {!required && <span className="text-xs text-slate-400 dark:text-slate-500 ml-1">({t('common.optional')})</span>}
      </label>
      {preview ? (
        <div className="relative inline-block">
          <img
            src={preview}
            alt={label}
            className="w-32 h-32 object-cover rounded-lg border border-slate-200 dark:border-slate-600"
          />
          <button
            type="button"
            onClick={onClear}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-smooth"
            aria-label="Remove"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center px-6 py-6 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900/50 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-smooth">
          <Upload size={20} className="text-slate-400 mb-1.5" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Click to upload</p>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">JPG, PNG (max 5MB)</p>
          <input type="file" accept="image/*" onChange={onChange} className="hidden" />
        </label>
      )}
    </div>
  );
}
