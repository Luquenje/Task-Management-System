import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../apis/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already logged in on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      // Check if user is authenticated by calling /me endpoint
      // JWT token is automatically sent via HTTP-only cookie
      const response = await authAPI.getCurrentUser();
      if (response.success) {
        setUser(response.user);
      }
    } catch (err) {
      // Not authenticated or token expired
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      setError(null);
      const response = await authAPI.login(username, password);
      if (response.success) {
        // JWT token is automatically stored in HTTP-only cookie by server
        setUser(response.user);
        return { success: true, user: response.user };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      // Server clears the HTTP-only cookie
      await authAPI.logout();
      setUser(null);
      return { success: true };
    } catch (err) {
      // Even if server request fails, clear user state
      setUser(null);
      const errorMessage = err.response?.data?.error || 'Logout failed';
      return { success: false, error: errorMessage };
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    checkAuth,
    isAuthenticated: !!user,
    isAdmin: user?.user_groups?.includes('admin') || user?.username === 'admin', // Admin if has 'admin' group or is root user
    isRootAdmin: user?.username === 'admin' // Root admin has special privileges
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

