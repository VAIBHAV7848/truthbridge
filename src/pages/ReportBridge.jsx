/**
 * TruthBridge — Citizen Report Form Page
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { submitReport } from '../lib/reports';
import { supabase } from '../lib/supabase';

const DAMAGE_TYPES = ['CRACK', 'SCOUR', 'RAILING_BROKEN', 'OVERLOADING', 'FOUNDATION', 'SPALLING', 'OTHER'];
const SEVERITIES = ['VISIBLE', 'SERIOUS', 'DANGEROUS'];

export default function ReportBridge() {
  const { bridgeId } = useParams();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const [bridges, setBridges] = useState([]);
  const [bridgesLoading, setBridgesLoading] = useState(true);

  const [form, setForm] = useState({
    bridge_id: bridgeId || '',
    damage_type: 'CRACK',
    severity: 'SERIOUS',
    description: '',
  });
  const [photo, setPhoto] = useState(null);

  useEffect(() => {
    async function fetchBridges() {
      try {
        const { data, error: fetchError } = await supabase
          .from('bridges')
          .select('id, name, district, state')
          .order('name');
        
        if (fetchError) throw fetchError;
        setBridges(data || []);
      } catch (err) {
        console.error("Error fetching bridges for dropdown:", err);
      } finally {
        setBridgesLoading(false);
      }
    }
    fetchBridges();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.bridge_id) return setError('Please select a bridge.');
    if (!photo) return setError('Photo is required.');

    setSubmitting(true);
    setError(null);
    try {
      await submitReport(form, photo);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div id="report-success" style={{ padding: '100px 2rem', textAlign: 'center' }}>
        <h1>✅ Report Submitted</h1>
        <p>Your report has been submitted successfully. The responsible authority will be notified.</p>
        <button className="btn-primary" onClick={() => navigate('/')}>Back to Map</button>
      </div>
    );
  }

  return (
    <div id="report-page" style={{ padding: '100px 2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>📸 Report a Bridge Danger</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
        Your report is anonymous. Authorities will be notified immediately.
      </p>

      <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <label>
          Select Bridge:
          <select 
            value={form.bridge_id} 
            onChange={e => setForm({...form, bridge_id: e.target.value})} 
            required
            style={{ marginTop: '0.5rem', background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '0.8rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
          >
            <option value="" disabled>{bridgesLoading ? 'Loading bridges...' : '— Select a bridge —'}</option>
            {bridges.map(b => (
              <option key={b.id} value={b.id}>
                {b.name} — {b.district}, {b.state}
              </option>
            ))}
          </select>
        </label>

        <label>
          Damage Type:
          <select 
            value={form.damage_type} 
            onChange={e => setForm({...form, damage_type: e.target.value})}
            style={{ marginTop: '0.5rem', background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '0.8rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
          >
            {DAMAGE_TYPES.map(d => <option key={d} value={d}>{d.replace('_', ' ')}</option>)}
          </select>
        </label>

        <label>
          Severity:
          <select 
            value={form.severity} 
            onChange={e => setForm({...form, severity: e.target.value})}
            style={{ marginTop: '0.5rem', background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '0.8rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
          >
            {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>

        <label>
          Description: 
          <textarea 
            value={form.description} 
            onChange={e => setForm({...form, description: e.target.value})} 
            style={{ marginTop: '0.5rem', background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '0.8rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', minHeight: '100px' }}
          />
        </label>

        <label>
          Photo (required): 
          <input 
            type="file" 
            accept="image/*" 
            onChange={e => setPhoto(e.target.files[0])} 
            required 
            style={{ marginTop: '0.5rem' }}
          />
        </label>

        {error && <p style={{ color: 'var(--color-critical)' }}>⚠️ {error}</p>}
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>
    </div>
  );
}
