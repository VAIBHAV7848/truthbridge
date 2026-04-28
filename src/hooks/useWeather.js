/**
 * TruthBridge — useWeather hook
 */
import { useState, useEffect } from 'react';
import { getRainfall } from '../lib/weather';

export function useWeather(lat, lng) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!lat || !lng) return;
    setLoading(true);
    getRainfall(lat, lng)
      .then(setWeather)
      .finally(() => setLoading(false));
  }, [lat, lng]);

  return { weather, loading };
}
