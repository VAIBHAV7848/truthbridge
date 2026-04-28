import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn } from '../../lib/auth'

let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 3000;

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    setError(null)

    const now = Date.now();
    if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
      setError('Please wait a few seconds before trying again.');
      return;
    }

    setLoading(true)
    lastRequestTime = now;

    try {
      await signIn(email, password)
      navigate('/admin/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight:'100vh',
      display:'flex',
      alignItems:'center',
      justifyContent:'center',
      background:'var(--color-bg)'
    }}>
      <div className="glass-panel" style={{
        width:'100%',
        maxWidth:'440px',
        padding:'3rem',
        textAlign:'center'
      }}>
        
        {/* Icon */}
        <div style={{fontSize:'3rem',marginBottom:'1rem'}}>🔐</div>
        
        {/* Title */}
        <h1 style={{
          fontSize:'2rem',
          fontWeight:800,
          marginBottom:'0.5rem',
          background:'linear-gradient(to right,#ffffff,#94a3b8)',
          WebkitBackgroundClip:'text',
          WebkitTextFillColor:'transparent'
        }}>Authority Login</h1>
        
        <p className="text-gray" style={{marginBottom:'2rem',fontSize:'0.95rem'}}>
          TruthBridge Admin Panel · PWD / HDMC / State Authority
        </p>

        <form onSubmit={handleLogin} style={{
          display:'flex',
          flexDirection:'column',
          gap:'1.2rem',
          textAlign:'left'
        }}>
          
          <div>
            <label style={{
              display:'block',
              fontWeight:600,
              fontSize:'0.9rem',
              marginBottom:'0.5rem',
              color:'var(--color-text-muted)'
            }}>EMAIL ADDRESS</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@pwd.karnataka.gov.in"
              required
              style={{marginTop:0}}
            />
          </div>

          <div>
            <label style={{
              display:'block',
              fontWeight:600,
              fontSize:'0.9rem',
              marginBottom:'0.5rem',
              color:'var(--color-text-muted)'
            }}>PASSWORD</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{marginTop:0}}
            />
          </div>

          {error && (
            <div style={{
              background:'rgba(239,68,68,0.1)',
              border:'1px solid rgba(239,68,68,0.3)',
              borderRadius:8,
              padding:'0.75rem 1rem',
              color:'#ef4444',
              fontSize:'0.9rem',
              fontWeight:500
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{
              width:'100%',
              padding:'0.9rem',
              fontSize:'1rem',
              fontWeight:700,
              marginTop:'0.5rem'
            }}
          >
            {loading ? '⏳ Signing in...' : '→ Sign In to Dashboard'}
          </button>
        </form>

        <div style={{
          marginTop:'2rem',
          paddingTop:'1.5rem',
          borderTop:'1px solid var(--color-glass-border)'
        }}>
          <p className="text-gray" style={{fontSize:'0.8rem'}}>
            Citizens do not need an account to report bridge damage.
          </p>
          <a href="/report" style={{
            display:'inline-block',
            marginTop:'0.75rem',
            fontSize:'0.85rem',
            color:'var(--color-accent)'
          }}>
            📸 Report a bridge without logging in →
          </a>
        </div>
      </div>
    </div>
  )
}
