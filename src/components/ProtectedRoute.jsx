import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return (
    <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="spinner"></div>
    </div>
  );
  if (!user) return <Navigate to="/admin/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

/**
 * EngineerRoute — restricts access to authenticated engineers only.
 */
export function EngineerRoute({ children }) {
  const { user, isEngineer, loading } = useAuth();
  if (loading) return (
    <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="spinner"></div>
    </div>
  );
  if (!user) return <Navigate to="/engineer/login" replace />;
  if (!isEngineer) return <Navigate to="/" replace />;
  return children;
}
