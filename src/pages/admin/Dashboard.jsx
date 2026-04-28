import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useBridges } from '../../hooks/useBridges';
import { signOut } from '../../lib/auth';
import { supabase } from '../../lib/supabase';

export default function AdminDashboard() {
  const { authority, loading: authLoading, isAdmin } = useAuth();
  const { bridges, loading: bridgesLoading } = useBridges();
  const navigate = useNavigate();

  const [pendingReports, setPendingReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/admin/login');
    }
  }, [authLoading, isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchPendingReports();
    }
  }, [isAdmin]);

  async function fetchPendingReports() {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*, bridges(name, state)')
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setPendingReports(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setReportsLoading(false);
    }
  }

  async function handleUpdateReport(reportId, status, notes) {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status, response_notes: notes, responded_at: new Date().toISOString() })
        .eq('id', reportId);
      
      if (error) throw error;
      
      setToast('Report updated successfully!');
      setTimeout(() => setToast(null), 3000);
      
      // Remove from pending list
      setPendingReports(prev => prev.filter(r => r.id !== reportId));
    } catch (err) {
      alert(`Error updating report: ${err.message}`);
    }
  }

  if (authLoading || bridgesLoading || reportsLoading) {
    return (
      <div className="page-container">
        <div className="skeleton" style={{ height: '200px' }}></div>
      </div>
    );
  }
  if (!isAdmin) return null;

  const critical = bridges.filter(b => b.status === 'CRITICAL').length;
  const warning = bridges.filter(b => b.status === 'WARNING').length;

  async function handleLogout() {
    await signOut();
    navigate('/admin/login');
  }

  return (
    <div className="page-container">
      {toast && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', background: 'var(--color-safe)', color: 'white', padding: '1rem', borderRadius: '8px', zIndex: 9999, boxShadow: '0 4px 15px rgba(16,185,129,0.5)' }}>
          ✅ {toast}
        </div>
      )}

      <header className="flex-between" style={{ marginBottom: '2rem', borderBottom: '1px solid var(--color-glass-border)', paddingBottom: '1rem' }}>
        <h1>🌉 Authority Control Center</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span className="text-gray">{authority.name} | {authority.role}</span>
          <button className="filter-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <div className="grid-4" style={{ marginBottom: '3rem' }}>
        <div className="card-dark">
          <div className="stat-title text-gray">Total Bridges</div>
          <div className="stat-number">{bridges.length}</div>
        </div>
        <div className="card-dark" style={{ border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <div className="stat-title text-red">Critical Risk</div>
          <div className="stat-number text-red">{critical}</div>
        </div>
        <div className="card-dark" style={{ border: '1px solid rgba(249, 115, 22, 0.3)' }}>
          <div className="stat-title text-orange">Warning Risk</div>
          <div className="stat-number text-orange">{warning}</div>
        </div>
        <div className="card-dark" style={{ border: '1px solid rgba(245, 158, 11, 0.3)' }}>
          <div className="stat-title text-yellow">Pending Reports</div>
          <div className="stat-number text-yellow">{pendingReports.length}</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card-dark" style={{ textAlign: 'left' }}>
          <h2 className="section-title text-yellow">⚠️ Reports Requiring Action</h2>
          
          {pendingReports.length === 0 ? (
            <p className="text-gray">No pending reports.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {pendingReports.map(report => {
                const days = Math.floor((Date.now() - new Date(report.created_at)) / 86400000);
                const isOverdue = days > 30;

                return (
                  <ReportActionCard 
                    key={report.id} 
                    report={report} 
                    days={days} 
                    isOverdue={isOverdue}
                    onUpdate={handleUpdateReport} 
                  />
                );
              })}
            </div>
          )}
        </div>

        <div className="card-dark" style={{ textAlign: 'left' }}>
          <h2 className="section-title">Bridges — Risk Ranked</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '600px', overflowY: 'auto' }}>
            {bridges.map(b => (
              <div key={b.id} className="flex-between" style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--color-glass-border)' }}>
                <div>
                  <strong>{b.name}</strong>
                  <div className="text-gray" style={{ fontSize: '0.8rem' }}>{b.district}, {b.state}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span className={`badge`} style={{ background: `var(--color-${b.status.toLowerCase()})` }}>{b.status}</span>
                  <span style={{ fontWeight: '900', fontSize: '1.2rem' }}>{b.risk_score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-component for individual report action
function ReportActionCard({ report, days, isOverdue, onUpdate }) {
  const [status, setStatus] = useState('PENDING');
  const [notes, setNotes] = useState('');

  return (
    <div className="report-card" style={{ border: isOverdue ? '1px solid var(--color-critical)' : '' }}>
      <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
        <strong style={{ fontSize: '1.1rem' }}>{report.bridges?.name}</strong>
        <span className={isOverdue ? 'text-red' : 'text-gray'} style={{ fontWeight: isOverdue ? 'bold' : 'normal' }}>
          Filed {days} days ago
        </span>
      </div>
      
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <span className="badge" style={{ background: 'rgba(255,255,255,0.1)' }}>{report.damage_type}</span>
        <span className="badge" style={{ background: report.severity === 'DANGEROUS' ? 'var(--color-critical)' : 'var(--color-warning)' }}>{report.severity}</span>
      </div>
      
      <p style={{ marginBottom: '1rem', fontStyle: 'italic', color: 'var(--color-text-muted)' }}>"{report.description}"</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <select className="form-input" value={status} onChange={e => setStatus(e.target.value)} style={{ padding: '0.5rem' }}>
          <option value="PENDING">Status: PENDING</option>
          <option value="UNDER_REVIEW">UNDER REVIEW</option>
          <option value="ACTION_TAKEN">ACTION TAKEN</option>
          <option value="DISMISSED">DISMISSED</option>
        </select>
        
        <input 
          type="text" 
          className="form-input" 
          placeholder="Authority response notes..." 
          value={notes}
          onChange={e => setNotes(e.target.value)}
          style={{ padding: '0.5rem' }}
        />
        
        <button 
          className="btn-primary" 
          onClick={() => onUpdate(report.id, status, notes)}
          style={{ marginTop: '0.5rem', width: '100%' }}
        >
          Update Report
        </button>
      </div>
    </div>
  );
}
