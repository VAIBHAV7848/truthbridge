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
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 12,
            background: currentRole.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', fontWeight: 800, color: '#fff',
            flexShrink: 0,
          }}>
            {authority.name?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.25rem', color: '#fff' }}>
              {String(authority.name || 'Admin')}
            </h1>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ padding: '0.2rem 0.6rem', borderRadius: 6, fontSize: '0.7rem', fontWeight: 700, background: currentRole.bg, color: '#fff' }}>
                {String(currentRole.label)}
              </span>
              <span style={{ padding: '0.2rem 0.6rem', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#34d399' }}>
                Active
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }} onClick={() => navigate('/admin/dashboard')}>
              Dashboard
            </button>
            <button onClick={handleLogout} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
              Logout
            </button>
          </div>
        </div>
        <div style={{ marginTop: '1.25rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center', padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.2)', borderRadius: 8, fontSize: '0.8rem', color: '#94a3b8' }}>
          <span>Joined <strong style={{ color: '#e2e8f0' }}>{String(joinDate)}</strong></span>
          <span>Last login <strong style={{ color: '#e2e8f0' }}>{String(lastLogin)}</strong></span>
          <span>{String(user?.email || 'N/A')}</span>
          {authority.jurisdiction && (
            <span>Jurisdiction <strong style={{ color: '#e2e8f0' }}>{String(authority.jurisdiction)}</strong></span>
          )}
        </div>
      </div>

      {/* ─── Accountability Score ─── */}
      <div className="glass-panel" style={{ padding: '1.5rem 2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: accountabilityLabel.color, lineHeight: 1 }}>{String(accountabilityScore)}</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500 }}>/ 100</div>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Accountability Rating</span>
              <span style={{ padding: '0.15rem 0.6rem', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, background: `${accountabilityLabel.color}18`, border: `1px solid ${accountabilityLabel.color}40`, color: accountabilityLabel.color }}>
                {String(accountabilityLabel.label)}
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
              Based on your response rate to citizen reports.
              {avgResponseDays !== null && (
                <> Average response: <strong style={{ color: avgResponseDays <= 7 ? '#34d399' : avgResponseDays <= 14 ? '#fbbf24' : '#f87171' }}>{String(avgResponseDays)} days</strong>.</>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* ─── Report Stats ─── */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <div className="card-dark">
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>{String(totalReports)}</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Total Reports</div>
        </div>
        <div className="card-dark">
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fbbf24' }}>{String(pending + underReview)}</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Awaiting Action</div>
        </div>
        <div className="card-dark">
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#34d399' }}>{String(actioned)}</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Resolved</div>
        </div>
        <div className="card-dark">
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f87171' }}>{String(ignored)}</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Ignored</div>
        </div>
      </div>

      {/* ─── Response Rate ─── */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#cbd5e1' }}>Overall Response Rate</span>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: responseRate >= 70 ? '#34d399' : responseRate >= 40 ? '#fbbf24' : '#f87171' }}>{String(responseRate)}%</span>
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
      <div>
        <div className="section-title">Bridge Jurisdiction Overview</div>
        <div className="grid-3" style={{ marginBottom: '2rem' }}>
          <div className="card-dark">
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ef4444' }}>{String(criticalBridges)}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Critical</div>
          </div>
          <div className="card-dark">
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f97316' }}>{String(warningBridges)}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Warning</div>
          </div>
          <div className="card-dark">
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#34d399' }}>{String(safeBridges)}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Safe</div>
          </div>
        </div>

        {/* Top Risk Bridges */}
        <div className="section-title">Highest Risk Bridges</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {bridges.slice(0, 5).map((b, i) => {
            const riskColor = b.status === 'CRITICAL' ? '#ef4444' : b.status === 'WARNING' ? '#f97316' : b.status === 'MONITOR' ? '#f59e0b' : '#10b981';
            return (
              <Link key={b.id} to={`/bridge/${b.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="report-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: `${riskColor}18`, border: `1px solid ${riskColor}35`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.85rem', fontWeight: 700, color: riskColor, flexShrink: 0,
                  }}>
                    #{String(i + 1)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(b.name || 'Unknown')}</div>
                    <div className="text-gray" style={{ fontSize: '0.8rem' }}>{String(b.district || '')}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: riskColor }}>{String(b.risk_score)}</div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 600, color: riskColor, textTransform: 'uppercase', letterSpacing: 0.5 }}>{String(b.status)}</div>
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
