import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useBridge } from '../hooks/useBridges'
import { getRainfall } from '../lib/weather'

function getTimerBadge(status, createdAt) {
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000)
  if (status === 'ACTION_TAKEN') return { text: '✅ Action Taken', color: '#10b981' }
  if (status === 'UNDER_REVIEW') return { text: '🔍 Under Review', color: '#3b82f6' }
  if (status === 'DISMISSED') return { text: 'Dismissed', color: '#94a3b8' }
  if (days > 30) return { text: `⚠️ IGNORED — ${days} days. No action taken.`, color: '#ef4444' }
  return { text: `⏱️ ${days} days — Awaiting authority response`, color: '#f59e0b' }
}

function RiskBar({ value, max, color }) {
  return (
    <div className="progress-container">
      <div className="progress-bar" style={{ width: `${(value / max) * 100}%`, background: color }} />
    </div>
  )
}

export default function BridgeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { bridge, loading, error } = useBridge(id)
  const [weather, setWeather] = useState(null)
  const [weatherLoading, setWeatherLoading] = useState(true)

  useEffect(() => {
    if (bridge?.lat && bridge?.lng) {
      getRainfall(bridge.lat, bridge.lng)
        .then(setWeather)
        .catch(() => setWeather(null))
        .finally(() => setWeatherLoading(false))
    }
  }, [bridge])

  if (loading) {
    return (
      <div className="page-container">
        <div className="loader"><div className="spinner"></div></div>
      </div>
    )
  }

  if (error || !bridge) {
    return (
      <div className="page-container">
        <div className="card-red">
          <h2 className="text-red">⚠️ Error Loading Bridge</h2>
          <p>{error?.message || 'Bridge not found.'}</p>
        </div>
      </div>
    )
  }

  const statusColor = { CRITICAL: '#ef4444', WARNING: '#f97316', MONITOR: '#f59e0b', SAFE: '#10b981' }
  const bannerClass = { CRITICAL: 'detail-banner detail-banner-critical', WARNING: 'detail-banner detail-banner-warning', MONITOR: 'detail-banner detail-banner-monitor', SAFE: 'detail-banner detail-banner-safe' }

  const bd = typeof bridge.risk_breakdown === 'string' ? JSON.parse(bridge.risk_breakdown || '{}') : (bridge.risk_breakdown || {})

  const riskColor = { LOW: '#10b981', MODERATE: '#f59e0b', HIGH: '#f97316', EXTREME: '#ef4444' }
  const isHeavyRain = weather && weather.rainfall_mm >= 100
  const weatherCardClass = isHeavyRain ? 'card-red' : (weather?.riskLevel === 'MODERATE' ? 'card-orange' : 'card-dark')

  return (
    <div className="page-container">
      <div className={bannerClass[bridge.status]}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2.5rem', lineHeight: 1.1 }}>{bridge.name}</h1>
          <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9, fontSize: '1.2rem' }}>{bridge.district}, {bridge.state}</p>
          <p style={{ margin: 0, opacity: 0.7, fontSize: '0.9rem' }}>{bridge.address || ''}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '4rem', fontWeight: 900, color: statusColor[bridge.status], lineHeight: 1 }}>{bridge.risk_score}</div>
          <div style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '0.5rem' }}>/100 Risk Score</div>
          <div className={`risk-badge status-${bridge.status.toLowerCase()}`}>
            <div className="pulse-dot"></div>{bridge.status}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
        <button className="btn-danger" style={{ width: 'auto' }} onClick={() => navigate(`/report/${bridge.id}`)}>
          📸 Report This Bridge
        </button>
      </div>

      {/* Monsoon Alert Banner */}
      {isHeavyRain && (
        <div style={{
          background: 'linear-gradient(135deg, #7f1d1d, #450a0a)',
          border: '1px solid rgba(239,68,68,0.5)',
          borderRadius: 12,
          padding: '1rem 1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          animation: 'pulse-crit 2s infinite',
          boxShadow: '0 0 30px rgba(239,68,68,0.3)'
        }}>
          <span style={{ fontSize: '2rem' }}>⚠️</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fca5a5' }}>MONSOON ALERT — Heavy Rainfall Detected</div>
            <div style={{ color: '#f87171', fontSize: '0.9rem' }}>
              {weather.rainfall_mm}mm/day estimated near this bridge. Risk score may be elevated. Exercise extreme caution.
            </div>
          </div>
        </div>
      )}

      <div className="grid-2" style={{ marginBottom: '3rem' }}>
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'left' }}>
          <h2 className="section-title">Risk Score Breakdown (IRC:81-1997)</h2>
          <div style={{ marginBottom: '1.5rem' }}>
            <div className="flex-between" style={{ fontWeight: 700 }}><span>Overall Risk</span><span>{bridge.risk_score}%</span></div>
            <RiskBar value={bridge.risk_score} max={100} color={statusColor[bridge.status]} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div className="flex-between text-gray" style={{ fontSize: '0.9rem' }}><span>Age Factor</span><span>{bd.age_factor || 0}/25</span></div>
              <RiskBar value={bd.age_factor || 0} max={25} color={statusColor[bridge.status]} />
            </div>
            <div>
              <div className="flex-between text-gray" style={{ fontSize: '0.9rem' }}><span>Citizen Reports</span><span>{bd.citizen_reports || 0}/25</span></div>
              <RiskBar value={bd.citizen_reports || 0} max={25} color={statusColor[bridge.status]} />
            </div>
            <div>
              <div className="flex-between text-gray" style={{ fontSize: '0.9rem' }}><span>Inspection Gap</span><span>{bd.inspection_gap || 0}/20</span></div>
              <RiskBar value={bd.inspection_gap || 0} max={20} color={statusColor[bridge.status]} />
            </div>
            <div>
              <div className="flex-between text-gray" style={{ fontSize: '0.9rem' }}><span>Monsoon Risk</span><span>{bd.monsoon_risk || 0}/20</span></div>
              <RiskBar value={bd.monsoon_risk || 0} max={20} color={statusColor[bridge.status]} />
            </div>
            <div>
              <div className="flex-between text-gray" style={{ fontSize: '0.9rem' }}><span>Seismic Zone</span><span>{bd.seismic_zone || 0}/10</span></div>
              <RiskBar value={bd.seismic_zone || 0} max={10} color={statusColor[bridge.status]} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'left', flex: 1 }}>
            <h2 className="section-title">Bridge Details</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <div className="text-gray" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Year Built</div>
                <div style={{ fontWeight: 600 }}>{bridge.year_built}</div>
              </div>
              <div className="grid-2">
                <div>
                  <div className="text-gray" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Bridge Type</div>
                  <div style={{ fontWeight: 600 }}>{bridge.bridge_type}</div>
                </div>
                <div>
                  <div className="text-gray" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Dimensions</div>
                  <div style={{ fontWeight: 600 }}>{bridge.length_m}m x {bridge.width_m}m</div>
                </div>
              </div>
              <div>
                <div className="text-gray" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Last Inspected</div>
                <div style={{ fontWeight: 600 }}>{bridge.last_inspection_date ? new Date(bridge.last_inspection_date).toLocaleDateString() : 'Never on record'}</div>
              </div>
              <div>
                <div className="text-gray" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Managing Authority</div>
                <div style={{ fontWeight: 600 }}>{bridge.responsible_authority || 'Unknown'}</div>
              </div>
              <div>
                <div className="text-gray" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Seismic Zone</div>
                <div style={{ fontWeight: 600 }}>Zone {bridge.seismic_zone}</div>
              </div>
            </div>
          </div>

          {/* Weather Card */}
          <div className={weatherCardClass} style={{ textAlign: 'left' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', letterSpacing: '0.5px' }}>
              🌦️ LIVE WEATHER AT BRIDGE LOCATION
            </h3>
            {weatherLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div className="spinner" style={{ width: 20, height: 20 }}></div>
                <span className="text-gray">Fetching weather data...</span>
              </div>
            ) : weather ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div className="flex-between">
                  <span className="text-gray">Rainfall</span>
                  <span style={{ fontWeight: 700, color: riskColor[weather.riskLevel] || '#fff' }}>
                    {weather.rainfall_mm} mm/day · {weather.riskLevel}
                  </span>
                </div>
                <div className="flex-between">
                  <span className="text-gray">Temperature</span>
                  <span style={{ fontWeight: 600 }}>{weather.temperature}°C</span>
                </div>
                <div className="flex-between">
                  <span className="text-gray">Humidity</span>
                  <span style={{ fontWeight: 600 }}>{weather.humidity}%</span>
                </div>
                <div className="flex-between">
                  <span className="text-gray">Conditions</span>
                  <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{weather.description}</span>
                </div>
              </div>
            ) : (
              <p className="text-gray" style={{ fontSize: '0.9rem' }}>Weather data unavailable. Configure VITE_OPENWEATHER_KEY.</p>
            )}
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'left' }}>
        <div className="section-title">Citizen Reports ({bridge.reports?.length || 0})</div>
        <div className="grid-2">
          {bridge.reports?.length > 0 ? bridge.reports.map(r => {
            const tb = getTimerBadge(r.status, r.created_at)
            const dmgColorMap = { CRACK: '#ef4444', SCOUR: '#f97316', FOUNDATION: '#f97316', OVERLOADING: '#f59e0b', RAILING_BROKEN: '#f59e0b', SPALLING: '#f97316', OTHER: '#94a3b8' }
            const sevColorMap = { DANGEROUS: '#ef4444', SERIOUS: '#f97316', VISIBLE: '#f59e0b' }

            return (
              <div key={r.id} className="report-card">
                <div className="flex-between" style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span className="badge" style={{ background: dmgColorMap[r.damage_type] }}>{r.damage_type.replace('_', ' ')}</span>
                    <span className="badge" style={{ background: sevColorMap[r.severity] }}>{r.severity}</span>
                  </div>
                  <div className="text-gray" style={{ fontSize: '0.8rem' }}>{new Date(r.created_at).toLocaleDateString()}</div>
                </div>
                {r.description && <p style={{ marginBottom: '1rem', fontStyle: 'italic' }}>"{r.description}"</p>}

                <span className="badge" style={{ background: `${tb.color}22`, color: tb.color, border: `1px solid ${tb.color}44`, display: 'inline-block' }}>
                  {tb.text}
                </span>

                {r.photo_url && <img src={r.photo_url} alt="Report" style={{ width: '100%', borderRadius: 8, marginTop: 12, maxHeight: 200, objectFit: 'cover' }} />}
              </div>
            )
          }) : (
            <p className="text-gray">No reports filed for this bridge.</p>
          )}
        </div>
      </div>
    </div>
  )
}
