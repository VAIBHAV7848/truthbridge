import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Portal from './pages/Portal';
import Home from './pages/Home';
import BridgeDetail from './pages/BridgeDetail';
import ReportBridge from './pages/ReportBridge';
import TruthDashboard from './pages/TruthDashboard';
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <nav className="navbar">
          <div className="brand">
            <span style={{ fontSize: '1.2rem' }}>🌉</span> TruthBridge
          </div>
          <div className="nav-links">
            <a href="/map" className="nav-item">Live Map</a>
            <a href="/truth" className="nav-item">Truth Counter</a>
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

          {/* Admin routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
