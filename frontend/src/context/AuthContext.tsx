import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  demoLogin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const initAuth = async () => {
    setLoading(true);
    try {
      if (api.getToken()) {
        try {
          const res = await api.getMe();
          setUser(res.user);
          return;
        } catch {
          // Token expired, fallback to demo login
        }
      }
      // Auto-authenticate with demo user
      const loginRes = await api.login('demo@example.com', 'password123');
      setUser(loginRes.user);
    } catch (err) {
      console.warn('Backend auto-login notice:', err);
      // Fallback guest user if server is offline
      setUser({
        id: 'demo-user',
        name: 'Alex Demo Trader',
        email: 'demo@example.com',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const data = await api.login(email, pass);
      setUser(data.user);
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, pass: string) => {
    setLoading(true);
    try {
      const data = await api.register(name, email, pass);
      setUser(data.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  const demoLogin = async () => {
    await initAuth();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, demoLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
