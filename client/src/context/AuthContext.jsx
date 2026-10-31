import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('tm_user')) || null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Re-validate the stored token on first load.
  useEffect(() => {
    (async () => {
      const token = localStorage.getItem('tm_token');
      if (token && !user) {
        try {
          const { data } = await api.get('/auth/me');
          setUser(data);
          localStorage.setItem('tm_user', JSON.stringify(data));
        } catch {
          localStorage.removeItem('tm_token');
          localStorage.removeItem('tm_user');
        }
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveSession = (data) => {
    localStorage.setItem('tm_token', data.token);
    localStorage.setItem('tm_user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    saveSession(data);
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    saveSession(data);
  };

  const logout = () => {
    localStorage.removeItem('tm_token');
    localStorage.removeItem('tm_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
