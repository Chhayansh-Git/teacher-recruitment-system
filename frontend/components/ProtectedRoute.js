'use client';
/**
 * ProtectedRoute — Wraps pages that require authentication.
 * Redirects to /login if not authenticated.
 * Optionally restricts to specific roles.
 */
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (allowedRoles && !allowedRoles.includes(user.role)) {
        // User is logged in but doesn't have the right role
        const routes = { ADMIN: '/admin', SCHOOL: '/school', CANDIDATE: '/candidate' };
        router.push(routes[user.role] || '/');
      }
    }
  }, [user, loading, allowedRoles, router]);

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  if (!user) return null;
  if (allowedRoles && !allowedRoles.includes(user.role)) return null;

  return children;
}
