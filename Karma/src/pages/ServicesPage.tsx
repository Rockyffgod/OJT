import { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MapPin, Star, Search as SearchIcon } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../lib/api';

const GEOAPIFY_KEY = import.meta.env.VITE_GEOAPIFY_KEY;

const STATIC_PROVIDERS = [
  { id: 'demo-1', name: 'Ram Bahadur Thapa', profession: 'Electrician', service_area: 'Kathmandu, Baneshwor', hourly_rate: 600, average_rating: 4.8, total_jobs_completed: 145, latitude: '27.6915', longitude: '85.3420' },
  { id: 'demo-2', name: 'Sita Gurung', profession: 'Home Cleaning', service_area: 'Lalitpur, Patan', hourly_rate: 500, average_rating: 4.9, total_jobs_completed: 230, latitude: '27.6710', longitude: '85.3240' },
  { id: 'demo-3', name: 'Bikash Shrestha', profession: 'Plumber', service_area: 'Bhaktapur, Suryabinayak', hourly_rate: 700, average_rating: 4.7, total_jobs_completed: 98, latitude: '27.6700', longitude: '85.4298' },
  { id: 'demo-4', name: 'Anita Maharjan', profession: 'Painter', service_area: 'Kathmandu, Balaju', hourly_rate: 800, average_rating: 4.6, total_jobs_completed: 67, latitude: '27.7300', longitude: '85.3050' },
  { id: 'demo-5', name: 'Prakash Tamang', profession: 'Carpenter', service_area: 'Kathmandu, Thamel', hourly_rate: 750, average_rating: 4.5, total_jobs_completed: 112, latitude: '27.7150', longitude: '85.3123' },
  { id: 'demo-6', name: 'Sunita Rai', profession: 'AC Repair', service_area: 'Kathmandu, New Road', hourly_rate: 900, average_rating: 4.8, total_jobs_completed: 53, latitude: '27.7030', longitude: '85.3120' },
];

export default function ServicesPage() {
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

  useEffect(() => {
    api
      .get('/api/services/providers/')
      .then((data: any) => {
        const result = Array.isArray(data) ? data : data?.results || [];
        setProviders(result.length > 0 ? result : STATIC_PROVIDERS);
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

  // Init map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current || !providers.length) return;
    const points = nearby.length > 0 ? nearby : providers;
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
      const userIcon = L.divIcon({
        html: '<div style="background:#7C3AED;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>',
        className: '',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(map)
        .bindPopup('<strong>You are here</strong>');
    }

    points.forEach((p: any) => {
      const lat = parseFloat(p.latitude);
      const lng = parseFloat(p.longitude);
      if (!lat || !lng) return;
      const icon = L.divIcon({
        html: `<div style="background:#7C3AED;color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:bold;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.2)">${(p.profession || 'P').charAt(0)}</div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      const marker = L.marker([lat, lng], { icon }).addTo(map);
      markersRef.current.push(marker);
    });

    if (markersRef.current.length > 0) {
      const group = L.featureGroup(markersRef.current);
      if (userLocation) group.addLayer(L.marker([userLocation.lat, userLocation.lng]));
      map.fitBounds(group.getBounds().pad(0.1));
    }

    setMapReady(true);
    setTimeout(() => map.invalidateSize(), 300);
  }, [providers, nearby, userLocation]);

  const filtered = providers.filter((p) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      p.profession?.toLowerCase().includes(q) ||
      p.name?.toLowerCase().includes(q) ||
      p.service_area?.toLowerCase().includes(q)
    );
  });

  const displayProviders = nearby.length > 0 ? nearby : filtered;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900 dark:text-slate-100">
            Find Services
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {userLocation
              ? `Showing providers near you (${searchRadius}km radius)`
              : 'Getting your location...'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
            <SearchIcon size={16} className="text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or profession"
              className="bg-transparent outline-none w-40 sm:w-48 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400"
            />
          </div>
          <select
            value={searchRadius}
            onChange={(e) => setSearchRadius(Number(e.target.value))}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 outline-none"
          >
            <option value={5}>5 km</option>
            <option value={10}>10 km</option>
            <option value={25}>25 km</option>
            <option value={50}>50 km</option>
            <option value={0}>All Nepal</option>
          </select>
        </div>
      </div>

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

      <p className="text-sm text-slate-500 dark:text-slate-400">
        {displayProviders.length} provider{displayProviders.length !== 1 ? 's' : ''} found
        {nearby.length > 0 ? ' near you' : ''}
      </p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayProviders.map((p: any) => (
          <div
            key={p.id}
            className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-sm transition-smooth"
          >
            <div className="flex items-start justify-between mb-3 gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {(p.name || p.user_name || 'Provider').replace(/_/g, ' ')}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {p.profession || 'Service Provider'}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-sm text-amber-600 dark:text-amber-400 font-medium flex-shrink-0">
                <Star size={14} fill="currentColor" />
                {p.average_rating?.toFixed(1) || 'New'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 mb-2">
              <MapPin size={14} />
              <span className="truncate">{p.service_area || 'Nepal'}</span>
              {p.distance_km != null && (
                <span className="ml-1 text-violet-600 dark:text-violet-400 font-medium">
                  ({p.distance_km.toFixed(1)} km)
                </span>
              )}
            </div>
            <div className="flex items-center justify-between text-sm mb-3">
              <span className="text-slate-500 dark:text-slate-400">
                {p.total_jobs_completed || 0} jobs
              </span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {p.hourly_rate ? `NPR ${p.hourly_rate}/hr` : '—'}
              </span>
            </div>
            <Link
              to={`/providers/${p.id}`}
              className="block w-full text-center py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-smooth"
            >
              View Profile
            </Link>
          </div>
        ))}
      </div>

      {!loading && displayProviders.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <MapPin size={40} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">
            No providers found
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Try increasing the search radius or check back later
          </p>
        </div>
      )}
    </div>
  );
}
