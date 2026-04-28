import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useBridges } from '../../hooks/useBridges'
import { supabase } from '../../lib/supabase'
import { BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const COLORS = { CRITICAL: '#ef4444', WARNING: '#f97316', MONITOR: '#f59e0b', SAFE: '#10b981' }

export default function Analytics() {
  const { loading: authLoading, isAdmin } = useAuth()
  const { bridges, loading: bridgesLoading } = useBridges()
  const navigate = useNavigate()
  const [reports, setReports] = useState([])
  const [reportsLoading, setReportsLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !isAdmin) navigate('/admin/login')
  }, [authLoading, isAdmin, navigate])

  useEffect(() => {
    if (isAdmin) {
      async function fetchReports() {
        try {
          const { data, error } = await supabase
            .from('reports')
            .select('*')
            .order('created_at', { ascending: false })
          if (error) throw error
          setReports(data || [])
        } catch (err) {
          console.error(err)
        } finally {
          setReportsLoading(false)
        }
      }
      fetchReports()
    }
  }, [isAdmin])

  if (authLoading || bridgesLoading || reportsLoading) {
    return <div className="page-container"><div className="loader"><div className="spinner"></div></div></div>
  }
  if (!isAdmin) return null

  // Stat calculations
  const totalBridges = bridges.length
  const totalReports = reports.length
  const criticalCount = bridges.filter(b => b.status === 'CRITICAL').length
  const actionedReports = reports.filter(r => r.status === 'ACTION_TAKEN')
  const avgResponseDays = actionedReports.length > 0
    ? Math.round(actionedReports.reduce((sum, r) => {
        const filed = new Date(r.created_at)
        const responded = new Date(r.responded_at || r.created_at)
        return sum + Math.max(0, Math.floor((responded - filed) / 86400000))
      }, 0) / actionedReports.length)
    : 0

  // Chart 1: Reports per district
  const districtCounts = {}
  reports.forEach(r => {
    const bridge = bridges.find(b => b.id === r.bridge_id)
    const district = bridge?.district || 'Unknown'
    districtCounts[district] = (districtCounts[district] || 0) + 1
  })
  const districtData = Object.entries(districtCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  // Chart 2: Risk distribution pie
  const riskDistribution = Object.entries(COLORS).map(([status, color]) => ({
    name: status,
    value: bridges.filter(b => b.status === status).length,
    color
  }))

  // Chart 3: Reports over time (last 6 months)
  const monthlyData = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const monthName = d.toLocaleString('default', { month: 'short', year: '2-digit' })
    const count = reports.filter(r => {
      const rd = new Date(r.created_at)
      return `${rd.getFullYear()}-${String(rd.getMonth() + 1).padStart(2, '0')}` === monthKey
    }).length
    monthlyData.push({ name: monthName, reports: count })
  }

  const tooltipStyle = {
    contentStyle: { background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' },
    labelStyle: { color: '#94a3b8' }
  }

  return (
    <div className="page-container">
      <div className="flex-between" style={{ marginBottom: '2rem', borderBottom: '1px solid var(--color-glass-border)', paddingBottom: '1rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>📊 Analytics</h1>
        <button className="btn-primary" onClick={() => navigate('/admin/dashboard')}>← Back to Dashboard</button>
      </div>

      {/* Row 1: Stat Cards */}
      <div className="grid-4" style={{ marginBottom: '3rem' }}>
        <div className="card-dark">
          <div className="stat-number" style={{ fontSize: '3.5rem' }}>{totalBridges}</div>
          <div className="stat-title text-gray">Total Bridges</div>
        </div>
        <div className="card-dark">
          <div className="stat-number text-orange" style={{ fontSize: '3.5rem' }}>{totalReports}</div>
          <div className="stat-title text-orange">Total Reports</div>
        </div>
        <div className="card-red">
          <div className="stat-number text-red" style={{ fontSize: '3.5rem' }}>{criticalCount}</div>
          <div className="stat-title text-red">Critical Bridges</div>
        </div>
        <div className="card-dark">
          <div className="stat-number text-green" style={{ fontSize: '3.5rem' }}>{avgResponseDays}d</div>
          <div className="stat-title text-green">Avg Response Time</div>
        </div>
      </div>

      {/* Row 2: Bar + Pie */}
      <div className="grid-2" style={{ marginBottom: '3rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 className="section-title" style={{ fontSize: '1.1rem' }}>Reports by District</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={districtData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="count" fill="#ef4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 className="section-title" style={{ fontSize: '1.1rem' }}>Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={riskDistribution}
                cx="50%" cy="50%"
                innerRadius={60} outerRadius={100}
                paddingAngle={4}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {riskDistribution.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} />
              <Legend
                wrapperStyle={{ color: '#94a3b8', fontSize: '0.85rem' }}
                formatter={(value) => <span style={{ color: '#94a3b8' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3: Area Chart */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 className="section-title" style={{ fontSize: '1.1rem' }}>Reports Over Time (Last 6 Months)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={monthlyData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="gradientRed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
            <Tooltip {...tooltipStyle} />
            <Area type="monotone" dataKey="reports" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#gradientRed)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
