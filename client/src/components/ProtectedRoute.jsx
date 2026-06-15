import { Navigate } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext.jsx';

// Redirect unauthenticated users to /login; show spinner while auth state loads
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
        <Spinner animation="border" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return children;
}

export default ProtectedRoute;
