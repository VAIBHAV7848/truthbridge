/**
 * TruthBridge — Admin Profile
 *
 * A premium, data-heavy profile dashboard for authority administrators
 * showing their accountability metrics, jurisdiction overview, and activity log.
 */
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { signOut } from '../../lib/auth';
import { computeAccountabilityScore, getAccountabilityLabel } from '../../lib/accountabilityScore';

export default function AdminProfile() {
  const navigate = useNavigate();
  const { user, authority, loading: authLoading, isAdmin } = useAuth();
  const [reports, setReports] = useState([]);
  const [bridges, setBridges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAdmin) navigate('/admin/login');
  }, [authLoading, isAdmin, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    async function fetchData() {
      try {
        const [reportsRes, bridgesRes] = await Promise.all([
          supabase.from('reports').select('id, status, created_at, responded_at, bridge_id, damage_type, severity').order('created_at', { ascending: false }).limit(200),
          supabase.from('bridges').select('id, name, status, risk_score, district').order('risk_score', { ascending: false }),
        ]);
        setReports(reportsRes.data || []);
        setBridges(bridgesRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [isAdmin]);

  async function handleLogout() {
    await signOut();
    navigate('/admin/login');
  }

  if (authLoading || loading) return (
    <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="loading-spinner" />
    </div>
  );

  if (!isAdmin || !authority) return null;

  // ─── Compute Stats ───
  const totalReports = reports.length;
  const pending = reports.filter(r => r.status === 'PENDING').length;
  const underReview = reports.filter(r => r.status === 'UNDER_REVIEW').length;
  const actioned = reports.filter(r => r.status === 'ACTION_TAKEN').length;
  const ignored = reports.filter(r => r.status === 'IGNORED' || r.status === 'DISMISSED').length;
  const responseRate = totalReports > 0 ? Math.round((actioned / totalReports) * 100) : 0;

  const criticalBridges = bridges.filter(b => b.status === 'CRITICAL').length;
  const warningBridges = bridges.filter(b => b.status === 'WARNING').length;
  const safeBridges = bridges.filter(b => b.status === 'SAFE').length;

  // Accountability 
  const accountabilityData = { total_actioned: actioned, total_ignored: ignored };
  const accountabilityScore = computeAccountabilityScore(accountabilityData) ?? 0;
  const accountabilityLabel = getAccountabilityLabel(accountabilityScore);

  // Average response time
  const respondedReports = reports.filter(r => r.responded_at && r.created_at);
  const avgResponseDays = respondedReports.length > 0
    ? Math.round(respondedReports.reduce((sum, r) => sum + (new Date(r.responded_at) - new Date(r.created_at)) / 86400000, 0) / respondedReports.length)
    : null;

  const joinDate = authority.created_at
    ? new Date(authority.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'N/A';
  const lastLogin = authority.last_login
    ? new Date(authority.last_login).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : 'Never';

  // Role badge colors
  const roleBadge = {
    SUPER_ADMIN: { bg: 'linear-gradient(135deg, #7c3aed, #a855f7)', label: '👑 Super Admin' },
    DISTRICT_ENGINEER: { bg: 'linear-gradient(135deg, #0891b2, #06b6d4)', label: '🏗️ District Engineer' },
    STATE_AUTHORITY: { bg: 'linear-gradient(135deg, #b45309, #d97706)', label: '🏛️ State Authority' },
  };
  const currentRole = roleBadge[authority.role] || { bg: 'linear-gradient(135deg, #3b82f6, #60a5fa)', label: `🔧 ${authority.role || 'Admin'}` };

  return (
    <div className="page-container" style={{ maxWidth: 1000 }}>
      {/* ─── Profile Header ─── */}
      <div className="glass-panel" style={{ padding: 0, marginBottom: '2rem', overflow: 'hidden' }}>
        {/* Top gradient banner */}
        <div style={{
          height: 120,
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #4c1d95 60%, #581c87 100%)',
          position: 'relative',
        }}>
          {/* Grid pattern overlay */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.1,
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }} />
        </div>

        <div style={{ padding: '0 2.5rem 2rem', marginTop: -50 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.5rem', flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{
              width: 100, height: 100, borderRadius: 16,
              background: currentRole.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.5rem', fontWeight: 900, color: '#fff',
              boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
              border: '4px solid var(--color-bg)', flexShrink: 0,
            }}>
              {authority.name?.charAt(0).toUpperCase() || 'A'}
            </div>

            <div style={{ flex: 1, paddingBottom: '0.5rem' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                {authority.name || 'Admin'}
              </h1>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{
                  padding: '0.3rem 0.9rem', borderRadius: 8, fontSize: '0.8rem', fontWeight: 700,
                  background: currentRole.bg, color: '#fff',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}>
                  {currentRole.label}
                </span>
                <span style={{
                  padding: '0.3rem 0.75rem', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600,
                  background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399',
                }}>
                  ● Active
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignSelf: 'flex-start', marginTop: '3.5rem' }}>
              <button className="btn-primary" style={{ fontSize: '0.85rem' }} onClick={() => navigate('/admin/dashboard')}>
                📊 Dashboard
              </button>
              <button onClick={handleLogout} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
                Logout
              </button>
            </div>
          </div>

          {/* Info strip */}
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '2rem', flexWrap: 'wrap', padding: '1rem 1.25rem', background: 'rgba(0,0,0,0.3)', borderRadius: 10, fontSize: '0.85rem', color: '#94a3b8' }}>
            <span>📅 Joined: <strong style={{ color: '#fff' }}>{joinDate}</strong></span>
            <span>🔑 Last Login: <strong style={{ color: '#fff' }}>{lastLogin}</strong></span>
            <span>📧 {user?.email || 'N/A'}</span>
            {authority.jurisdiction && <span>📍 Jurisdiction: <strong style={{ color: '#fff' }}>{authority.jurisdiction}</strong></span>}
          </div>
        </div>
      </div>

      {/* ─── Accountability Score (Hero Section) ─── */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: accountabilityLabel.color }} />
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 2, marginBottom: '1rem' }}>
          Accountability Rating
        </h2>

        {/* Circular Score Display */}
        <div style={{ position: 'relative', width: 160, height: 160, margin: '0 auto 1rem' }}>
          <svg width="160" height="160" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
            <circle
              cx="80" cy="80" r="70" fill="none"
              stroke={accountabilityLabel.color}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${accountabilityScore * 4.4} 440`}
              transform="rotate(-90 80 80)"
              style={{ transition: 'stroke-dasharray 1.5s ease', filter: `drop-shadow(0 0 8px ${accountabilityLabel.color})` }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 900, color: accountabilityLabel.color }}>{accountabilityScore}</span>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>/100</span>
          </div>
        </div>

        <span style={{
          display: 'inline-block', padding: '0.4rem 1.2rem', borderRadius: 20,
          fontSize: '0.9rem', fontWeight: 700,
          background: `${accountabilityLabel.color}22`,
          border: `1px solid ${accountabilityLabel.color}55`,
          color: accountabilityLabel.color,
        }}>
          {accountabilityLabel.label}
        </span>

        {avgResponseDays !== null && (
          <p className="text-gray" style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
            ⏱️ Average response time: <strong style={{ color: avgResponseDays <= 7 ? '#34d399' : avgResponseDays <= 14 ? '#fbbf24' : '#f87171' }}>{avgResponseDays} days</strong>
          </p>
        )}
      </div>

      {/* ─── Report Management Stats ─── */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <div className="card-dark" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#3b82f6' }} />
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff' }}>{totalReports}</div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Total Reports</div>
        </div>
        <div className="card-dark" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#f59e0b' }} />
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fbbf24' }}>{pending + underReview}</div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Awaiting Action</div>
        </div>
        <div className="card-dark" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#10b981' }} />
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#34d399' }}>{actioned}</div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Resolved</div>
        </div>
        <div className="card-dark" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#ef4444' }} />
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#f87171' }}>{ignored}</div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Ignored</div>
        </div>
      </div>

      {/* ─── Response Rate Bar ─── */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontWeight: 700 }}>📊 Overall Response Rate</span>
          <span style={{ fontWeight: 700, color: responseRate >= 70 ? '#34d399' : responseRate >= 40 ? '#fbbf24' : '#f87171' }}>{responseRate}%</span>
        </div>
        <div className="progress-container">
          <div className="progress-bar" style={{
            width: `${responseRate}%`,
            background: responseRate >= 70
              ? 'linear-gradient(90deg, #059669, #10b981, #34d399)'
              : responseRate >= 40
                ? 'linear-gradient(90deg, #d97706, #f59e0b, #fbbf24)'
                : 'linear-gradient(90deg, #b91c1c, #ef4444, #f87171)',
            borderRadius: 10,
          }} />
        </div>
      </div>

      {/* ─── Jurisdiction Overview ─── */}
      <div style={{ textAlign: 'left' }}>
        <div className="section-title">🌉 Bridge Jurisdiction Overview</div>
        <div className="grid-3" style={{ marginBottom: '2rem' }}>
          <div className="card-red">
            <div style={{ fontSize: '2.5rem', fontWeight: 900 }}>{criticalBridges}</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Critical</div>
          </div>
          <div className="card-orange">
            <div style={{ fontSize: '2.5rem', fontWeight: 900 }}>{warningBridges}</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Warning</div>
          </div>
          <div className="card-dark" style={{ borderLeft: '3px solid #10b981' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#34d399' }}>{safeBridges}</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: '#94a3b8' }}>Safe</div>
          </div>
        </div>

        {/* Top Risk Bridges */}
        <div className="section-title">⚠️ Highest Risk Bridges</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {bridges.slice(0, 5).map((b, i) => {
            const riskColor = b.status === 'CRITICAL' ? '#ef4444' : b.status === 'WARNING' ? '#f97316' : b.status === 'MONITOR' ? '#f59e0b' : '#10b981';
            return (
              <Link key={b.id} to={`/bridge/${b.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="report-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: `${riskColor}22`, border: `1px solid ${riskColor}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1rem', fontWeight: 900, color: riskColor, flexShrink: 0,
                  }}>
                    #{i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong>{b.name}</strong>
                    <p className="text-gray" style={{ fontSize: '0.8rem' }}>{b.district}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 900, color: riskColor }}>{b.risk_score}</span>
                    <p style={{ fontSize: '0.7rem', fontWeight: 600, color: riskColor, textTransform: 'uppercase' }}>{b.status}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
