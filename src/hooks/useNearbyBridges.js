/**
 * TruthBridge — Nearby Bridge Detection Hook
 * 
 * Uses browser geolocation to find the nearest bridges to the user.
 */
import { useState, useCallback } from 'react';

function toRad(deg) { return deg * Math.PI / 180; }

// Haversine formula to calculate distance between two lat/lng points
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}

export function useNearbyBridges(bridges) {
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyBridges, setNearbyBridges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const detectNearbyBridges = useCallback((maxDistanceKm = 10) => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });

        // Calculate distance to all bridges and sort
        const withDistance = bridges.map(b => ({
          ...b,
          distance: haversine(latitude, longitude, b.lat, b.lng),
        }));

        // Filter and sort by distance
        const nearby = withDistance
          .filter(b => b.distance <= maxDistanceKm)
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 10); // Top 10 closest

        setNearbyBridges(nearby);
        setLoading(false);
      },
      (err) => {
        let msg = 'Failed to get location';
        if (err.code === 1) msg = 'Location access denied. Please allow location permissions.';
        if (err.code === 2) msg = 'Location unavailable. Please try again.';
        if (err.code === 3) msg = 'Location request timed out.';
        setError(msg);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [bridges]);

  const clearNearby = useCallback(() => {
    setNearbyBridges([]);
    setUserLocation(null);
    setError(null);
  }, []);

  return {
    userLocation,
    nearbyBridges,
    loading,
    error,
    detectNearbyBridges,
    clearNearby,
  };
}
