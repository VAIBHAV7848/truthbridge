import { useNavigate } from 'react-router-dom';

export default function Portal() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-bg)',
      padding: '2rem'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '800px',
        padding: '4rem 3rem',
        textAlign: 'center',
        background: 'linear-gradient(180deg, rgba(20,20,30,0.8) 0%, rgba(10,10,15,0.9) 100%)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)'
      }}>
        
        <div style={{ fontSize: '4rem', marginBottom: '1rem', textShadow: '0 0 20px rgba(255,255,255,0.3)' }}>🌉</div>
        <h1 style={{
          fontSize: '3.5rem',
          fontWeight: 900,
          marginBottom: '1rem',
          letterSpacing: '-1px',
          background: 'linear-gradient(to right, #ffffff, #94a3b8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>TruthBridge</h1>
        
        <p className="text-gray" style={{ fontSize: '1.2rem', marginBottom: '4rem', maxWidth: '600px', margin: '0 auto 4rem auto' }}>
          India's independent, citizen-driven bridge safety and accountability network.
          Select your portal to continue.
        </p>

        <div className="grid-2" style={{ gap: '2rem' }}>
          
          {/* Citizen Portal */}
          <div 
            className="card-dark" 
            style={{ 
              cursor: 'pointer', 
              transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
            onClick={() => navigate('/map')}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👁️</div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Citizen Access</h2>
            <p className="text-gray" style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              View live bridge map, check risk scores, or report dangerous infrastructure anonymously.
            </p>
            <button className="btn-primary" style={{ width: '100%', background: 'rgba(255,255,255,0.1)', color: 'white' }}>
              Enter Public Portal →
            </button>
          </div>

          {/* Authority Portal */}
          <div 
            className="card-dark" 
            style={{ 
              cursor: 'pointer', 
              transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              border: '1px solid rgba(239,68,68,0.2)',
              background: 'linear-gradient(180deg, rgba(69,10,10,0.4) 0%, rgba(0,0,0,0) 100%)'
            }}
            onClick={() => navigate('/admin/login')}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.5)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(239,68,68,0.2)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛡️</div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#fca5a5' }}>Authority Login</h2>
            <p className="text-gray" style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Authorized PWD, HDMC, and State officials. Review reports and log actions taken.
            </p>
            <button className="btn-danger" style={{ width: '100%', padding: '0.6rem 1.2rem', fontSize: '1rem' }}>
              Admin Login →
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
