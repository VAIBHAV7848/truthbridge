import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useBridges } from '../../hooks/useBridges'
import { supabase } from '../../lib/supabase'
import { signOut } from '../../lib/auth'
import { createBridge } from '../../lib/bridges'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useToast } from '../../context/ToastContext'
import { exportToCSV, exportToPDF, getReportStats } from '../../lib/exportReports'
import InspectionScheduler from '../../components/InspectionScheduler'
import { getActiveEngineers } from '../../lib/engineers'
import { createTask } from '../../lib/tasks'

const BridgeSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  district: z.string().min(2, 'District required'),
  state: z.string().min(2).default('Karnataka'),
  year_built: z.coerce.number().min(1800).max(new Date().getFullYear()).optional(),
  seismic_zone: z.enum(['II', 'III', 'IV', 'V', 'VI']).optional(),
  bridge_type: z.string().optional(),
})

function AddBridgeForm({ onSuccess, onCancel }) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(BridgeSchema),
    defaultValues: { state: 'Karnataka', seismic_zone: 'III' }
  })

  const onSubmit = async (data) => {
    try {
      await createBridge({ ...data, status: 'SAFE', risk_score: 0 })
      reset()
      onSuccess()
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="glass-panel" style={{ padding: '2rem', marginBottom: '3rem', textAlign: 'left' }}>
      <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.2rem' }}>➕ Add New Bridge</h3>
      <div className="grid-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#94a3b8' }}>Bridge Name</label>
          <input className="form-input" style={{ margin: 0 }} {...register('name')} />
          {errors.name && <span className="text-red" style={{ fontSize: '0.8rem' }}>{errors.name.message}</span>}
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#94a3b8' }}>Bridge Type</label>
          <input className="form-input" style={{ margin: 0 }} {...register('bridge_type')} placeholder="e.g. Concrete, Steel" />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#94a3b8' }}>Latitude</label>
          <input className="form-input" style={{ margin: 0 }} type="number" step="any" {...register('lat')} />
          {errors.lat && <span className="text-red" style={{ fontSize: '0.8rem' }}>{errors.lat.message}</span>}
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#94a3b8' }}>Longitude</label>
          <input className="form-input" style={{ margin: 0 }} type="number" step="any" {...register('lng')} />
          {errors.lng && <span className="text-red" style={{ fontSize: '0.8rem' }}>{errors.lng.message}</span>}
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#94a3b8' }}>District</label>
          <input className="form-input" style={{ margin: 0 }} {...register('district')} />
          {errors.district && <span className="text-red" style={{ fontSize: '0.8rem' }}>{errors.district.message}</span>}
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#94a3b8' }}>State</label>
          <input className="form-input" style={{ margin: 0 }} {...register('state')} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#94a3b8' }}>Year Built</label>
          <input className="form-input" style={{ margin: 0 }} type="number" {...register('year_built')} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#94a3b8' }}>Seismic Zone</label>
          <select className="form-input" style={{ margin: 0 }} {...register('seismic_zone')}>
            <option value="II">Zone II</option>
            <option value="III">Zone III</option>
            <option value="IV">Zone IV</option>
            <option value="V">Zone V</option>
            <option value="VI">Zone VI</option>
          </select>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
        <button type="submit" className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Bridge'}</button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}

function ReportRow({ report, onUpdate, authority }) {
  const [status, setStatus] = useState(report.status)
  const [notes, setNotes] = useState(report.response_notes || '')
  const [saving, setSaving] = useState(false)
  const [updated, setUpdated] = useState(false)
  const [lightbox, setLightbox] = useState(false)

  // Assign to Engineer state
  const [assignOpen, setAssignOpen] = useState(false)
  const [engineers, setEngineers] = useState([])
  const [assignForm, setAssignForm] = useState({ engineerId: '', priority: 'MEDIUM', dueDate: '', notes: '' })
  const [assigning, setAssigning] = useState(false)
  const [assigned, setAssigned] = useState(false)

  const days = Math.floor((Date.now() - new Date(report.created_at).getTime()) / 86400000)
  const isOverdue = days > 30

  async function handleSave() {
    setSaving(true)
    await onUpdate(report.id, status, notes)
    setSaving(false)
    setUpdated(true)
    setTimeout(() => setUpdated(false), 2000)
  }

  // Fetch engineers when assignment panel opens
  useEffect(() => {
    if (assignOpen && engineers.length === 0) {
      getActiveEngineers().then(setEngineers).catch(console.error)
    }
  }, [assignOpen])

  return (
    <>
      {lightbox && report.photo_url && (
        <div onClick={() => setLightbox(false)} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}>
          <img src={report.photo_url} alt="Full view" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }} />
        </div>
      )}

      <div className="report-card" style={{ marginBottom: '1rem', textAlign: 'left' }}>
        <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {report.photo_url && (
              <img src={report.photo_url} alt="Report" onClick={() => setLightbox(true)} style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover', cursor: 'zoom-in', border: '2px solid var(--color-glass-border)', flexShrink: 0 }} />
            )}
            <div>
              <strong style={{ fontSize: '1.1rem' }}>{String(report.bridgeName)}</strong>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', marginLeft: '0.5rem' }}>{report.damage_type}</span>
              <span className="badge" style={{ background: report.severity === 'DANGEROUS' ? '#ef4444' : '#f97316', marginLeft: '0.5rem' }}>{report.severity}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="text-gray" style={{ fontSize: '0.8rem' }}>{new Date(report.created_at).toLocaleDateString()}</div>
            <div className={isOverdue ? 'text-red' : 'text-gray'} style={{ fontSize: '0.8rem', fontWeight: isOverdue ? 700 : 400 }}>{days} days ago</div>
          </div>
        </div>
        
        {report.description && <p style={{ marginBottom: '1rem', fontStyle: 'italic', color: '#94a3b8' }}>"{report.description}"</p>}
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select className="form-input" style={{ width: '200px', marginTop: 0 }} value={status} onChange={e => setStatus(e.target.value)}>
            <option value="PENDING">PENDING</option>
            <option value="UNDER_REVIEW">UNDER_REVIEW</option>
            <option value="ACTION_TAKEN">ACTION_TAKEN</option>
            <option value="DISMISSED">DISMISSED</option>
          </select>
          <input className="form-input" style={{ flex: 1, minWidth: 200, marginTop: 0 }} placeholder="Action notes..." value={notes} onChange={e => setNotes(e.target.value)} />
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? '...' : 'Update'}</button>
          <button className="btn-secondary" onClick={() => setAssignOpen(!assignOpen)} style={{ background: 'rgba(34,197,94,0.1)', color: '#86efac' }}>
            🔧 Assign to Engineer
          </button>
          {updated && <span className="text-green" style={{ fontWeight: 'bold' }}>✅ Updated</span>}
        </div>

        {/* Assignment Panel */}
        {assignOpen && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8 }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', color: '#86efac' }}>
              🔧 Assign to Engineer
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <select
                className="form-input"
                style={{ width: 200, marginTop: 0 }}
                value={assignForm.engineerId}
                onChange={e => setAssignForm(f => ({ ...f, engineerId: e.target.value }))}
              >
                <option value="">— Select Engineer —</option>
                {engineers.map(eng => (
                  <option key={eng.id} value={eng.id}>
                    {eng.name}{eng.specialization ? ` (${eng.specialization})` : ''}
                  </option>
                ))}
              </select>
              <select
                className="form-input"
                style={{ width: 140, marginTop: 0 }}
                value={assignForm.priority}
                onChange={e => setAssignForm(f => ({ ...f, priority: e.target.value }))}
              >
                <option value="LOW">Low Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="HIGH">High Priority</option>
                <option value="URGENT">URGENT</option>
              </select>
              <input
                type="date"
                className="form-input"
                style={{ width: 160, marginTop: 0 }}
                value={assignForm.dueDate}
                onChange={e => setAssignForm(f => ({ ...f, dueDate: e.target.value }))}
              />
              <input
                className="form-input"
                style={{ flex: 1, minWidth: 180, marginTop: 0 }}
                placeholder="Task notes / instructions..."
                value={assignForm.notes}
                onChange={e => setAssignForm(f => ({ ...f, notes: e.target.value }))}
              />
              <button
                className="btn-primary"
                style={{ background: 'rgba(34,197,94,0.2)', color: '#86efac' }}
                disabled={assigning || !assignForm.engineerId}
                onClick={async () => {
                  setAssigning(true);
                  try {
                    await createTask({
                      bridge_id:   report.bridge_id,
                      bridge_name: report.bridgeName,
                      report_id:   report.id,
                      assigned_by: authority.id,
                      assigned_to: assignForm.engineerId,
                      title:       `Inspect ${report.bridgeName} — ${report.damage_type}`,
                      description: assignForm.notes,
                      priority:    assignForm.priority,
                      due_date:    assignForm.dueDate || null,
                    });
                    setAssigned(true);
                    setAssignOpen(false);
                  } catch (err) {
                    alert(err.message);
                  } finally {
                    setAssigning(false);
                  }
                }}
              >
                {assigning ? 'Assigning...' : 'Assign'}
              </button>
              <button className="btn-secondary" onClick={() => setAssignOpen(false)}>Cancel</button>
            </div>
            {assigned && <div style={{ marginTop: '0.5rem', color: '#86efac', fontSize: '0.85rem' }}>✅ Task assigned to engineer</div>}
          </div>
        )}
      </div>
    </>
  )
}

export default function AdminDashboard() {
  const { authority, loading: authLoading, isAdmin } = useAuth()
  const { bridges, loading: bridgesLoading, refetch: refetchBridges } = useBridges()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [pendingReports, setPendingReports] = useState([])
  const [reportsLoading, setReportsLoading] = useState(true)
  const [addBridgeOpen, setAddBridgeOpen] = useState(false)

  // Export handlers
  const handleExportCSV = () => {
    const allReports = pendingReports; // In real app, fetch all reports
    exportToCSV(allReports, bridges, 'truthbridge-reports');
    showToast('CSV export downloaded', 'success');
  };

  const handleExportPDF = () => {
    const allReports = pendingReports;
    const stats = getReportStats(allReports);
    exportToPDF(allReports, bridges, stats, 'truthbridge-reports');
    showToast('PDF export opened in new tab', 'success');
  };

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/admin/login')
    }
  }, [authLoading, isAdmin, navigate])

  useEffect(() => {
    if (isAdmin) {
      const fetchReports = async () => {
        try {
          const { data, error } = await supabase
            .from('reports')
            .select('*')
            .in('status', ['PENDING', 'UNDER_REVIEW', 'IGNORED'])
            .order('created_at', { ascending: false })
          if (error) throw error

          const bridgeIds = data.map(r => r.bridge_id)
          const { data: bridgeData } = await supabase.from('bridges').select('id, name, state').in('id', bridgeIds)
          const bridgeMap = Object.fromEntries((bridgeData || []).map(b => [b.id, b]))
          
          setPendingReports(data.map(r => ({ ...r, bridgeName: bridgeMap[r.bridge_id]?.name || 'Unknown Bridge' })))
        } catch (err) {
          console.error(err)
        } finally {
          setReportsLoading(false)
        }
      }
      fetchReports()
    }
  }, [isAdmin])

  async function updateReport(reportId, newStatus, notes) {
    try {
      const { error } = await supabase.from('reports').update({
        status: newStatus,
        response_notes: notes || null,
        responded_at: new Date().toISOString()
      }).eq('id', reportId)
      if (error) throw error
      
      if (newStatus === 'ACTION_TAKEN' || newStatus === 'DISMISSED') {
         setPendingReports(prev => prev.filter(r => r.id !== reportId))
      }
    } catch (err) {
      alert(err.message)
    }
  }

  async function handleLogout() {
    await signOut()
    navigate('/admin/login')
  }

  if (authLoading || bridgesLoading || reportsLoading) {
    return <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}><div className="loading-spinner"></div></div>
  }
  if (!isAdmin) return null

  return (
    <div className="page-container">
      <div className="flex-between" style={{ marginBottom: '2rem', borderBottom: '1px solid var(--color-glass-border)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>🌉 Authority Dashboard</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span className="text-gray">{String(authority?.name || 'Admin')} · {String(authority?.role || '')}</span>
          <button className="btn-primary" onClick={() => navigate('/admin/analytics')} style={{ background: 'rgba(255,255,255,0.1)' }}>📊 Analytics</button>
          <button className="btn-primary" onClick={handleExportCSV} style={{ background: 'rgba(16,185,129,0.2)', color: '#34d399' }}>📥 CSV</button>
          <button className="btn-primary" onClick={handleExportPDF} style={{ background: 'rgba(59,130,246,0.2)', color: '#60a5fa' }}>📄 PDF</button>
          <button className="btn-primary" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: '3rem' }}>
        <div className="card-dark">
          <div className="stat-number">{bridges.length}</div>
          <div className="stat-title text-gray">Total Bridges</div>
        </div>
        <div className="card-red">
          <div className="stat-number text-red">{bridges.filter(b => b.status === 'CRITICAL').length}</div>
          <div className="stat-title text-red">Critical</div>
        </div>
        <div className="card-orange">
          <div className="stat-number text-orange">{bridges.filter(b => b.status === 'WARNING').length}</div>
          <div className="stat-title text-orange">Warning</div>
        </div>
        <div className="card-dark">
          <div className="stat-number text-yellow">{pendingReports.length}</div>
          <div className="stat-title text-yellow">Pending Reports</div>
        </div>
      </div>

      {addBridgeOpen ? (
        <AddBridgeForm onSuccess={() => { setAddBridgeOpen(false); refetchBridges() }} onCancel={() => setAddBridgeOpen(false)} />
      ) : (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
          <button className="btn-secondary" onClick={() => setAddBridgeOpen(true)}>➕ Add New Bridge</button>
        </div>
      )}

      <div style={{ marginBottom: '3rem', textAlign: 'left' }}>
        <div className="section-title">Reports Requiring Action</div>
        {pendingReports.length > 0 ? pendingReports.map(r => (
          <ReportRow key={r.id} report={r} onUpdate={updateReport} authority={authority} />
        )) : <p className="text-gray">No reports require action at this time.</p>}
      </div>

      <div style={{ marginBottom: '3rem' }}>
        <InspectionScheduler bridges={bridges} />
      </div>

      <div style={{ textAlign: 'left' }}>
        <div className="section-title">All Bridges — Risk Ranked</div>
        <div className="grid-3">
          {bridges.map(b => (
            <Link key={b.id} to={`/bridge/${b.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card-dark" style={{ borderLeft: `4px solid var(--color-${b.status.toLowerCase()})`, transition: '0.2s', cursor: 'pointer' }}>
                <div className="flex-between">
                  <span className={`badge status-${b.status.toLowerCase()}`}>{b.status}</span>
                  <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>{b.risk_score}</span>
                </div>
                <h3 style={{ marginTop: '0.5rem', marginBottom: '0.25rem', fontSize: '1.1rem' }}>{b.name}</h3>
                <p className="text-gray" style={{ fontSize: '0.9rem' }}>{b.district}, {b.state}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
