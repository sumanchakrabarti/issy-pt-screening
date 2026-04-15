import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { api } from '../services/api';
import type { User, AuthResponse } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { email: string; password: string; firstName: string; lastName: string; role?: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.setToken(token);
      api.get<{ user: User }>('/auth/me')
        .then(({ user }) => setUser(user))
        .catch(() => { localStorage.removeItem('token'); api.setToken(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post<AuthResponse>('/auth/login', { email, password });
    localStorage.setItem('token', res.token);
    api.setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const register = async (data: { email: string; password: string; firstName: string; lastName: string; role?: string }) => {
    const res = await api.post<AuthResponse>('/auth/register', data);
    localStorage.setItem('token', res.token);
    api.setToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    api.setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
