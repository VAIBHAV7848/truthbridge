import { useParams, useNavigate } from 'react-router-dom';
import { useBridge } from '../hooks/useBridges';

export default function BridgeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { bridge, loading, error } = useBridge(id);

  if (loading) {
    return (
      <div className="page-container">
        <div className="skeleton" style={{ height: '200px', marginBottom: '2rem' }}></div>
        <div className="skeleton" style={{ height: '300px' }}></div>
      </div>
    );
  }

  if (error || !bridge) {
    return (
      <div className="page-container">
        <div className="card-red">
          <h2>⚠️ Bridge Not Found</h2>
          <p>{error?.message || "This bridge doesn't exist or was removed."}</p>
          <button className="btn-primary" onClick={() => navigate('/')} style={{ marginTop: '1rem' }}>Return to Map</button>
        </div>
      </div>
    );
  }

  const sLower = bridge.status.toLowerCase();

  // Helper for report timing
  const getTimerUI = (report) => {
    const days = Math.floor((Date.now() - new Date(report.created_at)) / 86400000);
    const status = report.status;
    
    if ((status === 'IGNORED' || status === 'PENDING') && days > 30) {
      return <span style={{ color: 'var(--color-critical)', fontWeight: 'bold' }}>⚠️ IGNORED — {days} days. No action taken.</span>;
    }
    if (status === 'PENDING' && days <= 30) {
      return <span style={{ color: 'var(--color-warning)', fontWeight: 'bold' }}>⏱️ {days} days — Awaiting authority response</span>;
    }
    if (status === 'ACTION_TAKEN') {
      return <span style={{ color: 'var(--color-safe)', fontWeight: 'bold' }}>✅ Action taken</span>;
    }
    if (status === 'UNDER_REVIEW') {
      return <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>🔍 Under review</span>;
    }
    return <span>{status}</span>;
  };

  // Helper for severity badge
  const getSeverityBadge = (severity) => {
    if (severity === 'DANGEROUS') return <span className="badge" style={{ background: 'var(--color-critical)', color: 'white' }}>DANGEROUS</span>;
    if (severity === 'SERIOUS') return <span className="badge" style={{ background: 'var(--color-warning)', color: 'white' }}>SERIOUS</span>;
    return <span className="badge" style={{ background: 'var(--color-monitor)', color: 'white' }}>VISIBLE</span>;
  };

  return (
    <div className="page-container">
      {/* Top Banner */}
      <div className={`detail-banner detail-banner-${sLower}`}>
        <div>
          <div className="badge" style={{ background: 'rgba(255,255,255,0.2)', marginBottom: '1rem' }}>
            STATUS: {bridge.status}
          </div>
          <h1>{bridge.name}</h1>
          <p style={{ fontSize: '1.2rem', opacity: 0.9 }}>{bridge.district}, {bridge.state}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '3rem', fontWeight: '900', lineHeight: 1 }}>{bridge.risk_score}</div>
          <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>RISK SCORE</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
        <button className="btn-danger" style={{ width: 'auto' }} onClick={() => navigate(`/report/${bridge.id}`)}>
          📸 Report This Bridge
        </button>
      </div>

      <div className="grid-2">
        {/* Left Column: Info & Risk */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card-dark">
            <h2 className="section-title">Risk Breakdown (IRC Standards)</h2>
            
            <div style={{ marginBottom: '1rem' }}>
              <div className="flex-between">
                <strong>Overall Risk</strong>
                <span>{bridge.risk_score}%</span>
              </div>
              <div className="progress-container">
                <div className="progress-bar" style={{ width: `${bridge.risk_score}%`, background: `var(--color-${sLower})` }}></div>
              </div>
            </div>

            <div style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div className="flex-between"><span>Age Factor</span><span>{bridge.risk_factors?.age || 0} / 25</span></div>
              <div className="flex-between"><span>Citizen Reports</span><span>{bridge.risk_factors?.reports || 0} / 25</span></div>
              <div className="flex-between"><span>Inspection Gap</span><span>{bridge.risk_factors?.inspection || 0} / 20</span></div>
              <div className="flex-between"><span>Monsoon Risk</span><span>{bridge.risk_factors?.weather || 0} / 20</span></div>
              <div className="flex-between"><span>Seismic Zone</span><span>{bridge.risk_factors?.seismic || 0} / 10</span></div>
            </div>
          </div>

          <div className="card-dark">
            <h2 className="section-title">Structural Details</h2>
            <div className="grid-2" style={{ textAlign: 'left', gap: '1rem' }}>
              <div>
                <div className="text-gray" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Year Built</div>
                <div style={{ fontWeight: '600' }}>{bridge.year_built} ({new Date().getFullYear() - bridge.year_built} years old)</div>
              </div>
              <div>
                <div className="text-gray" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Bridge Type</div>
                <div style={{ fontWeight: '600' }}>{bridge.bridge_type}</div>
              </div>
              <div>
                <div className="text-gray" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Managing Authority</div>
                <div style={{ fontWeight: '600' }}>{bridge.managing_authority || 'Unknown'}</div>
              </div>
              <div>
                <div className="text-gray" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Seismic Zone</div>
                <div style={{ fontWeight: '600' }}>Zone {bridge.seismic_zone}</div>
              </div>
              <div>
                <div className="text-gray" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Last Inspected</div>
                <div style={{ fontWeight: '600' }}>{bridge.last_inspected_date ? new Date(bridge.last_inspected_date).toLocaleDateString() : 'No Record'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Reports */}
        <div className="card-dark" style={{ textAlign: 'left' }}>
          <div className="flex-between" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--color-glass-border)', paddingBottom: '0.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Citizen Reports</h2>
            <span className="badge" style={{ background: 'var(--color-surface-hover)' }}>{bridge.reports?.length || 0} Total</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '600px', overflowY: 'auto', paddingRight: '0.5rem' }}>
            {bridge.reports && bridge.reports.length > 0 ? (
              bridge.reports.map(report => (
                <div key={report.id} className="report-card">
                  <div className="flex-between" style={{ marginBottom: '0.8rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.1)' }}>{report.damage_type.replace('_', ' ')}</span>
                      {getSeverityBadge(report.severity)}
                    </div>
                    <span className="text-gray" style={{ fontSize: '0.8rem' }}>{new Date(report.created_at).toLocaleDateString()}</span>
                  </div>
                  
                  <p style={{ marginBottom: '1rem', lineHeight: '1.5' }}>"{report.description}"</p>
                  
                  <div style={{ padding: '0.8rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', fontSize: '0.9rem' }}>
                    {getTimerUI(report)}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray">No damage reports filed for this bridge yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
