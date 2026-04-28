import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Portal from './pages/Portal';
import Home from './pages/Home';
import BridgeDetail from './pages/BridgeDetail';
import ReportBridge from './pages/ReportBridge';
import TruthDashboard from './pages/TruthDashboard';
import ReportFeed from './pages/ReportFeed';
import NotFound from './pages/NotFound';
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminAnalytics from './pages/admin/Analytics';
import './App.css';

function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <AuthProvider>
      <BrowserRouter>
        <nav className="navbar">
          <div className="brand">
            <span style={{ fontSize: '1.2rem' }}>🌉</span> TruthBridge
          </div>
          <button className="hamburger" onClick={() => setMenuOpen(m => !m)}>
            {menuOpen ? '✕' : '☰'}
          </button>
          <div className={`nav-links${menuOpen ? ' open' : ''}`} onClick={() => setMenuOpen(false)}>
            <a href="/map" className="nav-item">Live Map</a>
            <a href="/truth" className="nav-item">Truth Counter</a>
            <a href="/feed" className="nav-item">Reports Feed</a>
            <a href="/report" className="btn-primary">Report Damage</a>
          </div>
        </nav>
        
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Portal />} />
          <Route path="/map" element={<Home />} />
          <Route path="/bridge/:id" element={<BridgeDetail />} />
          <Route path="/report" element={<ReportBridge />} />
          <Route path="/report/:bridgeId" element={<ReportBridge />} />
          <Route path="/truth" element={<TruthDashboard />} />
          <Route path="/feed" element={<ReportFeed />} />

          {/* Admin routes — protected */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute><AdminAnalytics /></ProtectedRoute>} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
