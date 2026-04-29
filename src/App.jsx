import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute, { EngineerRoute } from './components/ProtectedRoute';
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
import AdminProfile from './pages/admin/Profile';
import CitizenAuth from './pages/citizen/Auth';
import CitizenProfile from './pages/citizen/Profile';
import Leaderboard from './pages/Leaderboard';
import EngineerAuth from './pages/engineer/Auth';
import EngineerDashboard from './pages/engineer/Dashboard';
import NavProfileLink from './components/NavProfileLink';
import './App.css';

function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <AuthProvider>
      <ToastProvider>
      <BrowserRouter>
        <nav className="navbar">
          <div className="brand" onClick={() => window.location.href = '/'} style={{ cursor: 'pointer' }}>
            <span style={{ fontSize: '1.2rem' }}>🌉</span> TruthBridge
          </div>
          <button className="hamburger" onClick={() => setMenuOpen(m => !m)}>
            {menuOpen ? '✕' : '☰'}
          </button>
          <div className={`nav-links${menuOpen ? ' open' : ''}`} onClick={() => setMenuOpen(false)}>
            <Link to="/map" className="nav-item">Live Map</Link>
            <Link to="/truth" className="nav-item">Truth Counter</Link>
            <Link to="/feed" className="nav-item">Reports Feed</Link>
            <Link to="/leaderboard" className="nav-item">Leaderboard</Link>
            <Link to="/report" className="btn-primary">Report Damage</Link>
            <NavProfileLink />
          </div>
        </nav>
        
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Portal />} />
          <Route path="/map" element={<Home />} />
          <Route path="/bridge/:id" element={<BridgeDetail />} />
          <Route path="/truth" element={<TruthDashboard />} />
          <Route path="/feed" element={<ReportFeed />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/report" element={<ReportBridge />} />
          <Route path="/report/:bridgeId" element={<ReportBridge />} />

          {/* Citizen routes */}
          <Route path="/citizen/login" element={<CitizenAuth />} />
          <Route path="/citizen/signup" element={<CitizenAuth />} />
          <Route path="/citizen/profile" element={<CitizenProfile />} />

          {/* Engineer routes */}
          <Route path="/engineer/login" element={<EngineerAuth />} />
          <Route path="/engineer/dashboard" element={<EngineerRoute><EngineerDashboard /></EngineerRoute>} />

          {/* Admin routes — protected */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute><AdminAnalytics /></ProtectedRoute>} />
          <Route path="/admin/profile" element={<ProtectedRoute><AdminProfile /></ProtectedRoute>} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;

