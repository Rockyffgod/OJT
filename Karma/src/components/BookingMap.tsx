import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

interface Props {
  centerLat: number;
  centerLng: number;
  providerLat: number;
  providerLng: number;
  destLat: number;
  destLng: number;
  otherLat?: number | null;
  otherLng?: number | null;
  otherName?: string;
  selfLat?: number | null;
  selfLng?: number | null;
  arrivedAt?: string | null;
  compact?: boolean;
  className?: string;
}

function icon(color: string, label?: string): L.DivIcon {
  const hasLabel = !!label;
  return L.divIcon({
    html: `<div style="width:${hasLabel ? 36 : 28}px;height:${hasLabel ? 36 : 28}px;background:${color};border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:13px;font-weight:700;">${label || ''}</div>`,
    iconSize: hasLabel ? [36, 36] : [28, 28],
    iconAnchor: hasLabel ? [18, 18] : [14, 14],
    className: '',
  });
}

const arrivedIcon = L.divIcon({
  html: `<div style="width:36px;height:36px;background:#10b981;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:16px;color:white;font-weight:700;">✓</div>`,
  iconSize: [36, 36], iconAnchor: [18, 18], className: '',
});

export default function BookingMap({
  centerLat, centerLng,
  providerLat, providerLng,
  destLat, destLng,
  otherLat, otherLng, otherName,
  selfLat, selfLng,
  arrivedAt,
  compact, className = '',
}: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const routingControl = useRef<L.Routing.Control | null>(null);
  const animMarker = useRef<L.Marker | null>(null);
  const otherMarker = useRef<L.Marker | null>(null);
  const selfMarker = useRef<L.Marker | null>(null);
  const destMarker = useRef<L.Marker | null>(null);
  const animFrame = useRef<number>(0);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    try {
      const map = L.map(mapRef.current, {
        center: [centerLat, centerLng],
        zoom: compact ? 12 : 14,
        zoomControl: !compact,
        attributionControl: false,
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
      mapInstance.current = map;
      return () => {
        cancelAnimationFrame(animFrame.current);
        map.remove();
        mapInstance.current = null;
      };
    } catch {
      mapInstance.current = null;
    }
  }, [centerLat, centerLng, compact]);

  // Routing control: created only when dest or arrived changes (not on provider movement)
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    if (routingControl.current) {
      map.removeControl(routingControl.current);
      routingControl.current = null;
    }
    setRouteInfo(null);

    if (arrivedAt || !destLat || !destLng) return;

    const control = L.Routing.control({
      waypoints: [L.latLng(providerLat, providerLng), L.latLng(destLat, destLng)],
      router: L.Routing.osrmv1({ serviceUrl: 'https://router.project-osrm.org/route/v1/' }),
      lineOptions: {
        styles: [{ color: '#7c3aed', weight: 4, opacity: 0.8 }],
        extendToWaypoints: true,
        missingRouteTolerance: 10,
      },
      show: false,
      fitSelectedRoutes: false,
      showAlternatives: false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    control.on('routesfound', (e: { routes: { summary: { totalDistance: number; totalDuration: number } }[] }) => {
      const route = e.routes[0];
      if (route && route.summary) {
        const km = (route.summary.totalDistance / 1000).toFixed(1);
        const min = Math.round(route.summary.totalDuration / 60);
        setRouteInfo({ distance: `${km} km`, duration: `${min} min` });
      }
    });

    control.addTo(map);
    routingControl.current = control;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destLat, destLng, arrivedAt]);

  // Animated provider marker: animates smoothly on every move
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    cancelAnimationFrame(animFrame.current);

    if (arrivedAt) {
      if (animMarker.current) {
        map.removeLayer(animMarker.current);
        animMarker.current = null;
      }
      const am = L.marker([destLat || centerLat, destLng || centerLng], { icon: arrivedIcon })
        .addTo(map)
        .bindPopup(`<strong>${otherName || ''}</strong><br/>Arrived ✓`);
      animMarker.current = am;
      return;
    }

    const curPos: [number, number] = [providerLat, providerLng];

    if (!animMarker.current) {
      const am = L.marker(curPos, { icon: icon('#7c3aed', 'P') }).addTo(map);
      animMarker.current = am;
      return;
    }

    const prev = animMarker.current.getLatLng();
    if (prev.lat === curPos[0] && prev.lng === curPos[1]) return;

    const startTime = performance.now();
    const duration = 300;
    const step = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1);
      const lat = prev.lat + (curPos[0] - prev.lat) * t;
      const lng = prev.lng + (curPos[1] - prev.lng) * t;
      animMarker.current?.setLatLng([lat, lng]);
      if (t < 1) {
        animFrame.current = requestAnimationFrame(step);
      }
    };
    animFrame.current = requestAnimationFrame(step);
  }, [providerLat, providerLng, arrivedAt, destLat, destLng, centerLat, centerLng, otherName]);

  // Other / self / destination markers
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    [otherMarker, selfMarker, destMarker].forEach((ref) => {
      if (ref.current) {
        map.removeLayer(ref.current);
        ref.current = null;
      }
    });

    if (!arrivedAt) {
      if (destLat && destLng) {
        const dm = L.marker([destLat, destLng], { icon: icon('#f59e0b', 'D') })
          .addTo(map)
          .bindPopup('<strong>Destination</strong>');
        destMarker.current = dm;
      }

      if (otherLat != null && otherLng != null) {
        const isProv = otherLat === providerLat && otherLng === providerLng;
        if (!isProv) {
          const om = L.marker([otherLat, otherLng], { icon: icon('#059669', 'C') })
            .addTo(map)
            .bindPopup(`<strong>${otherName || 'Customer'}</strong>`);
          otherMarker.current = om;
        }
      }

      if (selfLat != null && selfLng != null) {
        const isProv = selfLat === providerLat && selfLng === providerLng;
        const isOther = selfLat === otherLat && selfLng === otherLng;
        if (!isProv && !isOther) {
          const sm = L.marker([selfLat, selfLng], { icon: icon('#3b82f6') })
            .addTo(map)
            .bindPopup('<strong>You</strong>');
          selfMarker.current = sm;
        }
      }
    }

    const bounds: L.LatLngExpression[] = [];
    if (providerLat && providerLng) bounds.push([providerLat, providerLng]);
    if (destLat && destLng) bounds.push([destLat, destLng]);
    if (otherLat != null && otherLng != null) bounds.push([otherLat, otherLng]);
    if (selfLat != null && selfLng != null) bounds.push([selfLat, selfLng]);
    if (bounds.length > 0) {
      const group = L.featureGroup(bounds.map((b) => L.marker(b)));
      map.fitBounds(group.getBounds().pad(0.15));
    }
  }, [otherLat, otherLng, selfLat, selfLng, destLat, destLng, arrivedAt, otherName, providerLat, providerLng]);

  return (
    <div className={`relative ${compact ? 'h-48' : 'h-96'} ${className}`}>
      <div ref={mapRef} className="absolute inset-0 rounded-lg border border-slate-200 dark:border-slate-700" style={{ zIndex: 1 }} />
      {routeInfo && !arrivedAt && (
        <div className="absolute top-2 left-2 z-[1000] bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-md border border-slate-200 dark:border-slate-700 flex gap-3">
          <span>📍 {routeInfo.distance}</span>
          <span>⏱️ {routeInfo.duration}</span>
        </div>
      )}
    </div>
  );
}
