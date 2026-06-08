/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin, Star, Shield, Clock, ArrowLeft, Sparkles, Loader2,
  MessageSquare, Briefcase, CheckCircle2,
} from 'lucide-react';
import { ServiceProvider, KarmaLevel } from '../lib/types';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useTrans } from '../i18n';
import { useToast } from '../hooks/useToast';

const DEMO_AVATAR = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7C3AED&color=fff&font-size=0.35&bold=true`;

const STATIC_PROVIDERS: Record<string, any> = {
  'demo-1': { id: 'demo-1', name: 'Ram Bahadur Thapa', profession: 'Electrician', service_area: 'Kathmandu, Baneshwor', hourly_rate: 600, average_rating: 4.8, total_jobs_completed: 145, photo_url: DEMO_AVATAR('Ram Bahadur Thapa'), user: { full_name: 'Ram Bahadur Thapa' }, category_name: 'Electrician', verification_status: 'APPROVED' },
  'demo-2': { id: 'demo-2', name: 'Sita Gurung', profession: 'Home Cleaning', service_area: 'Lalitpur, Patan', hourly_rate: 500, average_rating: 4.9, total_jobs_completed: 230, photo_url: DEMO_AVATAR('Sita Gurung'), user: { full_name: 'Sita Gurung' }, category_name: 'Home Cleaning', verification_status: 'APPROVED' },
  'demo-3': { id: 'demo-3', name: 'Bikash Shrestha', profession: 'Plumber', service_area: 'Bhaktapur, Suryabinayak', hourly_rate: 700, average_rating: 4.7, total_jobs_completed: 98, photo_url: DEMO_AVATAR('Bikash Shrestha'), user: { full_name: 'Bikash Shrestha' }, category_name: 'Plumber', verification_status: 'APPROVED' },
  'demo-4': { id: 'demo-4', name: 'Anita Maharjan', profession: 'Painter', service_area: 'Kathmandu, Balaju', hourly_rate: 800, average_rating: 4.6, total_jobs_completed: 67, photo_url: DEMO_AVATAR('Anita Maharjan'), user: { full_name: 'Anita Maharjan' }, category_name: 'Painter', verification_status: 'APPROVED' },
  'demo-5': { id: 'demo-5', name: 'Prakash Tamang', profession: 'Carpenter', service_area: 'Kathmandu, Thamel', hourly_rate: 750, average_rating: 4.5, total_jobs_completed: 112, photo_url: DEMO_AVATAR('Prakash Tamang'), user: { full_name: 'Prakash Tamang' }, category_name: 'Carpenter', verification_status: 'APPROVED' },
  'demo-6': { id: 'demo-6', name: 'Sunita Rai', profession: 'AC Repair', service_area: 'Kathmandu, New Road', hourly_rate: 900, average_rating: 4.8, total_jobs_completed: 53, photo_url: DEMO_AVATAR('Sunita Rai'), user: { full_name: 'Sunita Rai' }, category_name: 'AC Repair', verification_status: 'APPROVED' },
};

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  profiles?: { full_name?: string; avatar_url?: string };
}

interface ProviderFull {
  provider: ServiceProvider | null;
  profile: any;
  category: any;
  reviews: Review[];
}

const karmaColors: Record<KarmaLevel, string> = {
  NONE: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  BRONZE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  SILVER: 'bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-200',
  GOLD: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  PLATINUM: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
};

function StarRating({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}
        />
      ))}
    </div>
  );
}

export default function ProviderProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTrans();
  const toast = useToast();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [data, setData] = useState<ProviderFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [enhancing, setEnhancing] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [completedBookingId, setCompletedBookingId] = useState<string | null>(null);
  const [existingReviewIds, setExistingReviewIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const providerData = await api.get(`/api/services/providers/${id}/`);
        
        let reviewsData: any[] = [];
        if (providerData) {
          const reviewsRes = await api.get(`/api/bookings/reviews/?provider=${providerData.id}`);
          const reviewsList = Array.isArray(reviewsRes) ? reviewsRes : (reviewsRes.results || []);
          const existingIds = new Set<string>();
          reviewsData = reviewsList.map((r: any) => {
            existingIds.add(r.id);
            return {
              id: r.id,
              rating: r.rating,
              comment: r.comment,
              created_at: r.created_at,
              profiles: {
                full_name: r.customer_name || 'Customer',
                avatar_url: r.customer_photo || null,
              }
            };
          });
          setExistingReviewIds(existingIds);

          if (user && providerData.id) {
            try {
              const bookingsRes = await api.get('/api/bookings/');
              const bookingsList = Array.isArray(bookingsRes) ? bookingsRes : (bookingsRes.results || []);
              const completed = bookingsList.find(
                (b: any) => b.provider_id === providerData.id && b.status === 'COMPLETED'
              );
              if (completed && !existingIds.has(completed.id)) setCompletedBookingId(completed.id);
            } catch (_) {}
          }
        }

        setData({
          provider: providerData,
          profile: {
            id: providerData.user?.id,
            full_name: providerData.user?.full_name || providerData.user?.username?.replace(/_/g, ' ') || 'Provider',
            avatar_url: providerData.user?.profile_photo || null,
            email: providerData.user?.email,
            phone: providerData.user?.phone,
            is_verified: providerData.verification_status === 'APPROVED' || providerData.verification_status === 'VERIFIED',
          },
          category: {
            name: providerData.category_name || providerData.profession,
            icon: '💼',
          },
          reviews: reviewsData,
        });
      } catch (e) {
        console.error('Provider fetch error:', e);
        const fallback = STATIC_PROVIDERS[id!];
        if (fallback) {
          setData({
            provider: fallback,
            profile: { full_name: fallback.user.full_name, avatar_url: fallback.photo_url, is_verified: true },
            category: { name: fallback.category_name || fallback.profession, icon: '💼' },
            reviews: [],
          });
        } else {
          setData({ provider: null, profile: null, category: null, reviews: [] });
        }
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const onBookNow = () => {
    if (!user) {
      toast.info(t('toast.loginRequired'));
      navigate('/login');
      return;
    }
    navigate(`/book/checkout/${id}`);
  };

  const onEnhanceBio = async () => {
    if (!data?.provider?.bio) return;
    setEnhancing(true);
    try {
      const result: any = await api.post('/api/ai/enhance-profile/', {
        bio: data.provider.bio,
        skills: data.provider.skills || [],
      });
      if (result.enhanced_bio) {
        await api.patch('/api/services/my-profile/', { bio: result.enhanced_bio });
        setData({
          ...data,
          provider: { ...data.provider, bio: result.enhanced_bio },
        });
        toast.success(t('toast.saved'));
      }
    } catch (e: any) {
      console.error('Enhance bio failed:', e);
      toast.error(e?.message || t('toast.networkError'));
    } finally {
      setEnhancing(false);
    }
  };

  if (loading) {
    return <div className="text-center py-16 text-slate-400">{t('common.loading')}</div>;
  }

  if (!data?.provider) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500 dark:text-slate-400 mb-4">{t('common.noData')}</p>
        <Link to="/services" className="text-violet-600 dark:text-violet-400 font-medium hover:underline">
          Browse services
        </Link>
      </div>
    );
  }

  const { provider, profile, category, reviews } = data;
  const name = profile?.full_name || 'Provider';
  const avgRating = provider.average_rating || 0;
  const karmaLevel = (provider.karma_level || 'NONE') as KarmaLevel;
  const isAvailable = provider.is_available ?? provider.availability_status === 'AVAILABLE_NOW';
  const isOwner = user?.id === provider.user_id;

  return (
    <div className="max-w-3xl mx-auto pb-8 space-y-4">
      <Link
        to="/services"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-smooth"
      >
        <ArrowLeft size={16} />
        Back to services
      </Link>

      {/* Hero card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-start gap-4 flex-wrap">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-300 text-2xl font-bold overflow-hidden flex-shrink-0">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={name} className="w-full h-full object-cover" />
            ) : (
              name.charAt(0).toUpperCase()
            )}
          </div>

          {/* Name & meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold font-heading text-slate-900 dark:text-slate-100">
                {name}
              </h1>
              {profile?.is_verified && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 dark:text-violet-400">
                  <Shield size={14} className="fill-violet-600 dark:fill-violet-400" />
                  {t('provider.verified')}
                </span>
              )}
            </div>

            {category && (
              <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                <Briefcase size={14} />
                <span>{category.icon} {category.name}</span>
              </div>
            )}

            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${karmaColors[karmaLevel]}`}>
                {karmaLevel}
              </span>
              {avgRating > 0 && (
                <div className="flex items-center gap-1.5">
                  <StarRating value={avgRating} />
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    {avgRating.toFixed(1)} ({reviews.length})
                  </span>
                </div>
              )}
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-3 mt-3 text-sm text-slate-600 dark:text-slate-400 flex-wrap">
              {provider.experience != null && (
                <span className="inline-flex items-center gap-1">
                  <Clock size={14} className="text-slate-400" />
                  {provider.experience} {t('provider.yearsExp')}
                </span>
              )}
              {provider.hourly_rate != null && (
                <span>Rs. {provider.hourly_rate}{t('provider.perHour')}</span>
              )}
              {provider.service_area && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={14} className="text-slate-400" />
                  {provider.service_area}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isAvailable ? 'bg-green-500' : 'bg-slate-400'
                  }`}
                />
                {isAvailable ? t('provider.available') : t('provider.unavailable')}
              </span>
            </div>
          </div>

          {/* Book Now button */}
          {user?.id !== provider.user_id && (
            <button
              onClick={onBookNow}
              className="px-5 py-2.5 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-smooth"
            >
              {t('provider.bookNow')}
            </button>
          )}
        </div>

        {/* Verified skills */}
        {provider.skills && provider.skills.length > 0 && (
          <div className="border-t border-slate-200 dark:border-slate-700 mt-5 pt-4">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {provider.skills.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-xs"
                >
                  <CheckCircle2 size={11} className="text-violet-600 dark:text-violet-400" />
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* About */}
      {provider.bio && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {t('provider.about')}
            </h2>
            {isOwner && (
              <button
                onClick={onEnhanceBio}
                disabled={enhancing}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-md hover:bg-violet-100 dark:hover:bg-violet-900/50 disabled:opacity-50 transition-smooth"
              >
                {enhancing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                {t('provider.enhanceBio')}
              </button>
            )}
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {provider.bio}
          </p>
        </div>
      )}

      {/* Reviews */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {t('provider.reviews')} ({reviews.length})
          </h2>
          {avgRating > 0 && (
            <div className="flex items-center gap-2">
              <StarRating value={avgRating} />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {avgRating.toFixed(1)}
              </span>
            </div>
          )}
        </div>
        {reviews.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare size={32} className="text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('provider.noReviews')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="flex items-start gap-3 pb-4 border-b border-slate-100 dark:border-slate-700 last:border-0 last:pb-0"
              >
                <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 text-sm font-semibold overflow-hidden flex-shrink-0">
                  {r.profiles?.avatar_url ? (
                    <img src={r.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    r.profiles?.full_name?.charAt(0)?.toUpperCase() || '?'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {r.profiles?.full_name || 'Anonymous'}
                    </p>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <StarRating value={r.rating} />
                  {r.comment && (
                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-1.5 leading-relaxed">
                      {r.comment}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Write a Review */}
      {user && completedBookingId && !showReviewForm && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
            Have you used this provider's service? Leave a review!
          </p>
          <button
            onClick={() => setShowReviewForm(true)}
            className="px-5 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-smooth"
          >
            Write a Review
          </button>
        </div>
      )}

      {/* Review Modal */}
      {showReviewForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
              Rate your experience
            </h3>
            <div className="flex items-center gap-1 mb-4 justify-center">
              {[1,2,3,4,5].map((star) => (
                <button
                  key={star}
                  onClick={() => setReviewRating(star)}
                  className={`text-2xl transition-smooth ${
                    star <= reviewRating
                      ? 'text-amber-400'
                      : 'text-slate-300 dark:text-slate-600'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Share your experience (optional)"
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-violet-500 resize-none mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowReviewForm(false); setReviewRating(5); setReviewComment(''); }}
                className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-smooth"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setSubmittingReview(true);
                  try {
                    await api.post('/api/bookings/reviews/create/', {
                      booking: completedBookingId,
                      rating: reviewRating,
                      comment: reviewComment,
                    });
                    toast.success('Review submitted!');
                    setShowReviewForm(false);
                    setCompletedBookingId(null);
                    setReviewRating(5);
                    setReviewComment('');
                    // Refresh reviews
                    const reviewsRes = await api.get(`/api/bookings/reviews/?provider=${data?.provider?.id || id}`);
                    const reviewsList = Array.isArray(reviewsRes) ? reviewsRes : (reviewsRes.results || []);
                    setData(prev => prev ? {
                      ...prev,
                      reviews: reviewsList.map((r: any) => ({
                        id: r.id,
                        rating: r.rating,
                        comment: r.comment,
                        created_at: r.created_at,
                        profiles: {
                          full_name: r.customer_name || 'Customer',
                          avatar_url: r.customer_photo || null,
                        }
                      }))
                    } : prev);
                  } catch (e: any) {
                    toast.error(e?.message || 'Failed to submit review');
                  } finally {
                    setSubmittingReview(false);
                  }
                }}
                disabled={submittingReview}
                className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50 transition-smooth"
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
