import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
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
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
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
