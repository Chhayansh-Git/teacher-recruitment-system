'use client';
/**
 * ============================================================
 * AuthContext — Manages user authentication state globally
 * ============================================================
 *
 * WHAT IS CONTEXT?
 *   React Context lets you share data with ANY component without
 *   passing props manually through every level. Perfect for auth
 *   state (who's logged in) that many components need.
 *
 * HOW IT WORKS:
 *   1. AuthProvider wraps the entire app in layout.js
 *   2. Any component can call useAuth() to get { user, login, logout, ... }
 *   3. When user logs in/out, ALL components that use useAuth() re-render
 * ============================================================
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);           // Current user object
  const [loading, setLoading] = useState(true);      // Initial load check
  const router = useRouter();

  // On mount: try to load user from cookie (check if already logged in)
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Try refreshing the token. If it works, the user IS logged in.
      const res = await authAPI.refresh();
      // After refresh, try to get the profile to populate user data
      // We'll store user data in localStorage as a lightweight cache
      const stored = localStorage.getItem('trs_user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // Not logged in or token expired
      setUser(null);
      localStorage.removeItem('trs_user');
    } finally {
      setLoading(false);
    }
  };

  const login = useCallback(async (credentials) => {
    const res = await authAPI.login(credentials);
    
    // Handle 2FA case for Admins
    if (res.data.requires2FA) {
      return res.data; // Return early so the login page can show the OTP form
    }

    const userData = res.data.user;
    setUser(userData);
    localStorage.setItem('trs_user', JSON.stringify(userData));

    // Redirect based on role and password status
    if (res.data.requirePasswordChange) {
      router.push('/change-password');
    } else {
      const routes = { ADMIN: '/admin', SCHOOL: '/school', CANDIDATE: '/candidate' };
      router.push(routes[userData.role] || '/');
    }
    return res.data;
  }, [router]);

  const verifyAdminLogin = useCallback(async (data) => {
    const res = await authAPI.verifyAdminLogin(data);
    const userData = res.data.user;
    setUser(userData);
    localStorage.setItem('trs_user', JSON.stringify(userData));
    
    if (res.data.requirePasswordChange) {
      router.push('/change-password');
    } else {
      router.push('/admin');
    }
    return res.data;
  }, [router]);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch {
      // Even if the API call fails, clear local state
    }
    setUser(null);
    localStorage.removeItem('trs_user');
    router.push('/login');
  }, [router]);

  const updateUser = useCallback((updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('trs_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, verifyAdminLogin, logout, updateUser, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth — Hook to access auth state from any component.
 *
 * USAGE:
 *   const { user, login, logout } = useAuth();
 *   if (!user) return <LoginPage />;
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
