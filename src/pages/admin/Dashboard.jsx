/**
 * TruthBridge — Admin Dashboard Page
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useBridges } from '../../hooks/useBridges';
import { signOut } from '../../lib/auth';

export default function AdminDashboard() {
  const { authority, loading: authLoading, isAdmin } = useAuth();
  const { bridges, loading: bridgesLoading } = useBridges();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/admin/login');
    }
  }, [authLoading, isAdmin, navigate]);

  if (authLoading || bridgesLoading) return <p>Loading dashboard...</p>;
  if (!isAdmin) return null;

  const critical = bridges.filter(b => b.status === 'CRITICAL').length;
  const warning = bridges.filter(b => b.status === 'WARNING').length;

  async function handleLogout() {
    await signOut();
    navigate('/admin/login');
  }

  return (
    <div id="admin-dashboard">
      <header style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h1>🌉 TruthBridge Admin</h1>
        <div>
          <span>{authority.name} | {authority.role}</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '1rem', margin: '1rem 0' }}>
        <div><h2>{bridges.length}</h2><p>Total Bridges</p></div>
        <div><h2 style={{ color: '#ff4444' }}>{critical}</h2><p>Critical</p></div>
        <div><h2 style={{ color: '#ff8800' }}>{warning}</h2><p>Warning</p></div>
      </div>

      <h2>Bridges — Risk Ranked</h2>
      {bridges.map(b => (
        <div key={b.id} style={{ padding: '8px', borderBottom: '1px solid #333' }}>
          <strong>{b.name}</strong> — {b.risk_score}/100 — {b.status}
        </div>
      ))}
    </div>
  );
}
