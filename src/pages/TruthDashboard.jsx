import { useState, useEffect } from 'react';
import { getTruthCounter } from '../lib/truthCounter';

export default function TruthDashboard() {
  const [data, setData] = useState({ officialCollapses: 42, realityCollapses: 170, gap: 128 });
  const [loading, setLoading] = useState(true);
  const [daysSince, setDaysSince] = useState(0);

  useEffect(() => {
    // Tick counter
    const calcDays = () => Math.floor((Date.now() - new Date('2025-07-10')) / 86400000);
    setDaysSince(calcDays());
    const interval = setInterval(() => setDaysSince(calcDays()), 1000);
    
    // Fetch real data
    getTruthCounter().then(res => {
      if (res) {
        setData({
          officialCollapses: res.official_collapses,
          realityCollapses: res.reality_collapses,
          gap: res.reality_collapses - res.official_collapses
        });
      }
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false); // fallback to defaults on error
    });

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="page-container">
      <div className="banner-header">
        GOVERNMENT VS REALITY — India's Hidden Bridge Crisis
      </div>

      <div className="grid-3" style={{ marginBottom: '3rem' }}>
        <div className="card-dark">
          <div className="stat-title">GOVERNMENT CLAIMS</div>
          <div className="stat-number text-gray">{data.officialCollapses}</div>
          <div className="stat-subtitle">collapses · 2019–2024</div>
          <div className="stat-source">MoRTH Parliamentary Response</div>
        </div>

        <div className="card-red">
          <div className="stat-title">GROUND REALITY</div>
          <div className="stat-number">{data.realityCollapses}+</div>
          <div className="stat-subtitle">collapses · 2021–2025</div>
          <div className="stat-source">Newslaundry Media Analysis · 202 Deaths</div>
        </div>

        <div className="card-orange">
          <div className="stat-title">THE GAP</div>
          <div className="stat-number">{data.gap}</div>
          <div className="stat-subtitle">hidden collapses</div>
          <div className="stat-source">202 Deaths · 441 Injured</div>
        </div>
      </div>

      <div className="ticking-counter">
        <div className="ticking-text">Days since Gambhira Bridge collapse:</div>
        <div className="ticking-number">{daysSince}</div>
        <div className="ticking-sub">22 people died. Locals warned for months. No system existed to hear them.</div>
      </div>

      <div className="card-dark" style={{ marginTop: '3rem', textAlign: 'left' }}>
        <div className="section-title">How We Count</div>
        <p style={{ marginBottom: '1rem', color: 'var(--color-text-muted)' }}>
          The government officially acknowledges only a fraction of bridge failures, often classifying them under vague categories like "structural wear" or completely omitting rural bridge collapses from federal databases.
        </p>
        <p style={{ marginBottom: '1rem', color: 'var(--color-text-muted)' }}>
          <strong>Ground Reality</strong> is calculated by continuously parsing regional news reports, citizen journalism, and local authority notices. We verify these incidents using photo evidence and geolocation.
        </p>
        <p style={{ color: 'var(--color-text-muted)' }}>
          <strong>The Gap</strong> represents the number of major infrastructure failures that have occurred without any central accountability or policy change. Our mission is to reduce this gap to zero.
        </p>
      </div>
    </div>
  );
}
