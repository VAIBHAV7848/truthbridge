import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { signOut } from '../../lib/auth';
import { getTasksForEngineer, updateTaskStatus } from '../../lib/tasks';
import { useToast } from '../../context/ToastContext';

// TaskCard sub-component
function TaskCard({ task, onStatusChange }) {
  const [status, setStatus] = useState(task.status);
  const [notes, setNotes] = useState(task.completion_notes || '');
  const [saving, setSaving] = useState(false);

  const priorityColors = {
    LOW: '#94a3b8',
    MEDIUM: '#f97316',
    HIGH: '#ef4444',
    URGENT: '#dc2626',
  };

  const statusColors = {
    OPEN: '#3b82f6',
    IN_PROGRESS: '#f97316',
    COMPLETED: '#22c55e',
    CLOSED: '#64748b',
  };

  async function handleSave() {
    setSaving(true);
    try {
      await updateTaskStatus(task.id, status, notes);
      onStatusChange?.();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && status !== 'COMPLETED';

  return (
    <div className="report-card" style={{ marginBottom: '1rem', textAlign: 'left' }}>
      <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
        <div>
          <strong style={{ fontSize: '1.1rem' }}>{task.title}</strong>
          <span className="badge" style={{
            background: priorityColors[task.priority] + '20',
            color: priorityColors[task.priority],
            marginLeft: '0.5rem',
            border: `1px solid ${priorityColors[task.priority]}40`
          }}>
            {task.priority}
          </span>
          <span className="badge" style={{
            background: statusColors[status] + '20',
            color: statusColors[status],
            marginLeft: '0.5rem',
            border: `1px solid ${statusColors[status]}40`
          }}>
            {status}
          </span>
        </div>
        <div style={{ textAlign: 'right' }}>
          {task.due_date && (
            <div className={isOverdue ? 'text-red' : 'text-gray'} style={{ fontSize: '0.8rem', fontWeight: isOverdue ? 700 : 400 }}>
              Due: {new Date(task.due_date).toLocaleDateString()}
              {isOverdue && ' ⚠️ OVERDUE'}
            </div>
          )}
          <div className="text-gray" style={{ fontSize: '0.8rem' }}>
            Assigned: {new Date(task.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>

      {task.description && (
        <p style={{ marginBottom: '1rem', color: '#94a3b8', fontSize: '0.95rem' }}>
          {task.description}
        </p>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <span className="text-gray" style={{ fontSize: '0.85rem' }}>
          🔗 <Link to={`/bridge/${task.bridge_id}`} style={{ color: 'var(--color-accent)' }}>
            {task.bridge_name || 'View Bridge'}
          </Link>
        </span>
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <select
          className="form-input"
          style={{ width: '160px', marginTop: 0 }}
          value={status}
          onChange={e => setStatus(e.target.value)}
        >
          <option value="OPEN">OPEN</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="CLOSED">CLOSED</option>
        </select>
        <input
          className="form-input"
          style={{ flex: 1, minWidth: 200, marginTop: 0 }}
          placeholder="Completion notes..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
        <button
          className="btn-primary"
          onClick={handleSave}
          disabled={saving || (status === task.status && notes === (task.completion_notes || ''))}
        >
          {saving ? '...' : 'Update'}
        </button>
      </div>
    </div>
  );
}

export default function EngineerDashboard() {
  const { engineer, loading: authLoading, isEngineer } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  // Auth guard: if not engineer, redirect to engineer login
  useEffect(() => {
    if (!authLoading && !isEngineer) {
      navigate('/engineer/login');
    }
  }, [authLoading, isEngineer, navigate]);

  // Fetch tasks
  useEffect(() => {
    if (engineer?.id) {
      fetchTasks();
    }
  }, [engineer]);

  async function fetchTasks() {
    setTasksLoading(true);
    try {
      const data = await getTasksForEngineer(engineer.id);
      setTasks(data);
    } catch (err) {
      showToast('Failed to load tasks', 'error');
      console.error(err);
    } finally {
      setTasksLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await signOut();
      showToast('Signed out successfully', 'success');
      navigate('/');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  if (authLoading || tasksLoading) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  // Stats
  const stats = {
    total: tasks.length,
    open: tasks.filter(t => t.status === 'OPEN').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    completed: tasks.filter(t => t.status === 'COMPLETED').length,
    overdue: tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'COMPLETED').length,
  };

  // Filter tasks
  const filteredTasks = filter === 'ALL' ? tasks : tasks.filter(t => t.status === filter);

  return (
    <div className="page-container" style={{ textAlign: 'left' }}>
      {/* Header */}
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>🔧 Engineer Dashboard</h1>
          <p className="text-gray">Welcome, {engineer?.name || 'Engineer'}</p>
          {engineer?.specialization && (
            <span className="badge" style={{ marginTop: '0.5rem' }}>
              {engineer.specialization}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={fetchTasks} title="Refresh tasks">
            🔄 Refresh
          </button>
          <button className="btn-danger" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="stat-card" style={{ background: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.3)' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#60a5fa' }}>{stats.total}</div>
          <div className="text-gray" style={{ fontSize: '0.85rem' }}>Total Tasks</div>
        </div>
        <div className="stat-card" style={{ background: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.3)' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#3b82f6' }}>{stats.open}</div>
          <div className="text-gray" style={{ fontSize: '0.85rem' }}>Open</div>
        </div>
        <div className="stat-card" style={{ background: 'rgba(249,115,22,0.1)', borderColor: 'rgba(249,115,22,0.3)' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f97316' }}>{stats.inProgress}</div>
          <div className="text-gray" style={{ fontSize: '0.85rem' }}>In Progress</div>
        </div>
        <div className="stat-card" style={{ background: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#22c55e' }}>{stats.completed}</div>
          <div className="text-gray" style={{ fontSize: '0.85rem' }}>Completed</div>
        </div>
        {stats.overdue > 0 && (
          <div className="stat-card" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ef4444' }}>{stats.overdue}</div>
            <div className="text-gray" style={{ fontSize: '0.85rem' }}>Overdue</div>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {['ALL', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CLOSED'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={filter === f ? 'btn-primary' : 'btn-secondary'}
            style={{
              padding: '0.4rem 0.8rem',
              fontSize: '0.85rem',
              opacity: filter === f ? 1 : 0.7
            }}
          >
            {f === 'ALL' ? 'All Tasks' : f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      <div className="section-title" style={{ marginBottom: '1rem' }}>
        My Assigned Tasks ({filteredTasks.length})
      </div>

      {filteredTasks.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
          <p className="text-gray">
            {filter === 'ALL'
              ? 'No tasks assigned to you yet.'
              : `No ${filter.replace('_', ' ').toLowerCase()} tasks.`}
          </p>
        </div>
      ) : (
        filteredTasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onStatusChange={fetchTasks}
          />
        ))
      )}
    </div>
  );
}
