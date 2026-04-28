/**
 * TruthBridge — Weather API Service
 * Proxies OpenWeatherMap for monsoon risk data.
 */
const API_KEY = import.meta.env.VITE_OPENWEATHER_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

export async function getRainfall(lat, lng) {
  if (!API_KEY) return { rainfall_mm: 0, description: 'No API key', temperature: 0, humidity: 0 };

  try {
    const res = await fetch(`${BASE_URL}?lat=${lat}&lon=${lng}&appid=${API_KEY}&units=metric`);
    const data = await res.json();

    const rainfall = data.rain?.['1h'] ? data.rain['1h'] * 24 : (data.rain?.['3h'] ? data.rain['3h'] * 8 : 0);
    let riskLevel = 'LOW';
    if (rainfall >= 200) riskLevel = 'EXTREME';
    else if (rainfall >= 100) riskLevel = 'HIGH';
    else if (rainfall >= 50) riskLevel = 'MODERATE';

    return {
      rainfall_mm: Math.round(rainfall),
      riskLevel,
      description: data.weather?.[0]?.description || '',
      temperature: Math.round(data.main?.temp || 0),
      humidity: data.main?.humidity || 0,
    };
  } catch {
    return { rainfall_mm: 0, description: 'Error fetching weather', temperature: 0, humidity: 0 };
  }
}
