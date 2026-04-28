/**
 * TruthBridge — Citizen Profile
 *
 * A premium profile dashboard for verified citizens showing their
 * report history, impact stats, and account management.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { signOut } from '../../lib/auth';

export default function CitizenProfile() {
  const navigate = useNavigate();
  const { user, loading: authLoading, isVerified, isAdmin } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);

  // Redirect admins to their own profile
  useEffect(() => {
    if (!authLoading && isAdmin) navigate('/admin/profile');
  }, [authLoading, isAdmin, navigate]);

  // Fetch this citizen's reports
  useEffect(() => {
    if (!user) return;
    async function fetchMyReports() {
      try {
        const { data, error } = await supabase
          .from('reports')
          .select('*, bridges:bridge_id(name, district, state)')
          .order('created_at', { ascending: false })
          .limit(50);
        if (error) throw error;
        setReports(data || []);
      } catch (err) {
        console.error('Failed to load reports:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchMyReports();
  }, [user]);

  async function handleLogout() {
    await signOut();
    navigate('/');
  }

  if (authLoading) return (
    <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="loading-spinner" />
    </div>
  );

  if (!user) {
    navigate('/citizen/login');
    return null;
  }

  // Compute stats
  const totalReports = reports.length;
  const pendingReports = reports.filter(r => r.status === 'PENDING').length;
  const actionTaken = reports.filter(r => r.status === 'ACTION_TAKEN').length;
  const ignoredReports = reports.filter(r => r.status === 'IGNORED' || r.status === 'DISMISSED').length;
  const impactScore = Math.min(100, totalReports * 8 + actionTaken * 15);
  const joinDate = user.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';
  const statusColors = {
    PENDING: { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)', text: '#fbbf24' },
    UNDER_REVIEW: { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.3)', text: '#60a5fa' },
    ACTION_TAKEN: { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)', text: '#34d399' },
    IGNORED: { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)', text: '#f87171' },
    DISMISSED: { bg: 'rgba(148,163,184,0.15)', border: 'rgba(148,163,184,0.3)', text: '#94a3b8' },
  };

  return (
    <>
      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}>
          <img src={lightbox} alt="Report" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }} />
        </div>
      )}

      <div className="page-container" style={{ maxWidth: 900 }}>
        {/* ─── Profile Header ─── */}
        <div className="glass-panel" style={{ padding: '2.5rem', marginBottom: '2rem', position: 'relative', overflow: 'hidden' }}>
          {/* Decorative gradient */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)' }} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem', fontWeight: 800, color: '#fff',
              boxShadow: '0 8px 24px rgba(59,130,246,0.4)',
              flexShrink: 0,
            }}>
              {user.email?.charAt(0).toUpperCase() || '?'}
            </div>

            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                {user.email?.split('@')[0] || 'Citizen'}
              </h1>
              <p className="text-gray" style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>{user.email}</p>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.3rem 0.75rem', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600,
                  background: isVerified ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                  border: `1px solid ${isVerified ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  color: isVerified ? '#34d399' : '#f87171',
                }}>
                  {isVerified ? '✓ Verified' : '✕ Unverified'}
                </span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.3rem 0.75rem', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600,
                  background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa',
                }}>
                  🛡️ Citizen
                </span>
              </div>
            </div>

            <button onClick={handleLogout} className="btn-secondary" style={{ alignSelf: 'flex-start' }}>
              Logout
            </button>
          </div>

          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: 10, fontSize: '0.85rem', color: '#94a3b8' }}>
            <span style={{ marginRight: '2rem' }}>📅 Joined: <strong style={{ color: '#fff' }}>{joinDate}</strong></span>
            <span>📧 Email: <strong style={{ color: '#fff' }}>{user.email}</strong></span>
          </div>
        </div>

        {/* ─── Impact Stats ─── */}
        <div className="grid-4" style={{ marginBottom: '2rem' }}>
          <div className="card-dark" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#3b82f6' }} />
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff' }}>{totalReports}</div>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Total Reports</div>
          </div>
          <div className="card-dark" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#10b981' }} />
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#34d399' }}>{actionTaken}</div>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Action Taken</div>
          </div>
          <div className="card-dark" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#f59e0b' }} />
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fbbf24' }}>{pendingReports}</div>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Pending</div>
          </div>
          <div className="card-dark" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }} />
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#a78bfa' }}>{impactScore}</div>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Impact Score</div>
          </div>
        </div>

        {/* ─── Impact Progress Bar ─── */}
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 700, fontSize: '1rem' }}>🏆 Citizen Impact</span>
            <span style={{ fontWeight: 700, color: '#a78bfa' }}>{impactScore}/100</span>
          </div>
          <div className="progress-container">
            <div className="progress-bar" style={{ width: `${impactScore}%`, background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)', borderRadius: 10 }} />
          </div>
          <p className="text-gray" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
            {impactScore >= 80 ? '🔥 Top Contributor — Your reports are making a real difference!'
              : impactScore >= 50 ? '💪 Active Citizen — Keep reporting to increase your impact.'
              : impactScore >= 20 ? '📸 Getting Started — Submit more verified reports to grow your score.'
              : '🌱 New Citizen — Submit your first report to start making an impact!'}
          </p>
        </div>

        {/* ─── Report History ─── */}
        <div style={{ textAlign: 'left' }}>
          <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>📋 My Report History</span>
            <button className="btn-primary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }} onClick={() => navigate('/report')}>
              + New Report
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div className="loading-spinner" style={{ margin: '0 auto' }} />
            </div>
          ) : reports.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>📭</div>
              <h3 style={{ marginBottom: '0.5rem' }}>No Reports Yet</h3>
              <p className="text-gray" style={{ marginBottom: '1.5rem' }}>You haven't submitted any bridge damage reports. Be the first to make a difference!</p>
              <button className="btn-primary" onClick={() => navigate('/report')}>📸 Report Bridge Damage</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {reports.map(r => {
                const sc = statusColors[r.status] || statusColors.PENDING;
                const bridge = r.bridges || {};
                const date = new Date(r.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
                return (
                  <div key={r.id} className="report-card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    {r.photo_url && (
                      <img
                        src={r.photo_url} alt="Evidence"
                        onClick={() => setLightbox(r.photo_url)}
                        style={{ width: 80, height: 80, borderRadius: 10, objectFit: 'cover', cursor: 'zoom-in', border: '2px solid var(--color-glass-border)', flexShrink: 0 }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <strong style={{ fontSize: '1.05rem' }}>{String(bridge.name || r.bridge_name || 'Unknown Bridge')}</strong>
                          <p className="text-gray" style={{ fontSize: '0.8rem', marginTop: '0.15rem' }}>
                            {bridge.district && typeof bridge.district === 'string' ? `${bridge.district}, ${bridge.state || ''}` : ''} · {String(date)}
                          </p>
                        </div>
                        <span style={{
                          padding: '0.25rem 0.75rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700,
                          background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text,
                          textTransform: 'uppercase', letterSpacing: 0.5,
                        }}>
                          {r.status?.replace('_', ' ')}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                        <span className="badge" style={{ background: 'rgba(255,255,255,0.08)' }}>{r.damage_type?.replace('_', ' ')}</span>
                        <span className="badge" style={{ background: r.severity === 'DANGEROUS' ? 'rgba(239,68,68,0.2)' : 'rgba(249,115,22,0.2)', color: r.severity === 'DANGEROUS' ? '#f87171' : '#fb923c' }}>
                          {r.severity}
                        </span>
                      </div>
                      {r.description && <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>"{r.description}"</p>}
                      {r.response_notes && (
                        <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', background: 'rgba(16,185,129,0.1)', borderRadius: 8, fontSize: '0.8rem', color: '#6ee7b7' }}>
                          💬 Authority Response: {String(r.response_notes)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
