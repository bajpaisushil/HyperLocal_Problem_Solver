'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { api, tokenStore } from '@/lib/api';
import type { User } from '@/lib/types';

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: 'resident' | 'committee';
  societyName?: string;
  city?: string;
}

interface AuthValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    if (!tokenStore.get()) {
      setLoading(false);
      return;
    }
    try {
      const { user } = await api<{ user: User }>('/api/auth/me');
      setUser(user);
    } catch {
      tokenStore.clear();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  const login = async (email: string, password: string) => {
    const { token, user } = await api<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      auth: false,
      body: { email, password },
    });
    tokenStore.set(token);
    setUser(user);
    return user;
  };

  const register = async (payload: RegisterPayload) => {
    const { token, user } = await api<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      auth: false,
      body: payload,
    });
    tokenStore.set(token);
    setUser(user);
    return user;
  };

  const logout = () => {
    tokenStore.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh: loadMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
