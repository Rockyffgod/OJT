import { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Star, Search as SearchIcon, LocateFixed } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useTrans, translateProfession, translateName } from '../i18n';

const GEOAPIFY_KEY = import.meta.env.VITE_GEOAPIFY_KEY;

const DEMO_AVATAR = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7C3AED&color=fff&font-size=0.35&bold=true`;

const STATIC_PROVIDERS = [
  { id: 'demo-1', name: 'Ram Bahadur Thapa', profession: 'Electrician', service_area: 'Kathmandu, Baneshwor', hourly_rate: 600, average_rating: 4.8, total_jobs_completed: 145, latitude: '27.6915', longitude: '85.3420', photo_url: DEMO_AVATAR('Ram Bahadur Thapa') },
  { id: 'demo-2', name: 'Sita Gurung', profession: 'Home Cleaning', service_area: 'Lalitpur, Patan', hourly_rate: 500, average_rating: 4.9, total_jobs_completed: 230, latitude: '27.6710', longitude: '85.3240', photo_url: DEMO_AVATAR('Sita Gurung') },
  { id: 'demo-3', name: 'Bikash Shrestha', profession: 'Plumber', service_area: 'Bhaktapur, Suryabinayak', hourly_rate: 700, average_rating: 4.7, total_jobs_completed: 98, latitude: '27.6700', longitude: '85.4298', photo_url: DEMO_AVATAR('Bikash Shrestha') },
  { id: 'demo-4', name: 'Anita Maharjan', profession: 'Painter', service_area: 'Kathmandu, Balaju', hourly_rate: 800, average_rating: 4.6, total_jobs_completed: 67, latitude: '27.7300', longitude: '85.3050', photo_url: DEMO_AVATAR('Anita Maharjan') },
  { id: 'demo-5', name: 'Prakash Tamang', profession: 'Carpenter', service_area: 'Kathmandu, Thamel', hourly_rate: 750, average_rating: 4.5, total_jobs_completed: 112, latitude: '27.7150', longitude: '85.3123', photo_url: DEMO_AVATAR('Prakash Tamang') },
  { id: 'demo-6', name: 'Sunita Rai', profession: 'AC Repair', service_area: 'Kathmandu, New Road', hourly_rate: 900, average_rating: 4.8, total_jobs_completed: 53, latitude: '27.7030', longitude: '85.3120', photo_url: DEMO_AVATAR('Sunita Rai') },
];

export default function ServicesPage() {
  const { t, isNp } = useTrans();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [providers, setProviders] = useState<any[]>([]);
  const [nearby, setNearby] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchRadius, setSearchRadius] = useState(10);
  const [query, setQuery] = useState(initialQuery);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get('/api/services/providers/')
      .then((data: any) => {
        const result = Array.isArray(data) ? data : data?.results || [];
        const ids = new Set(result.map((p: any) => p.id));
        const merged = [...result, ...STATIC_PROVIDERS.filter((s) => !ids.has(s.id))];
        setProviders(merged);
      })
      .catch(() => setProviders(STATIC_PROVIDERS))
      .finally(() => setLoading(false));
  }, []);

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setUserLocation({ lat: 27.7172, lng: 85.3240 });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserLocation({ lat: 27.7172, lng: 85.3240 })
    );
  };

  useEffect(() => {
    getUserLocation();
  }, []);

  useEffect(() => {
    if (!userLocation) return;
    api
      .get(
        `/api/services/providers/nearby/?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=${searchRadius}`
      )
      .then((data: any) => setNearby(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, [searchRadius, userLocation]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current || !providers.length) return;
    const points = displayProviders;
    const loc = userLocation || { lat: 27.7172, lng: 85.3240 };

    const map = L.map(mapRef.current).setView([loc.lat, loc.lng], 12);
    L.tileLayer(
      `https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${GEOAPIFY_KEY}`,
      {
        attribution:
          '&copy; <a href="https://www.geoapify.com/">GeoApify</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
        maxZoom: 20,
      }
    ).addTo(map);

    mapInstanceRef.current = map;

    if (userLocation) {
      const { profile } = useAuthStore.getState();
      const userName = profile?.full_name || 'You';
      const userAvatar = profile?.avatar_url || (profile?.full_name ? DEMO_AVATAR(profile.full_name) : null);
      let userIconHtml: string;
      if (userAvatar) {
        userIconHtml = `<div style="background:#7C3AED;width:36px;height:36px;border-radius:50%;overflow:hidden;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
          <img src="${userAvatar}" alt="" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none';this.parentElement.style.background='#7C3AED';this.parentElement.innerHTML='${userName.charAt(0).toUpperCase()}';" />
        </div>`;
      } else {
        userIconHtml = '<div style="background:#7C3AED;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>';
      }
      const hasAvatar = !!userAvatar;
      const userIconSize = hasAvatar ? [36, 36] as [number, number] : [16, 16] as [number, number];
      const userIconAnchor = hasAvatar ? [18, 18] as [number, number] : [8, 8] as [number, number];
      const userIcon = L.divIcon({
        html: userIconHtml,
        className: '',
        iconSize: userIconSize,
        iconAnchor: userIconAnchor,
      });
      L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(map)
        .bindPopup(`<strong>${userName}</strong><br/><span style="font-size:12px;color:#64748b;">${t('services.youAreHere')}</span>`);
    }

    points.forEach((p: any) => {
      const lat = parseFloat(p.latitude);
      const lng = parseFloat(p.longitude);
      if (!lat || !lng) return;

      const avatar = p.photo_url || p.user_photo || DEMO_AVATAR(p.name || 'P');
      const icon = L.divIcon({
        html: `<div style="background:#7C3AED;width:36px;height:36px;border-radius:50%;overflow:hidden;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25);cursor:pointer;display:flex;align-items:center;justify-content:center;">
          <img src="${avatar}" alt="" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none';this.parentElement.innerHTML='${(p.profession || 'P').charAt(0)}'" />
        </div>`,
        className: '',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([lat, lng], { icon }).addTo(map);
      const ratingText = p.average_rating ? `⭐ ${Number(p.average_rating).toFixed(1)}` : t('services.newProvider');
      const popupHtml = `
        <div style="font-family:system-ui,sans-serif;min-width:180px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
            <img src="${avatar}" alt="" style="width:36px;height:36px;border-radius:50%;object-fit:cover;background:#f0f0f0;" onerror="this.style.display='none'" />
            <div>
              <div style="font-weight:600;font-size:14px;color:#1e293b;">${(isNp ? p.user_name_nepali : null) || translateName(p.name || '', isNp) || t('services.provider')}</div>
              <div style="font-size:12px;color:#64748b;">${translateProfession(p.profession, t)}</div>
            </div>
          </div>
          <div style="display:flex;gap:12px;font-size:13px;color:#475569;margin-bottom:8px;">
            <span>${ratingText}</span>
            <span>💰 ${t('services.npr')} ${p.hourly_rate || '—'}${t('services.perHour')}</span>
          </div>
          <a href="/providers/${p.id}" style="display:block;text-align:center;padding:6px 0;background:#7C3AED;color:white;border-radius:6px;font-size:13px;font-weight:500;text-decoration:none;">${t('services.viewProfile')} →</a>
        </div>
      `;
      marker.bindPopup(popupHtml, { className: 'custom-popup', closeButton: true, maxWidth: 260 });
      marker.on('click', () => navigate(`/providers/${p.id}`));
      markersRef.current.push(marker);
    });

    if (markersRef.current.length > 0) {
      const group = L.featureGroup(markersRef.current);
      if (userLocation) group.addLayer(L.marker([userLocation.lat, userLocation.lng]));
      map.fitBounds(group.getBounds().pad(0.1));
    }

    setMapReady(true);
    setTimeout(() => map.invalidateSize(), 300);
  }, [providers, nearby, userLocation, navigate, query]);

  const centerOnUser = () => {
    const map = mapInstanceRef.current;
    if (map && userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 13);
    } else {
      getUserLocation();
    }
  };

  const displayProviders = (nearby.length > 0 ? nearby : providers).filter((p) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const pName = p.name || p.user_name || '';
    return (
      p.profession?.toLowerCase().includes(q) ||
      pName.toLowerCase().includes(q) ||
      p.service_area?.toLowerCase().includes(q)
    );
  });

  const radiusLabel = (km: number) => {
    const key = `services.radius${km}km`;
    return t(key);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900 dark:text-slate-100">
            {t('services.title')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {userLocation
              ? t('services.showingNear').replace('{radius}', String(searchRadius))
              : t('services.gettingLocation')}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
            <SearchIcon size={16} className="text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('services.searchPlaceholder')}
              className="bg-transparent outline-none w-40 sm:w-48 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400"
            />
          </div>
          <select
            value={searchRadius}
            onChange={(e) => setSearchRadius(Number(e.target.value))}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 outline-none"
          >
            <option value={5}>{t('services.radius5km')}</option>
            <option value={10}>{t('services.radius10km')}</option>
            <option value={25}>{t('services.radius25km')}</option>
            <option value={50}>{t('services.radius50km')}</option>
            <option value={0}>{t('services.radiusAll')}</option>
          </select>
        </div>
      </div>

      <div className="relative">
        <div
          ref={mapRef}
          className="w-full h-[400px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-200 dark:bg-slate-800"
          style={{ zIndex: 1 }}
        >
          {!mapReady && (
            <div className="flex items-center justify-center h-full text-slate-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
            </div>
          )}
        </div>
        {mapReady && (
          <button
            onClick={centerOnUser}
            className="absolute bottom-4 right-4 z-[1000] w-10 h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-smooth"
            title={t('services.centerLocation')}
          >
            <LocateFixed size={18} className="text-violet-600" />
          </button>
        )}
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        {t('services.foundCount')
          .replace('{count}', String(displayProviders.length))
          .replace('{plural}', displayProviders.length !== 1 ? 's' : '')}
        {nearby.length > 0 ? t('services.nearYou') : ''}
      </p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayProviders.map((p: any) => (
          <div
            key={p.id}
            className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-sm transition-smooth"
          >
            <div className="flex items-start justify-between mb-3 gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-300 text-sm font-bold overflow-hidden flex-shrink-0">
                  {p.photo_url || p.user_photo ? (
                    <img src={p.photo_url || p.user_photo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (p.name || p.user_name || 'P').charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {(isNp ? p.user_name_nepali : null) || translateName(p.name || p.user_name || '', isNp) || t('services.provider')}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {translateProfession(p.profession, t)}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-sm text-amber-600 dark:text-amber-400 font-medium flex-shrink-0">
                <Star size={14} fill="currentColor" />
                {p.average_rating?.toFixed(1) || t('services.newProvider')}
              </span>
            </div>
            <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 mb-2">
              <MapPin size={14} />
              <span className="truncate">{p.service_area || t('services.radiusAll')}</span>
              {p.distance_km != null && (
                <span className="ml-1 text-violet-600 dark:text-violet-400 font-medium">
                  ({p.distance_km.toFixed(1)} km)
                </span>
              )}
            </div>
            <div className="flex items-center justify-between text-sm mb-3">
              <span className="text-slate-500 dark:text-slate-400">
                {t('services.jobCount').replace('{count}', String(p.total_jobs_completed || 0))}
              </span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {p.hourly_rate ? `${t('services.npr')} ${p.hourly_rate}${t('services.perHour')}` : '—'}
              </span>
            </div>
            <Link
              to={`/providers/${p.id}`}
              className="block w-full text-center py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-smooth"
            >
              {t('services.viewProfile')}
            </Link>
          </div>
        ))}
      </div>

      {!loading && displayProviders.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <MapPin size={40} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">
            {t('services.noProviders')}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">
            {t('services.noProvidersHint')}
          </p>
          <p className="text-slate-400 dark:text-slate-500 text-xs">
            माफ गर्नुहोस्, कुनै सेवा प्रदायक भेटिएन — हाम्रो प्लेटफर्ममा अहिलेसम्म यसको लागि कुनै सूचीबद्ध सेवा प्रदायक छैन
          </p>
        </div>
      )}
    </div>
  );
}
