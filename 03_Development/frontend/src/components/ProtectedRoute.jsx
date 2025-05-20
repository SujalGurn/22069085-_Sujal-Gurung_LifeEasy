// src/components/ProtectedRoute.js
import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { UserContext } from '../UserContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { userData, loading, isAdmin, isDoctor } = useContext(UserContext);
  const location = useLocation();

  // Enhanced role checking
  const currentRole = isAdmin ? 'admin' : 
                     isDoctor ? 'doctor' : 
                     userData?.role || 'user';

  if (loading) return <div className="loading-spinner">Loading...</div>;

  if (!userData) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentRole)) {
    console.warn(`Access denied for role ${currentRole} to ${location.pathname}`);
    return <Navigate to="/unauthorized" replace />;
  }



  return children;
};

export default ProtectedRoute;