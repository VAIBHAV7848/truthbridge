import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useBridges } from '../hooks/useBridges';
import { getTruthCounter } from '../lib/truthCounter';

// Helper to create custom HTML markers for different risk statuses
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
  const [filter, setFilter] = useState('ALL');
  const { bridges, loading, error } = useBridges();
  const navigate = useNavigate();
  
  const [truthData, setTruthData] = useState({ official_collapses: 42, reality_collapses: 170, gap: 128 });

  useEffect(() => {
    getTruthCounter().then(res => {
      if (res) {
        setTruthData({
          official_collapses: res.official_collapses,
          reality_collapses: res.reality_collapses,
          gap: res.reality_collapses - res.official_collapses
        });
      }
    }).catch(console.error);
  }, []);

  // Karnataka center coordinates
  const centerPosition = [15.3173, 75.7139];

  const filteredBridges = filter === 'ALL' ? bridges : bridges.filter(b => b.status === filter);

  if (error) {
    return (
      <div className="home-layout">
        <div className="loader" style={{ color: 'var(--color-critical)' }}>
          <p>⚠️ Error: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Truth Strip at the top */}
      <div className="truth-strip">
        <span>Govt Official: {truthData.official_collapses} collapses</span>
        <span>|</span>
        <span className="text-red">Reality: {truthData.reality_collapses}+</span>
        <span>|</span>
        <span className="text-orange">Gap: {truthData.gap} Hidden</span>
        <span>|</span>
        <span className="text-gray">202 Deaths</span>
      </div>

      <div className="home-layout" style={{ paddingTop: 'calc(var(--nav-height) + 36px)' }}>
        {/* Sidebar List */}
        <div className="sidebar">
          <div className="sidebar-header">
            <h2>Active Bridges</h2>
            <p>{bridges.length} bridges being monitored</p>
            
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              {['ALL', 'CRITICAL', 'WARNING', 'MONITOR', 'SAFE'].map(f => (
                <button 
                  key={f}
                  className={`filter-btn ${filter === f ? 'active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          
          <div className="bridge-list">
            {loading ? (
              // Skeleton Loader
              <>
                <div className="skeleton" style={{ height: '100px', width: '100%' }}></div>
                <div className="skeleton" style={{ height: '100px', width: '100%' }}></div>
                <div className="skeleton" style={{ height: '100px', width: '100%' }}></div>
              </>
            ) : (
              filteredBridges.map(bridge => {
                const sLower = bridge.status.toLowerCase();
                return (
                  <div 
                    key={bridge.id} 
                    className="bridge-card"
                    style={{ borderLeft: `4px solid var(--color-${sLower})` }}
                    onClick={() => navigate(`/bridge/${bridge.id}`)}
                  >
                    <div className="bridge-name">{bridge.name}</div>
                    <div className="bridge-location">{bridge.district}, {bridge.state}</div>
                    
                    <div className="flex-between">
                      <span className={`risk-badge status-${sLower}`}>
                        <div className="pulse-dot"></div>
                        {bridge.status} (Risk: {bridge.risk_score})
                      </span>
                      
                      {bridge.total_reports > 0 && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-warning)' }}>
                          📸 {bridge.total_reports} Reports
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            
            {!loading && filteredBridges.length === 0 && (
              <p className="text-gray" style={{ textAlign: 'center', marginTop: '2rem' }}>No bridges match this filter.</p>
            )}
          </div>
        </div>

        {/* Main Map */}
        <div className="map-container">
          <MapContainer 
            center={centerPosition} 
            zoom={8} 
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {filteredBridges.map(bridge => (
              <Marker 
                key={bridge.id} 
                position={[bridge.lat, bridge.lng]}
                icon={createMarkerIcon(bridge.status, bridge.risk_score)}
              >
                <Popup>
                  <div style={{ padding: '0.5rem', minWidth: '200px' }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#111' }}>{bridge.name}</h3>
                    <p style={{ margin: '0 0 0.5rem 0', color: '#555', fontSize: '0.9rem' }}>
                      {bridge.district}, {bridge.state}
                    </p>
                    <p style={{ margin: '0 0 0.5rem 0' }}>
                      <strong>Status:</strong> <span style={{ color: `var(--color-${bridge.status.toLowerCase()})`, fontWeight: 'bold' }}>{bridge.status}</span>
                    </p>
                    <button 
                      onClick={() => navigate(`/bridge/${bridge.id}`)}
                      style={{ width: '100%', padding: '0.4rem', marginTop: '0.5rem' }}
                      className="btn-primary"
                    >
                      View Details
                    </button>
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
