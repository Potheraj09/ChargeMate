// ================= REAL (device GPS / Haversine distance math) =================

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  cityGuess?: string;
}

/**
 * Validates that latitude and longitude are finite, non-NaN numbers within geographic boundaries.
 */
export function isValidCoordinate(lat: unknown, lng: unknown): lat is number {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    isFinite(lat) &&
    isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export const FALLBACK_LOCATIONS: { name: string; city: string; lat: number; lng: number }[] = [
  { name: 'Chennai OMR IT Corridor', city: 'Chennai', lat: 12.9716, lng: 80.2464 },
  { name: 'Chennai Anna Salai / Guindy', city: 'Chennai', lat: 13.0067, lng: 80.2030 },
  { name: 'Coimbatore Avinashi Road', city: 'Coimbatore', lat: 11.0264, lng: 77.0124 },
  { name: 'Madurai Ring Road Express', city: 'Madurai', lat: 9.9252, lng: 78.1198 },
  { name: 'Bengaluru Electronic City', city: 'Bengaluru', lat: 12.8452, lng: 77.6602 },
  { name: 'Kochi Edappally Hub', city: 'Kochi', lat: 10.0242, lng: 76.3082 },
  { name: 'Hyderabad HITEC City', city: 'Hyderabad', lat: 17.4474, lng: 78.3762 },
  { name: 'Mumbai BKC Financial Hub', city: 'Mumbai', lat: 19.0660, lng: 72.8688 },
  { name: 'Delhi Connaught Place', city: 'New Delhi', lat: 28.6315, lng: 77.2167 },
  { name: 'Pune Hinjawadi Tech Zone', city: 'Pune', lat: 18.5913, lng: 73.7389 },
  { name: 'Trichy Central Junction', city: 'Tiruchirappalli', lat: 10.7905, lng: 78.7047 }
];

/**
 * Calculates real great-circle distance between two coordinates in kilometers using Haversine formula.
 */
export function calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (!isValidCoordinate(lat1, lon1) || !isValidCoordinate(lat2, lon2)) {
    return 0;
  }
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Number.isFinite(distance) ? Math.round(distance * 10) / 10 : 0;
}

/**
 * Watch real device coordinates continuously via browser Geolocation API
 */
export function watchRealDeviceLocation(
  onUpdate: (coords: Coordinates) => void,
  onError?: (err: GeolocationPositionError) => void
): number | null {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return null;
  return navigator.geolocation.watchPosition(
    (position) => {
      const lat = position?.coords?.latitude;
      const lng = position?.coords?.longitude;
      if (isValidCoordinate(lat, lng)) {
        onUpdate({
          latitude: lat,
          longitude: lng,
          accuracy: position.coords.accuracy,
          cityGuess: 'Live Device GPS'
        });
      }
    },
    (err) => {
      if (onError) onError(err);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 10000,
      timeout: 15000
    }
  );
}

export function requestRealDeviceLocation(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Browser does not support Geolocation API'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position?.coords?.latitude;
        const lng = position?.coords?.longitude;
        if (isValidCoordinate(lat, lng)) {
          resolve({
            latitude: lat,
            longitude: lng,
            accuracy: position.coords.accuracy,
            cityGuess: 'Current Device Location'
          });
        } else {
          reject(new Error('Invalid coordinates received from GPS device'));
        }
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 60000
      }
    );
  });
}
