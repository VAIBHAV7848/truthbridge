/**
 * TruthBridge — Nearby Bridges Component
 * 
 * Shows bridges near the user's current GPS location.
 */
import { useNavigate } from 'react-router-dom';
import { useNearbyBridges } from '../hooks/useNearbyBridges';
import { useToast } from '../context/ToastContext';

const statusColor = {
  CRITICAL: '#ef4444',
  WARNING: '#f97316',
  MONITOR: '#f59e0b',
  SAFE: '#10b981',
};

const statusBg = {
  CRITICAL: 'rgba(239, 68, 68, 0.15)',
  WARNING: 'rgba(249, 115, 22, 0.15)',
  MONITOR: 'rgba(245, 158, 11, 0.15)',
  SAFE: 'rgba(16, 185, 129, 0.15)',
};

export default function NearbyBridges({ bridges }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    userLocation,
    nearbyBridges,
    loading,
    error,
    detectNearbyBridges,
    clearNearby,
  } = useNearbyBridges(bridges);

  const handleDetect = () => {
    detectNearbyBridges(10); // 10km radius
    showToast('Detecting your location...', 'info');
  };

  if (error) {
    return (
      <div style={{
        padding: '1rem',
        background: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '10px',
        marginBottom: '1rem',
      }}>
        <p style={{ color: '#f87171', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
          ⚠️ {error}
        </p>
        <button onClick={clearNearby} className="btn-secondary" style={{ fontSize: '0.8rem' }}>
          Dismiss
        </button>
      </div>
    );
  }

  if (nearbyBridges.length === 0 && !userLocation) {
    return (
      <button
        onClick={handleDetect}
        disabled={loading}
        style={{
          width: '100%',
          padding: '0.75rem',
          marginBottom: '1rem',
          background: 'rgba(59, 130, 246, 0.15)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '10px',
          color: '#60a5fa',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
        }}
      >
        {loading ? (
          <>
            <div className="loading-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
            Detecting...
          </>
        ) : (
          <>
            📍 Find Bridges Near Me
          </>
        )}
      </button>
    );
  }

  return (
    <div style={{
      padding: '1rem',
      background: 'rgba(59, 130, 246, 0.08)',
      border: '1px solid rgba(59, 130, 246, 0.2)',
      borderRadius: '12px',
      marginBottom: '1rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <span style={{ fontWeight: 700, color: '#60a5fa' }}>
          📍 Nearby ({nearbyBridges.length})
        </span>
        <button onClick={clearNearby} style={{
          fontSize: '0.75rem',
          color: '#94a3b8',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
        }}>
          Clear
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {nearbyBridges.slice(0, 5).map(b => (
          <div
            key={b.id}
            onClick={() => navigate(`/bridge/${b.id}`)}
            style={{
              padding: '0.75rem',
              borderRadius: '8px',
              background: statusBg[b.status],
              border: `1px solid ${statusColor[b.status]}30`,
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{b.name}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                {b.distance.toFixed(1)} km away · {b.district}
              </div>
            </div>
            <span style={{
              padding: '0.25rem 0.5rem',
              borderRadius: '20px',
              fontSize: '0.7rem',
              fontWeight: 700,
              background: statusBg[b.status],
              color: statusColor[b.status],
              textTransform: 'uppercase',
            }}>
              {b.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
