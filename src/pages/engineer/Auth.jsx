import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInEngineer } from '../../lib/auth';

const MIN_INTERVAL = 3000;

export default function EngineerAuth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const lastRequest = useRef(0);

  async function handleLogin(e) {
    e.preventDefault();
    setError(null);
    const now = Date.now();
    if (now - lastRequest.current < MIN_INTERVAL) {
      setError('Please wait a few seconds before trying again.');
      return;
    }
    setLoading(true);
    lastRequest.current = now;
    try {
      await signInEngineer(email, password);
      navigate('/engineer/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-bg)'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '3rem',
        textAlign: 'center'
      }}>
        {/* Icon */}
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔧</div>

        {/* Title */}
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 800,
          marginBottom: '0.5rem',
          background: 'linear-gradient(to right, #ffffff, #94a3b8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>Engineer Login</h1>

        <p className="text-gray" style={{ marginBottom: '2rem', fontSize: '0.95rem' }}>
          TruthBridge Field Engineers · Assigned Inspections & Tasks
        </p>

        <form onSubmit={handleLogin} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.2rem',
          textAlign: 'left'
        }}>
          <div>
            <label style={{
              display: 'block',
              fontWeight: 600,
              fontSize: '0.9rem',
              marginBottom: '0.5rem',
              color: 'var(--color-text-muted)'
            }}>EMAIL ADDRESS</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="engineer@pwd.karnataka.gov.in"
              required
              style={{ marginTop: 0 }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontWeight: 600,
              fontSize: '0.9rem',
              marginBottom: '0.5rem',
              color: 'var(--color-text-muted)'
            }}>PASSWORD</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{ marginTop: 0 }}
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 8,
              padding: '0.75rem 1rem',
              color: '#ef4444',
              fontSize: '0.9rem',
              fontWeight: 500
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.9rem',
              fontSize: '1rem',
              fontWeight: 700,
              marginTop: '0.5rem'
            }}
          >
            {loading ? '⏳ Signing in...' : '→ Sign In to Dashboard'}
          </button>
        </form>

        <div style={{
          marginTop: '2rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid var(--color-glass-border)'
        }}>
          <Link to="/" style={{
            display: 'inline-block',
            fontSize: '0.85rem',
            color: 'var(--color-accent)'
          }}>
            ← Back to Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
