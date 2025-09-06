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
      // Prevent multiple simultaneous auth checks
      if (isCheckingAuth) {
        console.log('🔐 Auth check already in progress, skipping...');
        return;
      }
      
      setIsCheckingAuth(true);
      
      // Check if user is already logged in - DOMAIN FLEXIBLE
      const authData = getAuthData();
      const currentDomain = window.location.origin;
      
      console.log('🔐 Auth check - Domain:', currentDomain);
      console.log('🔐 Auth data exists:', !!authData);
      
      if (authData && hasValidAuth()) {
        console.log('🔐 Found valid auth data, verifying with backend...');
        api.defaults.headers.common['Authorization'] = `Bearer ${authData.token}`;
        
        // Add timeout to prevent hanging requests - Reduced timeout for faster startup
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        // Verify token and get user info from the auth verify endpoint
        api.get('/api/auth/verify', { signal: controller.signal })
          .then(response => {
            clearTimeout(timeoutId);
            console.log('🔐 Verify response in AuthContext:', response.data);
            if (response.data.user) {
              setUser(response.data.user);
              // ALWAYS update auth data to current domain (domain migration)
              storeAuthData(authData.token, response.data.user);
              console.log('🔐 User logged in successfully on domain:', currentDomain);
              console.log('🔐 Auth data migrated to current domain');
            }
          })
          .catch((error) => {
            clearTimeout(timeoutId);
            console.error('🔐 Error verifying user:', error);
            
            // Be more specific about what constitutes an auth failure vs network issue
            if (error.response?.status === 401 || error.response?.status === 403) {
              console.log('🔐 Token invalid, clearing auth data');
              clearAuthData();
              delete api.defaults.headers.common['Authorization'];
            } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
              console.log('🔐 Network timeout during auth verification, keeping auth data');
              // Keep user logged in during network issues
              // Try to retry once after a delay
              if (retryCount < 1) {
                console.log('🔐 Retrying auth verification in 2 seconds...');
                setTimeout(() => {
                  setRetryCount(prev => prev + 1);
                }, 2000);
              } else {
                console.log('🔐 Max retries reached, giving up auth verification');
                setLoading(false);
                setIsCheckingAuth(false);
              }
            } else if (error.response?.status >= 500) {
              console.log('🔐 Server error during auth verification, keeping auth data');
              // Server errors shouldn't log users out
            } else {
              console.log('🔐 Unknown error during auth verification:', error.message);
              // For unknown errors, keep auth data but log the issue
            }
          })
          .finally(() => {
            setLoading(false);
            setIsCheckingAuth(false);
          });
      } else {
        console.log('🔐 No valid auth data found, user not logged in');
        setLoading(false);
        setIsCheckingAuth(false);
      }
    };

    // Initial check
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
      const response = await api.post('/api/auth/login', { email, password });
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
      throw new Error(error.response?.data?.error || 'Login failed');
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
