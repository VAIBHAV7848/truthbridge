import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { submitReport } from '../lib/reports'

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
          .select('id,name,district,state')
          .order('name');
        
        if (fetchError) throw fetchError;
        setBridges(data || []);
      } catch (err) {
        console.error("Error fetching bridges:", err);
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

    const localKey = `tb_report_${form.bridge_id}_${new Date().toDateString()}`;
    if (localStorage.getItem(localKey)) {
      return setError('You already reported this bridge today.');
    }

    setSubmitting(true);
    setError(null);
    try {
      await submitReport(form, photo);
      localStorage.setItem(localKey, '1');
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="page-container">
        <div className="glass-panel" style={{maxWidth:'600px',margin:'0 auto',padding:'3rem',textAlign:'center'}}>
          <div style={{fontSize:'4rem'}}>✅</div>
          <h1>Report Filed</h1>
          <p>Permanently on public record. The responsible authority has been notified.</p>
          <p className="text-red" style={{marginTop:'1rem'}}>
            If no action is taken within 30 days, this report will be publicly marked IGNORED.
          </p>
          <button className="btn-primary" onClick={() => navigate('/')} style={{marginTop:'2rem'}}>
            Back to Map
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="glass-panel" style={{maxWidth:'700px',margin:'0 auto',padding:'2rem',textAlign:'left'}}>
        <h1 style={{fontSize:'2rem',fontWeight:800,marginBottom:'0.5rem'}}>📸 Report Bridge Damage</h1>
        <p className="text-gray">Anonymous report. Permanent public record. Authorities notified immediately.</p>
        
        <form onSubmit={handleSubmit} style={{marginTop:'2rem',display:'flex',flexDirection:'column',gap:'1.5rem'}}>
          <label>
            <span style={{fontWeight:600}}>Bridge *</span>
            <select className="form-input" value={form.bridge_id} onChange={e => setForm({...form, bridge_id: e.target.value})} required>
              <option value="">— Select a bridge —</option>
              {bridges.map(b => <option key={b.id} value={b.id}>{b.name} — {b.district}, {b.state}</option>)}
            </select>
          </label>
          
          <label>
            <span style={{fontWeight:600}}>Damage Type *</span>
            <select className="form-input" value={form.damage_type} onChange={e => setForm({...form, damage_type: e.target.value})}>
              {DAMAGE_TYPES.map(d => <option key={d} value={d}>{d.replace('_', ' ')}</option>)}
            </select>
          </label>
          
          <label>
            <span style={{fontWeight:600}}>Severity *</span>
            <select className="form-input" value={form.severity} onChange={e => setForm({...form, severity: e.target.value})}>
              {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          
          <label>
            <span style={{fontWeight:600}}>Description</span>
            <textarea className="form-input" rows={4} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Describe the visible damage or danger..." />
          </label>
          
          <label>
            <span style={{fontWeight:600}}>Photo Evidence (required) *</span>
            <input type="file" accept="image/*" onChange={e => setPhoto(e.target.files[0])} required className="form-input" />
            {photo && <img src={URL.createObjectURL(photo)} alt="Preview" style={{width:'100%',borderRadius:8,marginTop:8}} />}
          </label>
          
          {error && <p className="text-red" style={{fontWeight:600}}>{error}</p>}
          
          <button type="submit" className="btn-danger" disabled={submitting}>
            {submitting ? '⏳ Submitting...' : '🚨 File Report — Make It Public Record'}
          </button>
        </form>
      </div>
    </div>
  );
}
