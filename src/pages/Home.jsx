/**
 * TruthBridge — Home Page (Public Map)
 * Placeholder — will contain Leaflet map with bridge markers.
 */
import { useBridges } from '../hooks/useBridges';

export default function Home() {
  const { bridges, loading, error } = useBridges();

  return (
    <div id="home-page">
      <h1>🌉 TruthBridge</h1>
      <p>India's First Public Bridge Safety Accountability Platform</p>

      {loading && <p>Loading bridges...</p>}
      {error && <p>Error: {error.message}</p>}

      {/* Map component will be placed here */}
      <div id="bridge-map-container" style={{ height: '500px', background: '#1a1a2e' }}>
        <p style={{ color: '#888', textAlign: 'center', paddingTop: '200px' }}>
          🗺️ Leaflet Map — {bridges.length} bridges loaded
        </p>
      </div>

      {/* Bridge list fallback */}
      <div id="bridge-list">
        {bridges.map(b => (
          <div key={b.id} style={{ padding: '8px', borderBottom: '1px solid #333' }}>
            <strong>{b.name}</strong> — Risk: {b.risk_score}/100 — Status: {b.status}
          </div>
        ))}
      </div>
    </div>
  );
}
