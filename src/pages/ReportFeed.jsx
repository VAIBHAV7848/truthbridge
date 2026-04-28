import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const mins = Math.floor(seconds / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

function getTimerBadge(status, createdAt) {
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000)
  if (status === 'ACTION_TAKEN') return { text: '✅ Action Taken', color: '#10b981' }
  if (status === 'UNDER_REVIEW') return { text: '🔍 Under Review', color: '#3b82f6' }
  if (status === 'DISMISSED') return { text: 'Dismissed', color: '#94a3b8' }
  if (days > 30) return { text: `⚠️ IGNORED — ${days} days`, color: '#ef4444' }
  return { text: `⏱️ ${days}d — Awaiting response`, color: '#f59e0b' }
}

export default function ReportFeed() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [lightbox, setLightbox] = useState(null)

  useEffect(() => {
    async function fetchReports() {
      try {
        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .eq('is_public', true)
          .order('created_at', { ascending: false })
          .limit(50)
        if (error) throw error

        // fetch bridge names
        const bridgeIds = [...new Set((data || []).map(r => r.bridge_id))]
        const { data: bridgeData } = await supabase
          .from('bridges')
          .select('id, name, district, state')
          .in('id', bridgeIds)
        const bridgeMap = Object.fromEntries((bridgeData || []).map(b => [b.id, b]))

        setReports((data || []).map(r => ({
          ...r,
          bridgeName: bridgeMap[r.bridge_id]?.name || 'Unknown Bridge',
          bridgeDistrict: bridgeMap[r.bridge_id]?.district || '',
          bridgeState: bridgeMap[r.bridge_id]?.state || ''
        })))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchReports()
  }, [])

  const filtered = filter === 'ALL' ? reports : reports.filter(r => r.severity === filter)
  const sevColorMap = { DANGEROUS: '#ef4444', SERIOUS: '#f97316', VISIBLE: '#f59e0b' }
  const dmgColorMap = { CRACK: '#ef4444', SCOUR: '#f97316', FOUNDATION: '#f97316', OVERLOADING: '#f59e0b', RAILING_BROKEN: '#f59e0b', SPALLING: '#f97316', OTHER: '#94a3b8' }

  return (
    <>
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'zoom-out'
          }}
        >
          <img src={lightbox} alt="Full view" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }} />
        </div>
      )}

      <div className="page-container">
        <div className="banner-header">📡 LIVE CITIZEN REPORTS</div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          {['ALL', 'DANGEROUS', 'SERIOUS', 'VISIBLE'].map(f => (
            <button key={f} className={`filter-btn${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
              {f === 'ALL' ? `ALL (${reports.length})` : `${f} (${reports.filter(r => r.severity === f).length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loader" style={{ marginTop: '3rem' }}>
            <div className="spinner"></div>
            <p className="text-gray">Loading reports...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card-dark" style={{ padding: '3rem', textAlign: 'center' }}>
            <p className="text-gray" style={{ fontSize: '1.2rem' }}>No reports found.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filtered.map(r => {
              const tb = getTimerBadge(r.status, r.created_at)
              return (
                <div key={r.id} className="report-card" style={{ textAlign: 'left' }}>
                  <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
                    <div>
                      <Link to={`/bridge/${r.bridge_id}`} style={{ fontWeight: 700, fontSize: '1.1rem', color: '#fff' }}>
                        {r.bridgeName}
                      </Link>
                      <span className="text-gray" style={{ fontSize: '0.85rem', marginLeft: '0.5rem' }}>
                        {r.bridgeDistrict}, {r.bridgeState}
                      </span>
                    </div>
                    <span className="text-gray" style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{timeAgo(r.created_at)}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                    <span className="badge" style={{ background: dmgColorMap[r.damage_type] || '#94a3b8', color: '#fff' }}>
                      {r.damage_type?.replace('_', ' ')}
                    </span>
                    <span className="badge" style={{ background: sevColorMap[r.severity], color: '#fff' }}>
                      {r.severity}
                    </span>
                    <span className="badge" style={{ background: `${tb.color}22`, color: tb.color, border: `1px solid ${tb.color}44` }}>
                      {tb.text}
                    </span>
                  </div>

                  {r.description && (
                    <p style={{ marginBottom: '0.75rem', fontStyle: 'italic', color: '#94a3b8', fontSize: '0.95rem' }}>
                      "{r.description}"
                    </p>
                  )}

                  {r.photo_url && (
                    <img
                      src={r.photo_url}
                      alt="Report evidence"
                      onClick={() => setLightbox(r.photo_url)}
                      style={{
                        width: '100%', maxHeight: 240, objectFit: 'cover',
                        borderRadius: 8, cursor: 'zoom-in',
                        border: '1px solid var(--color-glass-border)'
                      }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
