import { useState, useEffect } from 'react'
import { getTruthCounter } from '../lib/truthCounter'

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

  useEffect(() => {
    // Tick counter
    const calcDays = () => Math.floor((Date.now() - new Date('2025-07-10').getTime()) / 86400000);
    setDays(calcDays());
    const interval = setInterval(() => setDays(calcDays()), 1000);
    
    // Fetch real data
    const fetchTruth = async () => {
      try {
        const res = await getTruthCounter();
        if (res) {
          setCounter({
            officialCollapses: res.official_collapses || 42,
            realityCollapses: res.reality_collapses || 170,
            realityDeaths: res.reality_deaths || 202,
            realityInjured: res.reality_injured || 441,
            officialSource: res.official_source || 'MoRTH Parliamentary Response 2024',
            realitySource: res.reality_source || 'Newslaundry Media Analysis July 2025'
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

      <div className="grid-3" style={{marginBottom: '3rem'}}>
        <div className="card-dark">
          <div className="stat-title">GOVERNMENT CLAIMS</div>
          <div className="stat-number" style={{color:'#94a3b8'}}>{counter.officialCollapses}</div>
          <div className="stat-subtitle">collapses · 2019–2024</div>
          <div className="stat-source">{counter.officialSource}</div>
        </div>

        <div className="card-red">
          <div className="stat-title">GROUND REALITY</div>
          <div className="stat-number" style={{color:'#ef4444'}}>{counter.realityCollapses}+</div>
          <div className="stat-subtitle">collapses · 2021–2025</div>
          <div className="stat-source">{counter.realitySource}</div>
        </div>

        <div className="card-orange">
          <div className="stat-title">THE GAP</div>
          <div className="stat-number" style={{color:'#f97316'}}>{gap}</div>
          <div className="stat-subtitle">hidden collapses</div>
          <div className="stat-source">{counter.realityDeaths} Deaths · {counter.realityInjured} Injured</div>
        </div>
      </div>

      <div className="ticking-counter">
        <div className="ticking-text">Days since Gambhira Bridge collapse:</div>
        <div className="ticking-number">{days}</div>
        <div className="ticking-sub">22 people died. Locals warned for months. No system existed to hear them.</div>
      </div>

      <div className="glass-panel" style={{padding:'2rem',marginTop:'2rem',textAlign:'left'}}>
        <div className="section-title">How We Count</div>
        <p className="text-gray" style={{marginBottom:'1rem'}}>
          The government officially acknowledges only a fraction of bridge failures, often classifying them under vague categories like "structural wear" or completely omitting rural bridge collapses from federal databases.
        </p>
        <p className="text-gray" style={{marginBottom:'1rem'}}>
          <strong>Ground Reality</strong> is calculated by continuously parsing regional news reports, citizen journalism, and local authority notices. We verify these incidents using photo evidence and geolocation.
        </p>
        <p className="text-gray">
          <strong>The Gap</strong> represents the number of major infrastructure failures that have occurred without any central accountability or policy change. Our mission is to reduce this gap to zero.
        </p>
      </div>
    </div>
  );
}
