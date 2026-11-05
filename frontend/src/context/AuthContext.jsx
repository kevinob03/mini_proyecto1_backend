import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, TOKEN_KEY } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [ready, setReady] = useState(false);

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    setUsuario(null);
  }, []);

  useEffect(() => {
    const unauthorized = () => setUsuario(null);
    window.addEventListener('noir:unauthorized', unauthorized);
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) { setReady(true); return () => window.removeEventListener('noir:unauthorized', unauthorized); }
    authApi.me().then(({ usuario: current }) => setUsuario(current)).catch(() => logout()).finally(() => setReady(true));
    return () => window.removeEventListener('noir:unauthorized', unauthorized);
  }, [logout]);

  const login = useCallback(async (credentials) => {
    const result = await authApi.login(credentials);
    sessionStorage.setItem(TOKEN_KEY, result.token);
    setUsuario(result.usuario);
    return result.usuario;
  }, []);

  const register = useCallback((data) => authApi.register(data), []);
  const value = useMemo(() => ({ usuario, ready, login, register, logout }), [usuario, ready, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth debe usarse dentro de AuthProvider.');
  return value;
}
