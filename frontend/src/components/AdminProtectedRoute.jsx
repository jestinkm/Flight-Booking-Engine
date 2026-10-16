import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const AdminProtectedRoute = ({ children, allowedRoles = ['SUPER_ADMIN', 'SCHEDULE_ADMIN', 'MARKETING_ADMIN'] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner message="Verifying administrator credentials..." className="min-h-[50vh]" />;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/admin-login" state={{ from: location }} replace />;
  }

  return children;
};

export default AdminProtectedRoute;
