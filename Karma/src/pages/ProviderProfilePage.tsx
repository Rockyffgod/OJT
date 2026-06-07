import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin, Star, Shield, Clock, Award, ArrowLeft, Sparkles, Loader2,
  MessageSquare, Briefcase, CheckCircle2,
} from 'lucide-react';
import { ServiceProvider, KarmaLevel } from '../lib/supabase';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useTrans } from '../i18n';
import { useToast } from '../hooks/useToast';

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
          reviewsData = reviewsList.map((r: any) => ({
            id: r.id,
            rating: r.rating,
            comment: r.comment,
            created_at: r.created_at,
            profiles: {
              full_name: r.customer_name || 'Customer',
              avatar_url: r.customer_photo || null,
            }
          }));
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
        setData({ provider: null, profile: null, category: null, reviews: [] });
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
    navigate(`/bookings/new?provider=${id}`);
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
    </div>
  );
}
