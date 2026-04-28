/**
 * TruthBridge — Inspection Scheduler Component
 * 
 * Calendar-based inspection scheduling for PWD authorities.
 * Shows upcoming inspections and allows scheduling new ones.
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';
import { SkeletonCard } from './Skeleton';

const INSPECTION_TYPES = [
  { value: 'ROUTINE', label: 'Routine Inspection', color: '#3b82f6' },
  { value: 'EMERGENCY', label: 'Emergency Inspection', color: '#ef4444' },
  { value: 'POST_MONSOON', label: 'Post-Monsoon', color: '#f59e0b' },
  { value: 'STRUCTURAL_AUDIT', label: 'Structural Audit', color: '#8b5cf6' },
  { value: 'LOAD_TEST', label: 'Load Capacity Test', color: '#10b981' },
];

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getDaysUntil(dateStr) {
  const days = Math.ceil((new Date(dateStr) - new Date()) / 86400000);
  if (days < 0) return 'Overdue';
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `${days} days`;
}

export default function InspectionScheduler({ bridges }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [scheduled, setScheduled] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    bridge_id: '',
    inspection_date: '',
    inspection_type: 'ROUTINE',
    inspector_name: '',
    notes: '',
  });

  // Fetch scheduled inspections
  useEffect(() => {
    async function fetchScheduled() {
      try {
        const { data, error } = await supabase
          .from('inspections')
          .select(`
            *,
            bridge:bridge_id(name, district)
          `)
          .gte('inspection_date', new Date().toISOString().split('T')[0])
          .order('inspection_date', { ascending: true })
          .limit(20);

        if (error) throw error;
        setScheduled(data || []);
      } catch (err) {
        console.error('Failed to load inspections:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchScheduled();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.bridge_id || !formData.inspection_date || !formData.inspector_name) {
      showToast('Please fill all required fields', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('inspections').insert({
        bridge_id: formData.bridge_id,
        inspection_date: formData.inspection_date,
        inspection_type: formData.inspection_type,
        inspector_name: formData.inspector_name,
        notes: formData.notes,
        conducted_by: user?.id,
        status: 'SCHEDULED',
      });

      if (error) throw error;

      showToast('Inspection scheduled successfully', 'success');
      setShowForm(false);
      setFormData({
        bridge_id: '',
        inspection_date: '',
        inspection_type: 'ROUTINE',
        inspector_name: '',
        notes: '',
      });

      // Refresh list
      const { data } = await supabase
        .from('inspections')
        .select(`*, bridge:bridge_id(name, district)`)
        .gte('inspection_date', new Date().toISOString().split('T')[0])
        .order('inspection_date', { ascending: true })
        .limit(20);
      setScheduled(data || []);
    } catch (err) {
      showToast(err.message || 'Failed to schedule inspection', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
        <SkeletonCard height="200px" />
      </div>
    );
  }

  return (
    <div style={{
      padding: '1.5rem',
      background: 'rgba(255,255,255,0.02)',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.05)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            📅 Inspection Schedule
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            {scheduled.length} upcoming inspections
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: 'none',
            background: showForm ? '#ef4444' : '#3b82f6',
            color: 'white',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {showForm ? '✕ Cancel' : '+ Schedule New'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{
          padding: '1rem',
          background: 'rgba(0,0,0,0.2)',
          borderRadius: '8px',
          marginBottom: '1.5rem',
        }}>
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem', color: '#94a3b8' }}>
                Bridge *
              </label>
              <select
                value={formData.bridge_id}
                onChange={e => setFormData({ ...formData, bridge_id: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: 'white',
                }}
                required
              >
                <option value="">Select bridge...</option>
                {bridges.map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({b.district})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem', color: '#94a3b8' }}>
                Inspection Date *
              </label>
              <input
                type="date"
                value={formData.inspection_date}
                onChange={e => setFormData({ ...formData, inspection_date: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: 'white',
                }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem', color: '#94a3b8' }}>
                Inspector Name *
              </label>
              <input
                type="text"
                value={formData.inspector_name}
                onChange={e => setFormData({ ...formData, inspector_name: e.target.value })}
                placeholder="e.g., Rajesh Kumar, PWD"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: 'white',
                }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem', color: '#94a3b8' }}>
                Inspection Type *
              </label>
              <select
                value={formData.inspection_type}
                onChange={e => setFormData({ ...formData, inspection_type: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: 'white',
                }}
              >
                {INSPECTION_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem', color: '#94a3b8' }}>
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional details..."
              rows={2}
              style={{
                width: '100%',
                padding: '0.5rem',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                color: 'white',
                resize: 'vertical',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1.5rem',
              borderRadius: '6px',
              border: 'none',
              background: '#3b82f6',
              color: 'white',
              fontWeight: 600,
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? 'Scheduling...' : 'Schedule Inspection'}
          </button>
        </form>
      )}

      {/* Scheduled List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {scheduled.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
            No upcoming inspections scheduled.
          </p>
        ) : (
          scheduled.map(inspection => {
            const type = INSPECTION_TYPES.find(t => t.value === inspection.inspection_type) || INSPECTION_TYPES[0];
            const daysText = getDaysUntil(inspection.inspection_date);
            const isOverdue = daysText === 'Overdue';
            const isToday = daysText === 'Today';

            return (
              <div
                key={inspection.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  background: isOverdue ? 'rgba(239,68,68,0.1)' : isToday ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.03)',
                  borderRadius: '8px',
                  border: `1px solid ${isOverdue ? 'rgba(239,68,68,0.2)' : isToday ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)'}`,
                }}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '8px',
                  background: type.color + '20',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  flexShrink: 0,
                }}>
                  📋
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.15rem' }}>
                    {inspection.bridge?.name || 'Unknown Bridge'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    <span style={{ color: type.color }}>● {type.label}</span>
                    {' · '}
                    Inspector: {inspection.inspector_name}
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{
                    fontWeight: 700,
                    color: isOverdue ? '#ef4444' : isToday ? '#3b82f6' : '#fff',
                  }}>
                    {formatDate(inspection.inspection_date)}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: isOverdue ? '#ef4444' : isToday ? '#3b82f6' : '#94a3b8',
                    fontWeight: isOverdue || isToday ? 600 : 400,
                  }}>
                    {daysText}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
