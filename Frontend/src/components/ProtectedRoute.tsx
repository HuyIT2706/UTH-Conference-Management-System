import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import CircularProgress from '@mui/material/CircularProgress';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute = ({ children, adminOnly = false }: ProtectedRouteProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    const handleLogout = () => {
      navigate('/login', { replace: true });
    };
    
    window.addEventListener('auth:logout', handleLogout);
    
    return () => {
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <CircularProgress disableShrink />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && user) {
    const isChairOrAdmin = user.roles?.includes('CHAIR') || user.roles?.includes('ADMIN');
    const isReviewer = user.roles?.includes('REVIEWER');
    const isAuthor = user.roles?.includes('AUTHOR');

    if (!isChairOrAdmin) {
      if (isReviewer) {
        return <Navigate to="/reviewer" replace />;
      }
      if (isAuthor) {
        return <Navigate to="/student" replace />;
      }
      return <Navigate to="/home" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;






