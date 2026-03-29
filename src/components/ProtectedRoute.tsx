import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const authInitialized = useAuthStore((s) => s.authInitialized);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  if (!authInitialized) {
    return <div className="app-loading">Loading…</div>;
  }

  if (!isAuthenticated) {
    // Preserve the attempted URL so AuthPage can redirect back after login
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname + location.search }}
        replace
      />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
