import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface AdminAuthContextType {
  isAuthenticated: boolean;
  login: (password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if admin is already authenticated
  useEffect(() => {
    const checkAuth = () => {
      const adminAuth = localStorage.getItem('adminAuth');
      if (adminAuth === 'true') {
        setIsAuthenticated(true);
      }
    };

    checkAuth();
  }, []);

  const login = async (password: string) => {
    try {
      // For demo purposes, using a simple password check
      // In production, use proper authentication
      if (password === import.meta.env.VITE_ADMIN_PASSWORD) {
        setIsAuthenticated(true);
        localStorage.setItem('adminAuth', 'true');
        setError(null);
      } else {
        throw new Error('Invalid password');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
      setIsAuthenticated(false);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('adminAuth');
  };

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, login, logout, error }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}