import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, login as apiLogin, logout as apiLogout } from '../api/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);   // null = unknown, false = anon, object = logged in
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then(u => setUser(u))
      .catch(() => setUser(false))
      .finally(() => setLoading(false));
  }, []);

  async function login(username, password) {
    const u = await apiLogin(username, password);
    setUser(u);
    return u;
  }

  async function logout() {
    await apiLogout();
    setUser(false);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
