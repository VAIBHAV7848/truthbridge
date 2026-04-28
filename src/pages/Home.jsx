import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { useBridges } from '../hooks/useBridges'
import { getTruthCounter } from '../lib/truthCounter'

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

export default function Home() {
  const navigate = useNavigate();
  const { bridges, loading, error } = useBridges();
  const [filter, setFilter] = useState('ALL');
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
  const filtered = filter === 'ALL' ? bridges : bridges.filter(b => b.status === filter);
  const borderColor = {CRITICAL:'#ef4444',WARNING:'#f97316',MONITOR:'#f59e0b',SAFE:'#10b981'};
  const gap = counter.realityCollapses - counter.officialCollapses;

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
        <span style={{color:'#ef4444'}}>Reality: <strong>{counter.realityCollapses}+</strong></span>
        <span style={{color:'#f97316'}}>Gap: <strong>{gap} Hidden</strong></span>
        <span style={{color:'#fca5a5'}}>Deaths: <strong>{counter.realityDeaths || 202}</strong></span>
      </div>

      <div className="home-layout" style={{ paddingTop: 'calc(var(--nav-height) + 36px)' }}>
        <div className="sidebar">
          <div className="sidebar-header" style={{textAlign:'left'}}>
            <h2>Active Bridges</h2>
            <p className="text-gray">{filtered.length} bridges · {bridges.filter(b=>b.status==='CRITICAL').length} critical</p>
            <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap',marginTop:'0.75rem'}}>
              {['ALL','CRITICAL','WARNING','MONITOR','SAFE'].map(f => (
                <button key={f} className={`filter-btn${filter===f?' active':''}`} onClick={()=>setFilter(f)}>{f}</button>
              ))}
            </div>
          </div>
          
          <div className="bridge-list">
            {loading ? (
              <div className="loader" style={{marginTop:'2rem'}}>
                <div className="spinner"></div>
              </div>
            ) : filtered.length > 0 ? (
              filtered.map(b => (
                <div 
                  key={b.id} 
                  className="bridge-card"
                  style={{ borderLeft: `3px solid ${borderColor[b.status]}`, textAlign:'left' }}
                  onClick={() => navigate(`/bridge/${b.id}`)}
                >
                  <div className="bridge-name">{b.name}</div>
                  <div className="bridge-location">{b.district}, {b.state}</div>
                  <div className="flex-between">
                    <span className={`risk-badge status-${b.status.toLowerCase()}`}>
                      <div className="pulse-dot"></div>{b.status} ({b.risk_score})
                    </span>
                    {b.total_reports > 0 && <span className="text-orange" style={{fontSize:'0.8rem'}}>📸 {b.total_reports} Reports</span>}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray" style={{textAlign:'center',marginTop:'2rem'}}>No bridges found.</p>
            )}
          </div>
        </div>

        <div className="map-container">
          <MapContainer center={centerPosition} zoom={8} style={{ height: '100%', width: '100%' }} zoomControl={false}>
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {filtered.map(b => (
              <Marker key={b.id} position={[b.lat, b.lng]} icon={createMarkerIcon(b.status, b.risk_score)}>
                <Popup>
                  <div style={{ padding: '0.5rem', minWidth: '200px' }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#111' }}>{b.name}</h3>
                    <p style={{ margin: '0 0 0.5rem 0', color: '#555', fontSize: '0.9rem' }}>{b.district}, {b.state}</p>
                    <p style={{ margin: '0 0 0.5rem 0' }}><strong>Status:</strong> <span style={{ color: borderColor[b.status], fontWeight: 'bold' }}>{b.status}</span></p>
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
