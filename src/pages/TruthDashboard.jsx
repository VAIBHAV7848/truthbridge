import { useState, useEffect } from 'react'
import { getTruthCounter } from '../lib/truthCounter'

function useCountUp(target, duration = 2000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!target) return;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return count;
}

export default function TruthDashboard() {
  const [counter, setCounter] = useState({
    officialCollapses: 42,
    realityCollapses: 170,
    realityDeaths: 202,
    realityInjured: 441,
    officialSource: 'MoRTH Parliamentary Response 2024',
    realitySource: 'Newslaundry Media Analysis July 2025'
  });
  const gap = counter.realityCollapses - counter.officialCollapses;
  const [days, setDays] = useState(0);

  // Animated counters
  const animatedOfficial = useCountUp(counter.officialCollapses, 1500);
  const animatedReality = useCountUp(counter.realityCollapses, 2000);
  const animatedGap = useCountUp(gap, 2500);
  const animatedDeaths = useCountUp(counter.realityDeaths, 2000);
  const animatedInjured = useCountUp(counter.realityInjured, 2000);

  useEffect(() => {
    const calcDays = () => Math.floor((Date.now() - new Date('2025-07-10').getTime()) / 86400000);
    setDays(calcDays());
    const interval = setInterval(() => setDays(calcDays()), 1000);
    
    const fetchTruth = async () => {
      try {
        const res = await getTruthCounter();
        if (res) {
          setCounter({
            officialCollapses: res.officialCollapses ?? 42,
            realityCollapses: res.realityCollapses ?? 170,
            realityDeaths: res.realityDeaths ?? 202,
            realityInjured: res.realityInjured ?? 441,
            officialSource: res.officialSource ?? 'MoRTH Parliamentary Response 2024',
            realitySource: res.realitySource ?? 'Newslaundry Media Analysis July 2025'
          });
        }
      } catch (err) {
        console.error('Error fetching truth counter:', err);
      }
    };
    fetchTruth();

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="page-container">
      <div className="banner-header">
        GOVERNMENT VS REALITY — INDIA'S HIDDEN BRIDGE CRISIS
      </div>

      <div className="grid-3" style={{ marginBottom: '3rem' }}>
        <div className="card-dark">
          <div className="stat-title">GOVERNMENT CLAIMS</div>
          <div className="stat-number" style={{ color: '#94a3b8' }}>{animatedOfficial}</div>
          <div className="stat-subtitle">collapses · 2019–2024</div>
          <div className="stat-source">{counter.officialSource}</div>
        </div>

        <div className="card-red">
          <div className="stat-title">GROUND REALITY</div>
          <div className="stat-number" style={{ color: '#ef4444' }}>{animatedReality}+</div>
          <div className="stat-subtitle">collapses · 2021–2025</div>
          <div className="stat-source">{counter.realitySource}</div>
        </div>

        <div className="card-orange">
          <div className="stat-title">THE GAP</div>
          <div className="stat-number" style={{ color: '#f97316' }}>{animatedGap}</div>
          <div className="stat-subtitle">hidden collapses</div>
          <div className="stat-source">{animatedDeaths} Deaths · {animatedInjured} Injured</div>
        </div>
      </div>

      <div className="ticking-counter">
        <div className="ticking-text">Days since Gambhira Bridge collapse:</div>
        <div className="ticking-number">{days}</div>
        <div className="ticking-sub">22 people died. Locals warned for months. No system existed to hear them.</div>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', marginTop: '2rem', textAlign: 'left' }}>
        <div className="section-title">How We Count</div>
        <p className="text-gray" style={{ marginBottom: '1rem' }}>
          The government officially acknowledges only a fraction of bridge failures, often classifying them under vague categories like "structural wear" or completely omitting rural bridge collapses from federal databases.
        </p>
        <p className="text-gray" style={{ marginBottom: '1rem' }}>
          <strong>Ground Reality</strong> is calculated by continuously parsing regional news reports, citizen journalism, and local authority notices. We verify these incidents using photo evidence and geolocation.
        </p>
        <p className="text-gray">
          <strong>The Gap</strong> represents the number of major infrastructure failures that have occurred without any central accountability or policy change. Our mission is to reduce this gap to zero.
        </p>
      </div>
    </div>
  );
}
