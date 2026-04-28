/**
 * TruthBridge — Citizen Report Form Page
 */
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { submitReport } from '../lib/reports';

const DAMAGE_TYPES = ['CRACK', 'SCOUR', 'RAILING_BROKEN', 'OVERLOADING', 'FOUNDATION', 'SPALLING', 'OTHER'];
const SEVERITIES = ['VISIBLE', 'SERIOUS', 'DANGEROUS'];

export default function ReportBridge() {
  const { bridgeId } = useParams();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    bridge_id: bridgeId || '',
    damage_type: 'CRACK',
    severity: 'SERIOUS',
    description: '',
  });
  const [photo, setPhoto] = useState(null);

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
      <div id="report-success">
        <h1>✅ Report Submitted</h1>
        <p>Your report has been submitted successfully. The responsible authority will be notified.</p>
        <button onClick={() => navigate('/')}>Back to Map</button>
      </div>
    );
  }

  return (
    <div id="report-page">
      <h1>📸 Report a Bridge Danger</h1>
      <p>Your report is anonymous. Authorities will be notified immediately.</p>

      <form onSubmit={handleSubmit}>
        <label>Bridge ID: <input value={form.bridge_id} onChange={e => setForm({...form, bridge_id: e.target.value})} required /></label>

        <label>Damage Type:
          <select value={form.damage_type} onChange={e => setForm({...form, damage_type: e.target.value})}>
            {DAMAGE_TYPES.map(d => <option key={d} value={d}>{d.replace('_', ' ')}</option>)}
          </select>
        </label>

        <label>Severity:
          <select value={form.severity} onChange={e => setForm({...form, severity: e.target.value})}>
            {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>

        <label>Description: <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></label>

        <label>Photo (required): <input type="file" accept="image/*" onChange={e => setPhoto(e.target.files[0])} required /></label>

        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Report'}</button>
      </form>
    </div>
  );
}
