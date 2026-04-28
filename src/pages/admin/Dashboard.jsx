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

function ReportRow({ report, onUpdate }) {
  const [status, setStatus] = useState(report.status)
  const [notes, setNotes] = useState(report.response_notes || '')
  const [saving, setSaving] = useState(false)
  const [updated, setUpdated] = useState(false)
  const [lightbox, setLightbox] = useState(false)

  const days = Math.floor((Date.now() - new Date(report.created_at).getTime()) / 86400000)
  const isOverdue = days > 30

  async function handleSave() {
    setSaving(true)
    await onUpdate(report.id, status, notes)
    setSaving(false)
    setUpdated(true)
    setTimeout(() => setUpdated(false), 2000)
  }

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
          {updated && <span className="text-green" style={{ fontWeight: 'bold' }}>✅ Updated</span>}
        </div>
      </div>
    </>
  )
}

export default function AdminDashboard() {
  const { authority, loading: authLoading, isAdmin } = useAuth()
  const { bridges, loading: bridgesLoading, refetch: refetchBridges } = useBridges()
  const navigate = useNavigate()
  const [pendingReports, setPendingReports] = useState([])
  const [reportsLoading, setReportsLoading] = useState(true)
  const [addBridgeOpen, setAddBridgeOpen] = useState(false)

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
          <ReportRow key={r.id} report={r} onUpdate={updateReport} />
        )) : <p className="text-gray">No reports require action at this time.</p>}
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
