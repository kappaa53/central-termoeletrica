'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  AUTH_EXPIRED_EVENT,
  getMe,
  getToken,
  login as apiLogin,
  setToken,
  type RoleName,
  type User,
} from '@/app/services/api';

type AuthState = {
  user: User | null;
  // true enquanto se verifica a sessão guardada
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (...roles: RoleName[]) => boolean;
};

const AuthContext = createContext<AuthState | null>(null);

export const roleLabels: Record<RoleName, string> = {
  ADMIN: 'Administrador',
  GESTOR: 'Gestor',
  OPERADOR: 'Operador',
};

// Perfis com acesso às funções de gestão
export const MANAGEMENT_ROLES: RoleName[] = ['ADMIN', 'GESTOR'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Validar a sessão guardada ao abrir a aplicação
  useEffect(() => {
    if (!getToken()) {
      Promise.resolve().then(() => setLoading(false));
      return;
    }
    getMe()
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  // Token expirado/inválido em qualquer pedido -> terminar sessão
  useEffect(() => {
    window.addEventListener(AUTH_EXPIRED_EVENT, logout);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, logout);
  }, [logout]);

  const login = useCallback(async (username: string, password: string) => {
    const result = await apiLogin(username, password);
    setToken(result.access_token);
    setUser(result.user);
  }, []);

  const hasRole = useCallback(
    (...roles: RoleName[]) => Boolean(user && roles.includes(user.role.name)),
    [user],
  );

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}
