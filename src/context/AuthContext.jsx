import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth.service';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored token on mount
    const token = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');
    const storedRole = localStorage.getItem('role');

    if (token) {
      try {
        const parsedUser = storedUser ? JSON.parse(storedUser) : null;
        if (parsedUser) {
          setUser(parsedUser);
          setAccessToken(token);
          setRole(storedRole || parsedUser?.role || null);
        }
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
        // Clear invalid data
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('role');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const data = await authService.login(email, password);
      const resolvedRole = data.role || data.user?.role;
      setAccessToken(data.accessToken);
      setUser(data.user);
      setRole(resolvedRole);

      // Store in localStorage for persistence
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      if (resolvedRole) {
        localStorage.setItem('role', resolvedRole);
      } else {
        localStorage.removeItem('role');
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed',
      };
    }
  };

  const register = async (name, email, password, role) => {
    try {
      const data = await authService.register(name, email, password, role);
      if (data?.accessToken && data?.user) {
        const resolvedRole = data.role || data.user?.role || role;
        setAccessToken(data.accessToken);
        setUser(data.user);
        setRole(resolvedRole);

        // Store in localStorage for persistence
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        if (resolvedRole) {
          localStorage.setItem('role', resolvedRole);
        } else {
          localStorage.removeItem('role');
        }

        return { success: true };
      }

      return {
        success: true,
        requiresVerification: true,
        message:
          data?.message ||
          'Registration successful. Please check your email to verify your account.',
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed',
      };
    }
  };

  const logout = () => {
    setAccessToken(null);
    setUser(null);
    setRole(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
  };

  const value = {
    user,
    role,
    accessToken,
    login,
    register,
    logout,
    isAuthenticated: !!accessToken,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

