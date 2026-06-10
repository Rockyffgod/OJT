import { create } from 'zustand';

interface LocationState {
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  timestamp: number | null;
  error: string | null;
  isTracking: boolean;
  watchId: number | null;
  startTracking: () => void;
  stopTracking: () => void;
  getDistance: (lat1: number, lng1: number, lat2: number, lng2: number) => number;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  lat: null,
  lng: null,
  accuracy: null,
  timestamp: null,
  error: null,
  isTracking: false,
  watchId: null,

  startTracking: () => {
    if (get().isTracking) return;
    if (!('geolocation' in navigator)) {
      set({ error: 'Geolocation not supported', isTracking: false });
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        set({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
          error: null,
          isTracking: true,
        });
      },
      (err) => {
        set({ error: err.message, isTracking: false });
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
    set({ watchId, isTracking: true });
  },

  stopTracking: () => {
    const { watchId } = get();
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
    }
    set({ watchId: null, isTracking: false });
  },

  getDistance: (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  },
}));
