import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, login as apiLogin, logout as apiLogout } from '../api/api.js';

const AuthContext = createContext(null);

// Manages user authentication state: session check, login, logout; wraps app with auth context
export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);   // null = unknown, false = anon, object = logged in
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then(u => setUser(u))
      .catch(() => setUser(false))
      .finally(() => setLoading(false));
  }, []);

  // Authenticate user with credentials; set user object on success, handle errors
  async function login(username, password) {
    const u = await apiLogin(username, password);
    setUser(u);
    return u;
  }

  // Clear session on server and reset user state to anonymous (false)
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

// Hook to access auth context: user, loading, login, logout functions
export function useAuth() {
  return useContext(AuthContext);
}
