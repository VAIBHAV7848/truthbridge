/**
 * TruthBridge — Admin Login Page
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn } from '../../lib/auth';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signIn(email, password);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div id="admin-login-page">
      <h1>🔐 Admin Login</h1>
      <p>Authority access only</p>

      <form onSubmit={handleLogin}>
        <label>Email: <input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
        <label>Password: <input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></label>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Login'}</button>
      </form>
    </div>
  );
}
