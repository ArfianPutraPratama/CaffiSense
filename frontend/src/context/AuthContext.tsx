import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginApi, registerApi, logoutApi, getMeApi } from '../services/api';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  notifications_enabled?: boolean;
  weekly_report_enabled?: boolean;
  membership_type?: string;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: { email: string; password: string }) => Promise<void>;
  register: (data: { name: string; email: string; password: string; password_confirmation: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateUserSession: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('caffisense_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('caffisense_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 Hours Session

  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem('caffisense_token');
      const expiresAt = localStorage.getItem('caffisense_session_expires_at');

      // Check if session has expired
      if (expiresAt && Date.now() > parseInt(expiresAt, 10)) {
        // Session expired -> clear credentials
        localStorage.removeItem('caffisense_token');
        localStorage.removeItem('caffisense_user');
        localStorage.removeItem('caffisense_session_expires_at');
        setToken(null);
        setUser(null);
        setIsLoading(false);
        return;
      }

      if (savedToken) {
        try {
          const res = await getMeApi();
          setUser(res.user);
          localStorage.setItem('caffisense_user', JSON.stringify(res.user));
          // Refresh session expiration on valid check
          localStorage.setItem('caffisense_session_expires_at', (Date.now() + SESSION_DURATION_MS).toString());
        } catch {
          // Token invalid / expired
          localStorage.removeItem('caffisense_token');
          localStorage.removeItem('caffisense_user');
          localStorage.removeItem('caffisense_session_expires_at');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (data: { email: string; password: string }) => {
    const res = await loginApi(data);
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('caffisense_token', res.token);
    localStorage.setItem('caffisense_user', JSON.stringify(res.user));
    localStorage.setItem('caffisense_session_expires_at', (Date.now() + SESSION_DURATION_MS).toString());
    localStorage.setItem('caffisense_has_registered', 'true');
  };

  const register = async (data: { name: string; email: string; password: string; password_confirmation: string }) => {
    const res = await registerApi(data);
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('caffisense_token', res.token);
    localStorage.setItem('caffisense_user', JSON.stringify(res.user));
    localStorage.setItem('caffisense_session_expires_at', (Date.now() + SESSION_DURATION_MS).toString());
    localStorage.setItem('caffisense_has_registered', 'true');
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch {
      // Ignore network errors on logout
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('caffisense_token');
      localStorage.removeItem('caffisense_user');
      localStorage.removeItem('caffisense_session_expires_at');
    }
  };

  const updateUserSession = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('caffisense_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        updateUserSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
