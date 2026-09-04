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
  const [user, setUser] = useState<User | null>({
    id: 'demo-user-alex',
    name: 'Alex Sterling',
    email: 'alex.sterling@institutional.example',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check session on mount
    const checkAuth = async () => {
      try {
        if (api.getToken()) {
          const res = await api.getMe();
          setUser(res.user);
        }
      } catch {
        // keep fallback demo user for offline presentation
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
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
    try {
      await login('demo@example.com', 'password123');
    } catch {
      setUser({
        id: 'demo-user-alex',
        name: 'Alex Sterling',
        email: 'demo@example.com',
      });
    }
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
