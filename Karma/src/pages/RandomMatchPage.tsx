import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shuffle, MapPin, Star, Trophy, RotateCcw, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useTrans, translateProfession, translateName } from '../i18n';

const categories = [
  { name: 'Electrician', icon: '⚡' },
  { name: 'Plumber', icon: '🔧' },
  { name: 'Carpenter', icon: '🪚' },
  { name: 'Painter', icon: '🎨' },
  { name: 'Home Cleaning', icon: '🧹' },
  { name: 'AC Repair', icon: '❄️' },
  { name: 'Mason', icon: '🧱' },
  { name: 'Gardener', icon: '🌿' },
];

export default function RandomMatchPage() {
  const { t, isNp } = useTrans();
  const { user } = useAuthStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { timeout: 5000 }
      );
    }
  }, []);

  const handleSpin = async () => {
    setSpinning(true);
    setResult(null);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.set('category', selectedCategory);
      if (userLocation) {
        params.set('lat', String(userLocation.lat));
        params.set('lng', String(userLocation.lng));
      }
      const data = await api.get(`/api/services/random-match/?${params.toString()}`);
      setResult(data);
    } catch (e: any) {
      setError(e?.message || t('random.errorDefault'));
    } finally {
      setSpinning(false);
    }
  };

  const matchedProvider = result;

  const uniqueCategories = categories.filter((c, i, a) => a.findIndex(x => x.name === c.name) === i);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-violet-100 dark:bg-violet-900/30 rounded-full mb-4">
          <Shuffle size="28" className="text-violet-600 dark:text-violet-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {t('random.title')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          {t('random.subtitle')}
        </p>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-8">
        {uniqueCategories.map((cat) => {
          const selected = selectedCategory === cat.name;
          return (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(selected ? null : cat.name)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-sm font-medium transition-smooth ${
                selected
                  ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <span className="text-xl">{cat.icon}</span>
              <span className="text-xs">{translateProfession(cat.name, t)}</span>
            </button>
          );
        })}
      </div>

      {/* Spin Button */}
      <div className="text-center mb-8">
        <button
          onClick={handleSpin}
          disabled={spinning}
          className="inline-flex items-center gap-2 px-8 py-3 bg-violet-600 text-white rounded-xl text-base font-semibold hover:bg-violet-700 disabled:opacity-60 transition-smooth"
        >
          {spinning ? (
            <>
              <RefreshCw size="20" className="animate-spin" />
              {t('random.finding')}
            </>
          ) : (
            <>
              <Shuffle size="20" />
              {t('random.findMatch')}
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="text-center py-8">
          <p className="text-slate-500 dark:text-slate-400 mb-4">{error}</p>
          <button
            onClick={handleSpin}
            className="inline-flex items-center gap-2 px-5 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-smooth"
          >
            <RotateCcw size="16" />
            {t('random.tryAgain')}
          </button>
        </div>
      )}

      {/* Result */}
      {matchedProvider && !spinning && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 max-w-md mx-auto text-center">
          <div className="w-20 h-20 mx-auto rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 mb-4">
            {matchedProvider.user?.profile_photo ? (
              <img
                src={matchedProvider.user.profile_photo}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl font-bold text-slate-500">
                {(matchedProvider.user?.full_name || '?').charAt(0)}
              </div>
            )}
          </div>

          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {translateName(matchedProvider.user?.full_name || matchedProvider.user?.username || '', isNp) || t('random.provider')}
          </h2>
          <p className="text-violet-600 dark:text-violet-400 font-medium text-sm">
            {translateProfession(matchedProvider.profession, t)}
          </p>

          <div className="flex items-center justify-center gap-4 mt-3 text-sm text-slate-500 dark:text-slate-400">
            {matchedProvider.average_rating && (
              <span className="flex items-center gap-1">
                <Star size="14" className="text-amber-400 fill-amber-400" />
                {Number(matchedProvider.average_rating).toFixed(1)}
              </span>
            )}
            {matchedProvider.total_jobs_completed != null && (
              <span className="flex items-center gap-1">
                <Trophy size="14" className="text-slate-400" />
                {t('random.jobs').replace('{count}', String(matchedProvider.total_jobs_completed))}
              </span>
            )}
            {matchedProvider.distance_km != null && (
              <span className="flex items-center gap-1">
                <MapPin size="14" className="text-slate-400" />
                {t('random.km').replace('{count}', String(Number(matchedProvider.distance_km).toFixed(1)))}
              </span>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSpin}
              className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-smooth"
            >
              {t('random.tryAgain')}
            </button>
            <Link
              to={`/providers/${matchedProvider.id}`}
              className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-smooth text-center"
            >
              {t('services.viewProfile')}
            </Link>
            {user && (
              <Link
                to={`/book/checkout/${matchedProvider.id}`}
                className="flex-1 px-4 py-2.5 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-smooth text-center"
              >
                {t('provider.bookNow')}
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
