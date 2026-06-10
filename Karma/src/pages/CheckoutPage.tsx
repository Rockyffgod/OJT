/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Star, Briefcase, MapPin, Loader2, CheckCircle, AlertTriangle, Package, ChevronDown, ChevronUp, Calendar, FileText, MapPinned, Wallet, User, Navigation } from 'lucide-react';
import { api } from '../lib/api';
import { useTrans } from '../i18n';
import { useToast } from '../hooks/useToast';
import { useAuthStore } from '../store/authStore';

const PLATFORM_FEE = 10;

const DEMO_AVATAR = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7C3AED&color=fff&font-size=0.35&bold=true`;

const STATIC_PROVIDERS: Record<string, any> = {
  'demo-1': { id: 'demo-1', name: 'Ram Bahadur Thapa', profession: 'Electrician', service_area: 'Kathmandu, Baneshwor', hourly_rate: 600, average_rating: 4.8, total_jobs_completed: 145, photo_url: DEMO_AVATAR('Ram Bahadur Thapa'), user: { full_name: 'Ram Bahadur Thapa' } },
  'demo-2': { id: 'demo-2', name: 'Sita Gurung', profession: 'Home Cleaning', service_area: 'Lalitpur, Patan', hourly_rate: 500, average_rating: 4.9, total_jobs_completed: 230, photo_url: DEMO_AVATAR('Sita Gurung'), user: { full_name: 'Sita Gurung' } },
  'demo-3': { id: 'demo-3', name: 'Bikash Shrestha', profession: 'Plumber', service_area: 'Bhaktapur, Suryabinayak', hourly_rate: 700, average_rating: 4.7, total_jobs_completed: 98, photo_url: DEMO_AVATAR('Bikash Shrestha'), user: { full_name: 'Bikash Shrestha' } },
  'demo-4': { id: 'demo-4', name: 'Anita Maharjan', profession: 'Painter', service_area: 'Kathmandu, Balaju', hourly_rate: 800, average_rating: 4.6, total_jobs_completed: 67, photo_url: DEMO_AVATAR('Anita Maharjan'), user: { full_name: 'Anita Maharjan' } },
  'demo-5': { id: 'demo-5', name: 'Prakash Tamang', profession: 'Carpenter', service_area: 'Kathmandu, Thamel', hourly_rate: 750, average_rating: 4.5, total_jobs_completed: 112, photo_url: DEMO_AVATAR('Prakash Tamang'), user: { full_name: 'Prakash Tamang' } },
  'demo-6': { id: 'demo-6', name: 'Sunita Rai', profession: 'AC Repair', service_area: 'Kathmandu, New Road', hourly_rate: 900, average_rating: 4.8, total_jobs_completed: 53, photo_url: DEMO_AVATAR('Sunita Rai'), user: { full_name: 'Sunita Rai' } },
};

export default function CheckoutPage() {
  const { providerId: pathProviderId } = useParams<{ providerId: string }>();
  const [searchParams] = useSearchParams();
  const providerId = pathProviderId || searchParams.get('provider');
  const navigate = useNavigate();
  const { t, isNp } = useTrans();
  const toast = useToast();
  const { user } = useAuthStore();

  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [form, setForm] = useState({
    scheduled_date: '',
    job_description: '',
    job_address: '',
    agreed_price: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [locating, setLocating] = useState(false);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.info('Geolocation not available');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await api.get(
            `/api/services/reverse-geocode/?lat=${latitude}&lon=${longitude}`
          );
          setForm((prev) => ({ ...prev, job_address: res.address }));
          setErrors((prev) => ({ ...prev, job_address: '' }));
        } catch {
          setForm((prev) => ({
            ...prev,
            job_address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          }));
          setErrors((prev) => ({ ...prev, job_address: '' }));
        }
        setLocating(false);
      },
      () => {
        toast.info('Could not get location');
        setLocating(false);
      },
      { timeout: 10000 }
    );
  };

  useEffect(() => {
    if (!providerId) {
      setLoading(false);
      return;
    }
    api.get(`/api/services/providers/${providerId}/`)
      .then((data: any) => {
        setProvider(data);
        setForm((prev) => ({ ...prev, agreed_price: data.hourly_rate || 0 }));
      })
      .catch(() => {
        const fallback = STATIC_PROVIDERS[providerId];
        if (fallback) {
          setProvider(fallback);
          setForm((prev) => ({ ...prev, agreed_price: fallback.hourly_rate || 0 }));
        }
      })
      .finally(() => setLoading(false));
  }, [providerId]);

  const totalPrice = form.agreed_price + PLATFORM_FEE;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.scheduled_date) e.scheduled_date = 'Please select a date and time';
    if (!form.job_description?.trim()) e.job_description = 'Please describe the job';
    if (!form.job_address?.trim()) e.job_address = 'Please enter your address';
    if (form.agreed_price <= 0) e.agreed_price = 'Price must be greater than 0';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!user) {
      toast.info(t('toast.loginRequired'));
      navigate('/login');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/api/bookings/', {
        provider: provider.id,
        scheduled_date: form.scheduled_date,
        job_description: form.job_description,
        job_address: form.job_address,
        agreed_price: form.agreed_price,
        payment_method: 'CASH',
        commission_amount: PLATFORM_FEE,
      });
      toast.success(t('booking.bookingCreated'));
      navigate('/bookings');
    } catch (e: any) {
      toast.error(e?.message || t('toast.networkError'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-violet-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <User size={28} className="text-slate-400" />
        </div>
        <p className="text-slate-500 dark:text-slate-400 mb-3">{t('common.noData')}</p>
        <Link to="/services" className="text-violet-600 dark:text-violet-400 font-medium hover:underline">
          Browse services
        </Link>
      </div>
    );
  }

  const name = (isNp ? provider.user?.full_name_nepali : null) || provider.user?.full_name || provider.user?.username?.replace(/_/g, ' ').title() || provider.name || 'Provider';
  const avatar = provider.user?.profile_photo || provider.photo_url || null;

  const renderLoginPrompt = () => (
    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-6 text-center">
      <AlertTriangle size={28} className="mx-auto mb-3 text-amber-500" />
      <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-2">Login required</h3>
      <p className="text-sm text-amber-600 dark:text-amber-400 mb-4">Please sign in to book a service with {name}.</p>
      <div className="flex items-center justify-center gap-3">
        <Link to="/login" className="px-5 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-smooth">
          Sign In
        </Link>
        <Link to="/signup" className="px-5 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-smooth">
          Create Account
        </Link>
      </div>
    </div>
  );

  const renderForm = () => (
    <>
      {/* Back link */}
      <Link
        to={`/providers/${provider.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-smooth mb-2"
      >
        <ArrowLeft size={16} />
        Back to {name}
      </Link>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-xs font-medium mb-4">
        <div className="flex items-center gap-1.5">
          <span className="w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center text-[11px] font-bold">1</span>
          <span className="text-slate-700 dark:text-slate-300">Details</span>
        </div>
        <div className="w-8 h-px bg-slate-300 dark:bg-slate-600" />
        <div className="flex items-center gap-1.5">
          <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 flex items-center justify-center text-[11px] font-bold">2</span>
          <span className="text-slate-400 dark:text-slate-500">Confirm</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left column — form */}
        <div className="lg:col-span-3 space-y-5">

          {/* Service Details Form */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileText size={16} className="text-violet-500" />
              Service Details
            </h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar size={14} className="text-slate-400" />
                {t('booking.scheduledDate')}
              </label>
              <input
                type="datetime-local"
                value={form.scheduled_date}
                onChange={(e) => { setForm({ ...form, scheduled_date: e.target.value }); setErrors((prev) => ({ ...prev, scheduled_date: '' })); }}
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none"
              />
              {errors.scheduled_date && <p className="text-xs text-red-500 mt-1">{errors.scheduled_date}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                {t('booking.jobDescription')}
              </label>
              <textarea
                value={form.job_description}
                onChange={(e) => { setForm({ ...form, job_description: e.target.value }); setErrors((prev) => ({ ...prev, job_description: '' })); }}
                rows={3}
                placeholder={t('booking.jobDescriptionPlaceholder')}
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none resize-none"
              />
              {errors.job_description && <p className="text-xs text-red-500 mt-1">{errors.job_description}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <MapPinned size={14} className="text-slate-400" />
                {t('booking.jobAddress')}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.job_address}
                  onChange={(e) => { setForm({ ...form, job_address: e.target.value }); setErrors((prev) => ({ ...prev, job_address: '' })); }}
                  placeholder={t('booking.jobAddressPlaceholder')}
                  className="flex-1 px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none"
                />
                <button
                  type="button"
                  onClick={useCurrentLocation}
                  disabled={locating}
                  className="px-3 py-2.5 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-lg text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-smooth disabled:opacity-50 flex items-center gap-1.5 text-sm font-medium flex-shrink-0"
                  title="Use current location"
                >
                  {locating ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Navigation size={16} />
                  )}
                  <span className="hidden sm:inline">{locating ? 'Locating...' : 'Current'}</span>
                </button>
              </div>
              {errors.job_address && <p className="text-xs text-red-500 mt-1">{errors.job_address}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Wallet size={14} className="text-slate-400" />
                {t('booking.agreedPrice')} (NPR)
              </label>
              <input
                type="number"
                value={form.agreed_price}
                onChange={(e) => { setForm({ ...form, agreed_price: Number(e.target.value) }); setErrors((prev) => ({ ...prev, agreed_price: '' })); }}
                min={0}
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none"
              />
              {errors.agreed_price && <p className="text-xs text-red-500 mt-1">{errors.agreed_price}</p>}
              <p className="text-xs text-slate-400 mt-1.5">Final price is negotiable — agree with provider on site</p>
            </div>
          </div>

          {/* Confirm button — only shown on mobile here, hidden on lg */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full lg:hidden py-3 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-smooth disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
          >
            {submitting && <Loader2 size={18} className="animate-spin" />}
            {submitting ? 'Creating Booking...' : 'Confirm Booking'}
          </button>
        </div>

        {/* Right column — summary (sticky on desktop) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="lg:sticky lg:top-6 space-y-4">

            {/* Provider card */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-300 text-lg font-bold overflow-hidden flex-shrink-0">
                  {avatar ? (
                    <img src={avatar} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <Briefcase size={12} />
                    <span className="truncate">{provider.profession || 'Service Provider'}</span>
                  </div>
                  {provider.average_rating > 0 && (
                    <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs mt-0.5">
                      <Star size={11} fill="currentColor" />
                      {provider.average_rating.toFixed(1)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Price Summary */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Price Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Service estimate</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">NPR {form.agreed_price.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Platform fee</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">NPR {PLATFORM_FEE}</span>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex items-center justify-between font-semibold text-slate-900 dark:text-slate-100">
                  <span>Total (estimate)</span>
                  <span className="text-violet-600 dark:text-violet-400">NPR {totalPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 p-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                  <CheckCircle size={16} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Cash After Service</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">Pay provider in cash after work</p>
                </div>
              </div>
            </div>

            {/* Terms (collapsible) */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <button
                onClick={() => setShowTerms(!showTerms)}
                className="w-full flex items-center justify-between p-4 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-smooth"
              >
                <span className="flex items-center gap-2">
                  <AlertTriangle size={15} className="text-amber-500" />
                  Terms & Policies
                </span>
                {showTerms ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {showTerms && (
                <div className="px-4 pb-4 space-y-2.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-200 dark:border-slate-700 pt-3">
                  <p className="flex items-start gap-2">
                    <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-400" />
                    <span><strong>Cancellation penalty:</strong> If you cancel after the provider accepts, you pay <strong>50% of the agreed charge</strong> directly to the provider.</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <Package size={13} className="mt-0.5 shrink-0 text-slate-400" />
                    <span><strong>Materials</strong> (paint, pipes, parts) are <strong>not included</strong> — settled with provider on site.</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <CheckCircle size={13} className="mt-0.5 shrink-0 text-emerald-400" />
                    <span><strong>Cash After Service:</strong> Pay in cash after the work is done to your satisfaction.</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <MapPin size={13} className="mt-0.5 shrink-0 text-slate-400" />
                    <span><strong>Platform fee:</strong> NPR {PLATFORM_FEE} per booking supports Hamro Karma.</span>
                  </p>
                </div>
              )}
            </div>

            {/* Confirm button — desktop only */}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="hidden lg:flex w-full py-3 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-smooth disabled:opacity-50 items-center justify-center gap-2 shadow-sm"
            >
              {submitting && <Loader2 size={18} className="animate-spin" />}
              {submitting ? 'Creating Booking...' : 'Confirm Booking'}
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="max-w-5xl mx-auto pb-10">
      {!user ? (
        <>
          <Link
            to={`/providers/${provider.id}`}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-smooth mb-4"
          >
            <ArrowLeft size={16} />
            Back to {name}
          </Link>
          {/* Provider card shown even when logged out */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-300 text-lg font-bold overflow-hidden flex-shrink-0">
                {avatar ? (
                  <img src={avatar} alt={name} className="w-full h-full object-cover" />
                ) : (
                  name.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{provider.profession || 'Service Provider'}</p>
              </div>
            </div>
          </div>
          {renderLoginPrompt()}
        </>
      ) : (
        renderForm()
      )}
    </div>
  );
}
