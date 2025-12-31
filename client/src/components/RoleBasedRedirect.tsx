import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const RoleBasedRedirect = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Đang tải...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isChairOrAdmin = user.roles?.includes('CHAIR') || user.roles?.includes('ADMIN');

  if (isChairOrAdmin) {
    return <Navigate to="/conference-setup" replace />;
  }
  return <Navigate to="/home" replace />;
};

export default RoleBasedRedirect;



