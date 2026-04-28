import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="page-container" style={{ textAlign: 'center', paddingTop: '5rem' }}>
      <div style={{ fontSize: '5rem' }}>🌉</div>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Bridge Not Found</h1>
      <p className="text-gray" style={{ marginBottom: '2rem' }}>This page doesn't exist. But infrastructure gaps in India do.</p>
      <button className="btn-primary" onClick={() => navigate('/')}>Return to TruthBridge</button>
    </div>
  );
}
