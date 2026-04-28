/**
 * TruthBridge — Citizen Login / Sign Up
 * 
 * Citizens can create accounts to submit verified reports.
 * Different from Admin portal (which is for authorities).
 */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function CitizenAuth() {
  const navigate = useNavigate();
  const { loading: authLoading, isLoggedIn, user } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  if (authLoading) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (isLoggedIn && user) {
    navigate('/report');
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        navigate('/report');
      } else {
        // Sign up
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/report`,
          },
        });
        if (signUpError) throw signUpError;
        
        setSuccess('Account created! Check your email to verify your account, then login to submit reports.');
        setMode('login');
        setPassword('');
      }
    } catch (err) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', paddingTop: '80px' }}>
      <div className="glass-panel" style={{ maxWidth: 480, width: '100%', padding: '2.5rem', textAlign: 'center' }}>
        
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👤</div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          {mode === 'login' ? 'Citizen Login' : 'Citizen Sign Up'}
        </h1>
        <p className="text-gray" style={{ marginBottom: '2rem' }}>
          {mode === 'login' 
            ? 'Login to submit verified bridge damage reports.' 
            : 'Create an account to submit verified reports.'}
        </p>

        <div style={{ display: 'flex', marginBottom: '2rem', background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '4px' }}>
          <button 
            className={`${mode === 'login' ? 'btn-primary' : 'filter-btn'}`}
            style={{ flex: 1, padding: '0.6rem' }}
            onClick={() => setMode('login')}
          >
            Login
          </button>
          <button 
            className={`${mode === 'signup' ? 'btn-primary' : 'filter-btn'}`}
            style={{ flex: 1, padding: '0.6rem' }}
            onClick={() => setMode('signup')}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', textAlign: 'left' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>EMAIL</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>PASSWORD</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {mode === 'signup' && (
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>CONFIRM PASSWORD</label>
              <input
                type="password"
                className="form-input"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          )}

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '0.75rem', color: '#ef4444', fontSize: '0.9rem' }}>
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '0.75rem', color: '#10b981', fontSize: '0.9rem' }}>
              ✅ {success}
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '0.9rem', fontSize: '1rem', fontWeight: 700 }}>
            {loading ? '⏳ Processing...' : mode === 'login' ? '→ Login to Report' : '→ Create Account'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-glass-border)' }}>
          <p className="text-gray" style={{ fontSize: '0.85rem' }}>
            Are you an authority/admin?{' '}
            <Link to="/admin/login" style={{ color: 'var(--color-accent)', fontWeight: 600 }}>
              Admin Login →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}