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

    // Duplicate Prevention
    const today = new Date().toISOString().split('T')[0];
    const reportKey = `report_${form.bridge_id}_${today}`;
    if (localStorage.getItem(reportKey)) {
      return setError('You already reported this bridge today.');
    }

    setSubmitting(true);
    setError(null);
    try {
      await submitReport(form, photo);
      localStorage.setItem(reportKey, 'true');
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="page-container" style={{ textAlign: 'center', paddingTop: '150px' }}>
        <div className="card-dark" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h1 style={{ color: 'var(--color-safe)', fontSize: '2.5rem', marginBottom: '1rem' }}>✅ Report Submitted</h1>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>Your report has been submitted successfully. The responsible authority will be notified.</p>
          <button className="btn-primary" onClick={() => navigate('/')}>Back to Map</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: '700px' }}>
      <h1 className="section-title">📸 Report a Bridge Danger</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
        Your report is anonymous. Authorities will be notified immediately. False reporting is monitored.
      </p>

      <form onSubmit={handleSubmit} className="card-dark" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'left' }}>
        <label style={{ fontWeight: '600' }}>
          Select Bridge:
          <select 
            className="form-input"
            value={form.bridge_id} 
            onChange={e => setForm({...form, bridge_id: e.target.value})} 
            required
          >
            <option value="" disabled>{bridgesLoading ? 'Loading bridges...' : '— Select a bridge —'}</option>
            {bridges.map(b => (
              <option key={b.id} value={b.id}>
                {b.name} — {b.district}, {b.state}
              </option>
            ))}
          </select>
        </label>

        <label style={{ fontWeight: '600' }}>
          Damage Type:
          <select 
            className="form-input"
            value={form.damage_type} 
            onChange={e => setForm({...form, damage_type: e.target.value})}
          >
            {DAMAGE_TYPES.map(d => <option key={d} value={d}>{d.replace('_', ' ')}</option>)}
          </select>
        </label>

        <label style={{ fontWeight: '600' }}>
          Severity:
          <select 
            className="form-input"
            value={form.severity} 
            onChange={e => setForm({...form, severity: e.target.value})}
          >
            {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>

        <label style={{ fontWeight: '600' }}>
          Description: 
          <textarea 
            className="form-input"
            value={form.description} 
            onChange={e => setForm({...form, description: e.target.value})} 
            style={{ minHeight: '120px', resize: 'vertical' }}
            placeholder="Describe the visible damage or danger..."
          />
        </label>

        <label style={{ fontWeight: '600' }}>
          Photo Evidence (required): 
          <input 
            type="file" 
            accept="image/*" 
            onChange={e => setPhoto(e.target.files[0])} 
            required 
            className="form-input"
            style={{ padding: '0.6rem' }}
          />
        </label>

        {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-critical)', color: 'var(--color-critical)', padding: '1rem', borderRadius: '8px' }}>⚠️ {error}</div>}
        
        <button type="submit" className="btn-danger" disabled={submitting} style={{ marginTop: '1rem' }}>
          {submitting ? 'Submitting to Network...' : 'Submit Report'}
        </button>
      </form>
    </div>
  );
}
