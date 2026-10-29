import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../lib/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleExpired = () => {
      setUser(null);
      setToken(null);
      setLoading(false);
    };
    window.addEventListener('auth:expired', handleExpired);
    const storedToken = window.localStorage.getItem('token');
    if (!storedToken) {
      setLoading(false);
      return () => window.removeEventListener('auth:expired', handleExpired);
    }
    if (!token) {
      setToken(storedToken);
      return () => window.removeEventListener('auth:expired', handleExpired);
    }
    setLoading(true);
    authAPI.getProfile()
      .then((response) => setUser(response.data.user || response.data))
      .catch(() => {
        window.localStorage.removeItem('token');
        setToken(null);
      })
      .finally(() => setLoading(false));
  return () => window.removeEventListener('auth:expired', handleExpired);
  }, [token]);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    if (typeof window !== 'undefined') window.localStorage.setItem('token', authToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    if (typeof window !== 'undefined') window.localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);