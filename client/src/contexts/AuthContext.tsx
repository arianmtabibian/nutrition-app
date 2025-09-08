import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';
import { storeAuthData, getAuthData, clearAuthData, hasValidAuth } from '../utils/authPersistence';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
  profile_picture?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, first_name: string, last_name: string, username: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      console.log('🛡️ BULLETPROOF AUTH - NEVER CLEAR DATA');
      
      const authData = getAuthData();
      
      if (authData && authData.user) {
        console.log('✅ Using cached user data - NO SERVER VERIFICATION');
        setUser(authData.user);
        api.defaults.headers.common['Authorization'] = `Bearer ${authData.token}`;
      } else {
        console.log('❌ No cached data');
        setUser(null);
      }
      
      setLoading(false);
    };

    checkAuth();

    // Listen for logout events from API interceptor
    const handleLogoutEvent = () => {
      console.log('🔐 Logout event received from API interceptor');
      // Clear user state immediately
      setUser(null);
      setLoading(false);
      // The ProtectedRoute component will automatically redirect to /login
      // when user becomes null, using React Router properly
    };

    window.addEventListener('auth-logout', handleLogoutEvent);

    return () => {
      window.removeEventListener('auth-logout', handleLogoutEvent);
    };
  }, [retryCount]); // Add retryCount as dependency to prevent stale closures

  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 Starting login process...');
      console.log('🔐 API Base URL:', api.defaults.baseURL);
      console.log('🔐 Network status:', navigator.onLine ? 'Online' : 'Offline');
      
      // Skip health check if we've had recent timeouts to speed up login
      const recentTimeouts = localStorage.getItem('auth_timeout_count');
      const timeoutCount = recentTimeouts ? parseInt(recentTimeouts) : 0;
      
      if (timeoutCount < 2) {
        // Try to wake up the server first with a quick health check
        try {
          console.log('🔐 Checking server status...');
          await api.get('/api/health', { timeout: 3000 });
          console.log('🔐 Server is responsive');
        } catch (healthError) {
          console.warn('🔐 Server health check failed, but continuing with login:', healthError);
        }
      } else {
        console.log('🔐 Skipping health check due to recent timeouts');
      }
      
      const startTime = Date.now();
      let response;
      
      try {
        // Primary attempt with axios - adjust timeout based on recent performance
        const loginTimeout = timeoutCount >= 2 ? 10000 : 20000; // Shorter timeout if issues persist
        console.log(`🔐 Using ${loginTimeout}ms timeout for login (timeout count: ${timeoutCount})`);
        
        response = await api.post('/api/auth/login', { 
          email, 
          password 
        }, {
          timeout: loginTimeout
        });
      } catch (axiosError: any) {
        console.warn('🔐 Axios login failed:', axiosError);
        
        // Check if it's a CORS error
        if (axiosError.message?.includes('CORS') || axiosError.code === 'ERR_NETWORK') {
          throw new Error('CORS_ERROR: Unable to connect to server. Please check your internet connection and try again.');
        }
        
        // Fallback with direct fetch for other errors
        try {
          console.log('🔐 Trying direct fetch as fallback...');
          const fetchResponse = await fetch(`${api.defaults.baseURL}/api/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
            signal: AbortSignal.timeout(25000)
          });
          
          if (!fetchResponse.ok) {
            throw new Error(`HTTP ${fetchResponse.status}: ${fetchResponse.statusText}`);
          }
          
          const data = await fetchResponse.json();
          response = { data };
        } catch (fetchError: any) {
          if (fetchError.message?.includes('CORS')) {
            throw new Error('CORS_ERROR: Server is not accepting requests from this domain. Please contact support.');
          }
          throw fetchError;
        }
      }
      
      const endTime = Date.now();
      console.log(`🔐 Login request completed in ${endTime - startTime}ms`);
      
      // Reset timeout counter on successful login
      localStorage.removeItem('auth_timeout_count');
      
      const { token, user: userData } = response.data;
      
      // Store authentication data using the new persistence system
      storeAuthData(token, userData);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser({
        id: userData.id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        username: userData.username,
        profile_picture: userData.profile_picture
      });
    } catch (error: any) {
      console.error('🔐 Login error:', error);
      console.error('🔐 Error details:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        data: error.response?.data,
        timeout: error.timeout,
        config: error.config?.timeout
      });
      
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        // Try to provide more specific timeout information
        const timeoutMsg = error.config?.timeout ? 
          `Login timed out after ${error.config.timeout}ms. ` : 'Login timed out. ';
        throw new Error(timeoutMsg + 'The server might be slow to respond. Please try again in a moment.');
      } else if (error.response?.status === 401) {
        throw new Error('Invalid email or password.');
      } else if (error.response?.status === 429) {
        throw new Error('Too many login attempts. Please try again later.');
      } else if (error.response?.status >= 500) {
        throw new Error('Server error. Please try again later.');
      } else if (!navigator.onLine) {
        throw new Error('No internet connection. Please check your network.');
      } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        throw new Error('Network connection failed. Please check your internet connection and try again.');
      } else {
        throw new Error(error.response?.data?.error || error.message || 'Login failed. Please try again.');
      }
    }
  };

  const register = async (email: string, password: string, first_name: string, last_name: string, username: string) => {
    try {
      const response = await api.post('/api/auth/register', { email, password, first_name, last_name, username });
      const { token, user: userData } = response.data;
      
      // Store authentication data using the new persistence system
      storeAuthData(token, userData);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser({
        id: userData.id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        username: userData.username,
        profile_picture: userData.profile_picture
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Registration failed');
    }
  };

  const logout = () => {
    // Clear all authentication data using the new persistence system
    clearAuthData();
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
