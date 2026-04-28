import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useBridges } from '../hooks/useBridges';

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
  const { bridges, loading, error } = useBridges();
  const navigate = useNavigate();

  // Karnataka center coordinates
  const centerPosition = [15.3173, 75.7139];

  if (loading) {
    return (
      <div className="home-layout">
        <div className="loader">
          <div className="spinner"></div>
          <p>Connecting to TruthBridge network...</p>
        </div>
      </div>
    );
  }

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
    <div className="home-layout">
      {/* Sidebar List */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Active Bridges</h2>
          <p>{bridges.length} bridges being monitored</p>
        </div>
        
        <div className="bridge-list">
          {bridges.map(bridge => (
            <div 
              key={bridge.id} 
              className="bridge-card"
              onClick={() => navigate(`/bridge/${bridge.id}`)}
            >
              <div className="bridge-name">{bridge.name}</div>
              <div className="bridge-location">{bridge.district}, {bridge.state}</div>
              
              <div className="flex-between">
                <span className={`risk-badge status-${bridge.status.toLowerCase()}`}>
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
          ))}
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
          
          {bridges.map(bridge => (
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
  );
}
