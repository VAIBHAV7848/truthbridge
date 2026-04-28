import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { submitReport } from '../lib/reports'
import { validateImage } from '../lib/imageValidator'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const DAMAGE_TYPES = ['CRACK', 'SCOUR', 'RAILING_BROKEN', 'OVERLOADING', 'FOUNDATION', 'SPALLING', 'OTHER'];
const SEVERITIES = ['VISIBLE', 'SERIOUS', 'DANGEROUS'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function ReportBridge() {
  const { bridgeId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading, isVerified } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [bridges, setBridges] = useState([]);
  const [bridgesLoading, setBridgesLoading] = useState(true);
  const [form, setForm] = useState({ bridge_id: bridgeId || '', damage_type: 'CRACK', severity: 'SERIOUS', description: '' });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [imageVerified, setImageVerified] = useState(false);

  // Restore offline draft
  useEffect(() => {
    const draft = localStorage.getItem('tb_draft_report');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setForm(prev => ({ ...prev, ...parsed }));
        showToast('Draft restored from offline session', 'info');
      } catch (e) { /* ignore corrupt drafts */ }
    }
  }, [showToast]);

  useEffect(() => {
    async function fetchBridges() {
      try {
        const { data, error: fetchError } = await supabase.from('bridges').select('id,name,district,state').order('name');
        if (fetchError) throw fetchError;
        setBridges(data || []);
      } catch (err) { console.error(err); }
      finally { setBridgesLoading(false); }
    }
    fetchBridges();
  }, []);

  function handleFileSelect(file) {
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) { setError('Photo must be under 5MB.'); setPhoto(null); setPhotoPreview(null); setImageVerified(false); return; }
    if (!file.type.startsWith('image/')) { setError('Please select an image file.'); setPhoto(null); setPhotoPreview(null); setImageVerified(false); return; }
    setError(null); setPhoto(file); setPhotoPreview(URL.createObjectURL(file)); setImageVerified(false);
  }

  function handleDrop(e) { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files?.[0]); }
  function removePhoto() { setPhoto(null); setPhotoPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; setImageVerified(false); }

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!user) return setError('You must be logged in to submit a report.');
    if (!isVerified) return setError('Please verify your email before submitting reports.');
    if (!form.bridge_id) return setError('Please select a bridge.');
    if (!photo) return setError('Photo evidence is required.');

    // AI Image Validation
    setScanning(true);
    setError(null);
    try {
      const validation = await validateImage(photo);
      if (!validation.valid) {
        showToast(validation.message, 'warning');
        setScanning(false);
        return;
      }
    } catch (err) {
      console.error('Validation error:', err);
    }
    setScanning(false);

    // Offline check
    if (!navigator.onLine) {
      localStorage.setItem('tb_draft_report', JSON.stringify(form));
      showToast('You are offline. Report saved as draft.', 'warning');
      return;
    }

    const localKey = `tb_report_${form.bridge_id}_${new Date().toDateString()}`;
    if (localStorage.getItem(localKey)) return setError('You already reported this bridge today.');

    setSubmitting(true); setError(null);
    try {
      // Append user ID to the report submission so we can track the author
      const finalForm = { ...form, citizen_id: user.id };
      await submitReport(finalForm, photo);
      localStorage.setItem(localKey, '1');
      localStorage.removeItem('tb_draft_report');
      showToast('Report submitted successfully!', 'success');
      setSuccess(true);
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  }

  if (authLoading) return (
    <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="spinner"></div>
    </div>
  );

  if (!user) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <div className="glass-panel" style={{ maxWidth: 500, width: '100%', textAlign: 'center', padding: '3rem', animation: 'fadeInUp 0.5s ease' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🛡️</div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '0.75rem' }}>Login Required</h2>
          <p className="text-gray" style={{ marginBottom: '1.5rem', lineHeight: 1.6 }}>
            To prevent spam and ensure the authenticity of reports, you must be logged in as a verified citizen to report bridge damage.
          </p>
          <button className="btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }} onClick={() => navigate('/citizen/login')}>
            Go to Citizen Login →
          </button>
        </div>
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <div className="glass-panel" style={{ maxWidth: 500, width: '100%', textAlign: 'center', padding: '3rem', animation: 'fadeInUp 0.5s ease' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📧</div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '0.75rem' }}>Verify Your Email</h2>
          <p className="text-gray" style={{ marginBottom: '1rem', lineHeight: 1.6 }}>
            Your account is not yet verified. Please check your inbox for a confirmation email from TruthBridge and click the verification link.
          </p>
          <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '1rem', marginBottom: '1.5rem', fontSize: '0.9rem', color: '#fbbf24' }}>
            ⏳ Once verified, refresh this page to start reporting.
          </div>
          <button className="btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }} onClick={() => window.location.reload()}>
            🔄 I've Verified — Refresh
          </button>
        </div>
      </div>
    );
  }

  if (success) return (
    <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
      <div className="glass-panel" style={{ maxWidth: 500, width: '100%', textAlign: 'center', padding: '3rem', animation: 'fadeInUp 0.5s ease' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '0.75rem' }}>Report Submitted</h2>
        <p className="text-gray" style={{ marginBottom: '1.5rem', lineHeight: 1.6 }}>
          Your evidence has been logged on the public record. Authorities have been notified.
          If no action is taken within <strong style={{ color: '#f97316' }}>30 days</strong>,
          this report is automatically escalated and marked as <strong style={{ color: '#ef4444' }}>IGNORED</strong>.
        </p>
        <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '1rem', marginBottom: '2rem', fontSize: '0.9rem', color: '#6ee7b7' }}>
          📣 This report is now <strong>publicly visible</strong> on the Reports Feed.
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-primary" style={{ flex: 1 }} onClick={() => navigate('/feed')}>See All Reports</button>
          <button className="btn-secondary" style={{ flex: 1 }} onClick={() => { setSuccess(false); setForm({ bridge_id: '', damage_type: 'CRACK', severity: 'SERIOUS', description: '' }); setPhoto(null); setPhotoPreview(null); }}>Report Another</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-container">
      <div className="glass-panel" style={{ maxWidth: '700px', margin: '0 auto', padding: '2rem', textAlign: 'left' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>📸 Report Bridge Damage</h1>
        
        <p className="text-gray" style={{ marginBottom: '0.5rem' }}>Photo evidence is required to submit a verified report.</p>
        
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
          
          <div>
            <span style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Photo Evidence *</span>
            <div onClick={() => fileInputRef.current?.click()} onDragOver={e => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
              style={{ border: `2px dashed ${dragOver ? 'var(--color-accent)' : 'var(--color-glass-border)'}`, borderRadius: 12, padding: photoPreview ? '0' : '2.5rem 1.5rem', textAlign: 'center', cursor: 'pointer', background: dragOver ? 'rgba(59,130,246,0.1)' : 'rgba(0,0,0,0.3)', transition: '0.2s', position: 'relative', overflow: 'hidden' }}>
              {photoPreview ? (
                <div style={{ position: 'relative' }}>
                  <img src={photoPreview} alt="Preview" style={{ width: '100%', maxHeight: 280, objectFit: 'cover', borderRadius: 10, display: 'block' }} />
                  <button type="button" onClick={e => { e.stopPropagation(); removePhoto() }} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', padding: '1rem', color: '#fff', fontSize: '0.85rem' }}>📎 {photo?.name} · {(photo?.size / 1024 / 1024).toFixed(1)}MB</div>
                </div>
              ) : (
                <><div style={{ fontSize: '3rem', marginBottom: '0.75rem', opacity: 0.6 }}>📷</div><p style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>{dragOver ? 'Drop image here' : 'Click or drag to upload photo'}</p><p className="text-gray" style={{ fontSize: '0.85rem' }}>JPG, PNG up to 5MB</p></>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={e => handleFileSelect(e.target.files?.[0])} style={{ display: 'none' }} />
          </div>
          
          {error && <p className="text-red" style={{ fontWeight: 600 }}>⚠️ {error}</p>}
          {scanning && <p style={{ fontWeight: 600, color: '#f59e0b' }}>🔍 Verifying image authenticity...</p>}
          <button type="submit" className="btn-danger" disabled={submitting || scanning}>
            {submitting ? '⏳ Submitting...' : scanning ? '🔍 Scanning...' : '🚨 File Report — Make It Public Record'}
          </button>
        </form>
      </div>
    </div>
  );
}
