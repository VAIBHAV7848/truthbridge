/**
 * TruthBridge — Truth Counter Dashboard
 */
import { useState, useEffect } from 'react';
import { getTruthCounter } from '../lib/truthCounter';

export default function TruthDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTruthCounter()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading truth counter...</p>;
  if (!data) return <p>No data available.</p>;

  return (
    <div id="truth-dashboard">
      <h1>📊 Truth Counter</h1>
      <p>Government Data vs. Reality — The Transparency Gap</p>

      <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', margin: '2rem 0' }}>
        <div>
          <h2>{data.officialCollapses}</h2>
          <p>Government Official Count</p>
          <small>{data.officialSource}</small>
        </div>
        <div>
          <h2 style={{ color: '#ff4444' }}>{data.realityCollapses}+</h2>
          <p>Media/Citizen Reality Count</p>
          <small>{data.realitySource}</small>
        </div>
      </div>

      <div>
        <h2 style={{ color: '#ff6600' }}>GAP: {data.gap} Hidden Collapses</h2>
        <p>{data.realityDeaths} Deaths | {data.realityInjured} Injured</p>
        <p>Citizen Reports on Platform: {data.citizenReportsOnPlatform}</p>
      </div>
    </div>
  );
}
