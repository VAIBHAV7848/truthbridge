import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useBridges } from '../../hooks/useBridges'
import { supabase } from '../../lib/supabase'
import { signOut } from '../../lib/auth'

function ReportRow({ report, onUpdate }) {
  const [status, setStatus] = useState(report.status)
  const [notes, setNotes] = useState(report.response_notes || '')
  const [saving, setSaving] = useState(false)
  const [updated, setUpdated] = useState(false)

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
    <div className="report-card" style={{marginBottom:'1rem',textAlign:'left'}}>
      <div className="flex-between" style={{marginBottom:'0.5rem'}}>
        <div>
          <strong style={{fontSize:'1.1rem'}}>{report.bridges?.name}</strong>
          <span className="badge" style={{background:'rgba(255,255,255,0.1)',marginLeft:'0.5rem'}}>{report.damage_type}</span>
          <span className="badge" style={{background:report.severity==='DANGEROUS'?'#ef4444':'#f97316',marginLeft:'0.5rem'}}>{report.severity}</span>
        </div>
        <div style={{textAlign:'right'}}>
          <div className="text-gray" style={{fontSize:'0.8rem'}}>{new Date(report.created_at).toLocaleDateString()}</div>
          <div className={isOverdue ? 'text-red' : 'text-gray'} style={{fontSize:'0.8rem',fontWeight:isOverdue?700:400}}>{days} days ago</div>
        </div>
      </div>
      
      {report.description && <p style={{marginBottom:'1rem',fontStyle:'italic',color:'#94a3b8'}}>"{report.description}"</p>}
      
      <div style={{display:'flex',gap:'1rem',alignItems:'center'}}>
        <select className="form-input" style={{width:'200px',marginTop:0}} value={status} onChange={e=>setStatus(e.target.value)}>
          <option value="PENDING">PENDING</option>
          <option value="UNDER_REVIEW">UNDER_REVIEW</option>
          <option value="ACTION_TAKEN">ACTION_TAKEN</option>
          <option value="DISMISSED">DISMISSED</option>
        </select>
        <input className="form-input" style={{flex:1,marginTop:0}} placeholder="Action notes..." value={notes} onChange={e=>setNotes(e.target.value)} />
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? '...' : 'Update'}
        </button>
        {updated && <span className="text-green" style={{fontWeight:'bold'}}>✅ Updated</span>}
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const { authority, loading: authLoading, isAdmin } = useAuth()
  const { bridges, loading: bridgesLoading } = useBridges()
  const navigate = useNavigate()
  const [pendingReports, setPendingReports] = useState([])
  const [reportsLoading, setReportsLoading] = useState(true)

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
            .select('*, bridges(name, state)')
            .in('status', ['PENDING', 'UNDER_REVIEW', 'IGNORED'])
            .order('created_at', { ascending: false })
          if (error) throw error
          setPendingReports(data || [])
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
      
      // refetch to update list if changed to ACTION_TAKEN or DISMISSED
      if (newStatus === 'ACTION_TAKEN' || newStatus === 'DISMISSED') {
         setPendingReports(prev => prev.filter(r => r.id !== reportId))
      }
    } catch (err) {
      console.error(err)
      alert(err.message)
    }
  }

  async function handleLogout() {
    await signOut()
    navigate('/admin/login')
  }

  if (authLoading || bridgesLoading || reportsLoading) {
    return <div className="page-container"><div className="loader"><div className="spinner"></div></div></div>
  }
  if (!isAdmin) return null

  return (
    <div className="page-container">
      <div className="flex-between" style={{marginBottom:'2rem',borderBottom:'1px solid var(--color-glass-border)',paddingBottom:'1rem'}}>
        <h1 style={{fontSize:'2rem',fontWeight:800}}>🌉 Authority Dashboard</h1>
        <div style={{display:'flex',alignItems:'center',gap:'1rem'}}>
          <span className="text-gray">{authority?.name} · {authority?.role}</span>
          <button className="btn-primary" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="grid-4" style={{marginBottom:'3rem'}}>
        <div className="card-dark">
          <div className="stat-number">{bridges.length}</div>
          <div className="stat-title text-gray">Total Bridges</div>
        </div>
        <div className="card-red">
          <div className="stat-number text-red">{bridges.filter(b=>b.status==='CRITICAL').length}</div>
          <div className="stat-title text-red">Critical</div>
        </div>
        <div className="card-orange">
          <div className="stat-number text-orange">{bridges.filter(b=>b.status==='WARNING').length}</div>
          <div className="stat-title text-orange">Warning</div>
        </div>
        <div className="card-dark">
          <div className="stat-number text-yellow">{pendingReports.length}</div>
          <div className="stat-title text-yellow">Pending Reports</div>
        </div>
      </div>

      <div style={{marginBottom:'3rem',textAlign:'left'}}>
        <div className="section-title">Reports Requiring Action</div>
        {pendingReports.length > 0 ? pendingReports.map(r => (
          <ReportRow key={r.id} report={r} onUpdate={updateReport} />
        )) : <p className="text-gray">No reports require action at this time.</p>}
      </div>

      <div style={{textAlign:'left'}}>
        <div className="section-title">All Bridges — Risk Ranked</div>
        <div className="grid-3">
          {bridges.map(b => (
            <Link key={b.id} to={`/bridge/${b.id}`} style={{textDecoration:'none',color:'inherit'}}>
              <div className="card-dark" style={{borderLeft:`4px solid var(--color-${b.status.toLowerCase()})`,transition:'0.2s',cursor:'pointer'}}>
                <div className="flex-between">
                  <span className={`badge status-${b.status.toLowerCase()}`}>{b.status}</span>
                  <span style={{fontWeight:800,fontSize:'1.2rem'}}>{b.risk_score}</span>
                </div>
                <h3 style={{marginTop:'0.5rem',marginBottom:'0.25rem',fontSize:'1.1rem'}}>{b.name}</h3>
                <p className="text-gray" style={{fontSize:'0.9rem'}}>{b.district}, {b.state}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
