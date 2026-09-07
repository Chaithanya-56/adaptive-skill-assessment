import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api, { AUTH_TOKEN_KEY } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem(AUTH_TOKEN_KEY));
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = async () => {
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);

    if (!storedToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return false;
    }

    try {
      const response = await api.get('/auth/me');
      const account = response?.data?.data?.user || response?.data?.user || null;

      setUser(account);
      setToken(storedToken);
      return !!account;
    } catch (error) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      setUser(null);
      setToken(null);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  const login = async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    const payload = response?.data?.data || {};
    const nextToken = payload.token;
    const nextUser = payload.user;

    if (nextToken) {
      localStorage.setItem(AUTH_TOKEN_KEY, nextToken);
      setToken(nextToken);
      setUser(nextUser);
      return nextUser;
    }

    return null;
  };

  const register = async (payload) => {
    const response = await api.post('/auth/register', payload);
    const data = response?.data?.data || {};
    const nextToken = data.token;
    const nextUser = data.user;

    if (nextToken) {
      localStorage.setItem(AUTH_TOKEN_KEY, nextToken);
      setToken(nextToken);
      setUser(nextUser);
      return nextUser;
    }

    return nextUser || null;
  };

  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setUser(null);
    setToken(null);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      refreshSession,
    }),
    [user, token, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
