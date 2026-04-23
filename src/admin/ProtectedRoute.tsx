import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  children: React.ReactNode;
  requireSuperAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireSuperAdmin = false }: Props) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  // Wait for Supabase session to initialize before redirecting
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (requireSuperAdmin && currentUser?.role !== 'superadmin') {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}
