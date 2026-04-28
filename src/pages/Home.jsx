import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useBridges } from '../hooks/useBridges'
import { getTruthCounter } from '../lib/truthCounter'
import { getRainfall } from '../lib/weather'

const createMarkerIcon = (status, score) => {
  const statusLower = status.toLowerCase();
  return L.divIcon({
    className: 'custom-marker-wrapper',
    html: `<div class="custom-marker marker-${statusLower}">${score}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

function FlyTo({ coords }) {
  const map = useMap()
  useEffect(() => {
    if (coords) map.flyTo(coords, 13, { duration: 1.2 })
  }, [coords, map])
  return null
}

function WeatherBadge({ lat, lng }) {
  const [weather, setWeather] = useState(null)
  useEffect(() => {
    getRainfall(lat, lng).then(setWeather).catch(() => {})
  }, [lat, lng])
  if (!weather || !weather.description) return null
  const riskColor = { LOW: '#10b981', MODERATE: '#f59e0b', HIGH: '#f97316', EXTREME: '#ef4444' }
  return (
    <div style={{ marginTop: '0.5rem', padding: '0.4rem 0.6rem', background: '#f0f4f8', borderRadius: 6, fontSize: '0.8rem', color: '#333' }}>
      🌧️ {weather.rainfall_mm}mm/day · {weather.temperature}°C
      <span style={{ marginLeft: '0.4rem', fontWeight: 700, color: riskColor[weather.riskLevel] || '#555' }}>
        {weather.riskLevel}
      </span>
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate();
  const { bridges, loading, error } = useBridges();
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [district, setDistrict] = useState('ALL');
  const [flyCoords, setFlyCoords] = useState(null);
  const [counter, setCounter] = useState({ officialCollapses: 42, realityCollapses: 170, gap: 128, realityDeaths: 202 });

  useEffect(() => {
    getTruthCounter().then(res => {
      if (res) {
        setCounter({
          officialCollapses: res.official_collapses || 42,
          realityCollapses: res.reality_collapses || 170,
          gap: (res.reality_collapses || 170) - (res.official_collapses || 42),
          realityDeaths: res.reality_deaths || 202
        });
      }
    }).catch(console.error);
  }, []);

  const centerPosition = [15.3173, 75.7139];
  
  // Get unique districts for dropdown
  const districts = ['ALL', ...new Set(bridges.map(b => b.district).filter(Boolean))];
  
  // Apply all filters
  let filtered = bridges;
  if (filter !== 'ALL') filtered = filtered.filter(b => b.status === filter);
  if (district !== 'ALL') filtered = filtered.filter(b => b.district === district);
  if (search.trim()) filtered = filtered.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));
  
  const borderColor = { CRITICAL: '#ef4444', WARNING: '#f97316', MONITOR: '#f59e0b', SAFE: '#10b981' };
  const gap = counter.realityCollapses - counter.officialCollapses;

  function handleCardClick(b) {
    setFlyCoords([b.lat, b.lng])
    // Small delay then navigate
    setTimeout(() => navigate(`/bridge/${b.id}`), 800)
  }

  if (error) {
    return (
      <div className="home-layout">
        <div className="loader"><p className="text-red">⚠️ {error.message}</p></div>
      </div>
    );
  }

  return (
    <>
      <div className="truth-strip">
        <span>Govt Official: <strong>{counter.officialCollapses}</strong></span>
        <span style={{ color: '#ef4444' }}>Reality: <strong>{counter.realityCollapses}+</strong></span>
        <span style={{ color: '#f97316' }}>Gap: <strong>{gap} Hidden</strong></span>
        <span style={{ color: '#fca5a5' }}>Deaths: <strong>{counter.realityDeaths || 202}</strong></span>
      </div>

      <div className="home-layout" style={{ paddingTop: 'calc(var(--nav-height) + 36px)' }}>
        <div className="sidebar">
          <div className="sidebar-header" style={{ textAlign: 'left' }}>
            <h2>Active Bridges</h2>
            <p className="text-gray">{filtered.length} bridges · {bridges.filter(b => b.status === 'CRITICAL').length} critical</p>
            
            {/* Search bar */}
            <input
              className="form-input"
              placeholder="🔍 Search bridge name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ marginTop: '0.75rem', padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}
            />
            
            {/* District dropdown */}
            <select
              className="form-input"
              value={district}
              onChange={e => setDistrict(e.target.value)}
              style={{ marginTop: '0.5rem', padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}
            >
              {districts.map(d => (
                <option key={d} value={d}>{d === 'ALL' ? '— All Districts —' : d}</option>
              ))}
            </select>

            {/* Status filters */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
              {['ALL', 'CRITICAL', 'WARNING', 'MONITOR', 'SAFE'].map(f => (
                <button key={f} className={`filter-btn${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
              ))}
            </div>
          </div>
          
          <div className="bridge-list">
            {loading ? (
              <div className="loader" style={{ marginTop: '2rem' }}>
                <div className="spinner"></div>
              </div>
            ) : filtered.length > 0 ? (
              filtered.map(b => (
                <div 
                  key={b.id} 
                  className="bridge-card"
                  style={{ borderLeft: `3px solid ${borderColor[b.status]}`, textAlign: 'left' }}
                  onClick={() => handleCardClick(b)}
                >
                  <div className="bridge-name">{b.name}</div>
                  <div className="bridge-location">{b.district}, {b.state}</div>
                  <div className="flex-between">
                    <span className={`risk-badge status-${b.status.toLowerCase()}`}>
                      <div className="pulse-dot"></div>{b.status} ({b.risk_score})
                    </span>
                    {b.total_reports > 0 && <span className="text-orange" style={{ fontSize: '0.8rem' }}>📸 {b.total_reports} Reports</span>}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray" style={{ textAlign: 'center', marginTop: '2rem' }}>No bridges found.</p>
            )}
          </div>
        </div>

        <div className="map-container">
          <MapContainer center={centerPosition} zoom={8} style={{ height: '100%', width: '100%' }} zoomControl={false}>
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <FlyTo coords={flyCoords} />
            {filtered.map(b => (
              <Marker key={b.id} position={[b.lat, b.lng]} icon={createMarkerIcon(b.status, b.risk_score)}>
                <Popup>
                  <div style={{ padding: '0.5rem', minWidth: '220px' }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#111' }}>{b.name}</h3>
                    <p style={{ margin: '0 0 0.5rem 0', color: '#555', fontSize: '0.9rem' }}>{b.district}, {b.state}</p>
                    <p style={{ margin: '0 0 0.25rem 0' }}>
                      <strong>Status:</strong> <span style={{ color: borderColor[b.status], fontWeight: 'bold' }}>{b.status}</span>
                    </p>
                    <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: '#666' }}>
                      🏗️ Seismic Zone {b.seismic_zone || 'N/A'}
                    </p>
                    <WeatherBadge lat={b.lat} lng={b.lng} />
                    <button onClick={() => navigate(`/bridge/${b.id}`)} style={{ width: '100%', padding: '0.4rem', marginTop: '0.5rem' }} className="btn-primary">View Details</button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </>
  );
}
