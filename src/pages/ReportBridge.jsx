import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { submitReport } from '../lib/reports'

const DAMAGE_TYPES = ['CRACK', 'SCOUR', 'RAILING_BROKEN', 'OVERLOADING', 'FOUNDATION', 'SPALLING', 'OTHER'];
const SEVERITIES = ['VISIBLE', 'SERIOUS', 'DANGEROUS'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function ReportBridge() {
  const { bridgeId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
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
  const [photoPreview, setPhotoPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);

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

  function handleFileSelect(file) {
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setError('Photo must be under 5MB. Please compress or choose a smaller image.');
      setPhoto(null);
      setPhotoPreview(null);
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, etc.).');
      setPhoto(null);
      setPhotoPreview(null);
      return;
    }
    setError(null);
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    handleFileSelect(file);
  }

  function removePhoto() {
    setPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.bridge_id) return setError('Please select a bridge.');
    if (!photo) return setError('Photo evidence is required.');

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
        <div className="glass-panel" style={{ maxWidth: '600px', margin: '0 auto', padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem' }}>✅</div>
          <h1>Report Filed</h1>
          <p>Permanently on public record. The responsible authority has been notified.</p>
          <p className="text-red" style={{ marginTop: '1rem' }}>
            If no action is taken within 30 days, this report will be publicly marked IGNORED.
          </p>
          <button className="btn-primary" onClick={() => navigate('/map')} style={{ marginTop: '2rem' }}>
            Back to Map
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="glass-panel" style={{ maxWidth: '700px', margin: '0 auto', padding: '2rem', textAlign: 'left' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>📸 Report Bridge Damage</h1>
        <p className="text-gray">Anonymous report. Permanent public record. Authorities notified immediately.</p>
        
        <form onSubmit={handleSubmit} style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <label>
            <span style={{ fontWeight: 600 }}>Bridge *</span>
            <select className="form-input" value={form.bridge_id} onChange={e => setForm({ ...form, bridge_id: e.target.value })} required>
              <option value="">— Select a bridge —</option>
              {bridges.map(b => <option key={b.id} value={b.id}>{b.name} — {b.district}, {b.state}</option>)}
            </select>
          </label>
          
          <label>
            <span style={{ fontWeight: 600 }}>Damage Type *</span>
            <select className="form-input" value={form.damage_type} onChange={e => setForm({ ...form, damage_type: e.target.value })}>
              {DAMAGE_TYPES.map(d => <option key={d} value={d}>{d.replace('_', ' ')}</option>)}
            </select>
          </label>
          
          <label>
            <span style={{ fontWeight: 600 }}>Severity *</span>
            <select className="form-input" value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}>
              {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          
          <label>
            <span style={{ fontWeight: 600 }}>Description</span>
            <textarea className="form-input" rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the visible damage or danger..." />
          </label>
          
          {/* Photo Upload Drop Zone */}
          <div>
            <span style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Photo Evidence *</span>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${dragOver ? 'var(--color-accent)' : 'var(--color-glass-border)'}`,
                borderRadius: 12,
                padding: photoPreview ? '0' : '2.5rem 1.5rem',
                textAlign: 'center',
                cursor: 'pointer',
                background: dragOver ? 'rgba(59,130,246,0.1)' : 'rgba(0,0,0,0.3)',
                transition: '0.2s',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {photoPreview ? (
                <div style={{ position: 'relative' }}>
                  <img src={photoPreview} alt="Preview" style={{ width: '100%', maxHeight: 280, objectFit: 'cover', borderRadius: 10, display: 'block' }} />
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); removePhoto(); }}
                    style={{
                      position: 'absolute', top: 8, right: 8,
                      background: 'rgba(0,0,0,0.7)', color: '#fff',
                      border: 'none', borderRadius: '50%',
                      width: 32, height: 32, cursor: 'pointer',
                      fontSize: '1rem', fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >✕</button>
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                    padding: '1rem', color: '#fff', fontSize: '0.85rem'
                  }}>
                    📎 {photo?.name} · {(photo?.size / 1024 / 1024).toFixed(1)}MB
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: '3rem', marginBottom: '0.75rem', opacity: 0.6 }}>📷</div>
                  <p style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>
                    {dragOver ? 'Drop image here' : 'Click or drag to upload photo'}
                  </p>
                  <p className="text-gray" style={{ fontSize: '0.85rem' }}>JPG, PNG up to 5MB</p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={e => handleFileSelect(e.target.files?.[0])}
              style={{ display: 'none' }}
            />
          </div>
          
          {error && <p className="text-red" style={{ fontWeight: 600 }}>⚠️ {error}</p>}
          
          <button type="submit" className="btn-danger" disabled={submitting}>
            {submitting ? '⏳ Submitting...' : '🚨 File Report — Make It Public Record'}
          </button>
        </form>
      </div>
    </div>
  );
}
