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
      
      // Add safety timeout to prevent app from hanging indefinitely
      const safetyTimeout = setTimeout(() => {
        console.log('🔐 Safety timeout reached - forcing app to proceed');
        setLoading(false);
        setIsCheckingAuth(false);
      }, 6000); // 6 second safety net
      
      // Check if user is already logged in - DOMAIN FLEXIBLE
      const authData = getAuthData();
      const currentDomain = window.location.origin;
      
      console.log('🔐 Auth check - Domain:', currentDomain);
      console.log('🔐 Auth data exists:', !!authData);
      
      if (authData && hasValidAuth()) {
        console.log('🔐 Found valid auth data, verifying with backend...');
        api.defaults.headers.common['Authorization'] = `Bearer ${authData.token}`;
        
        // Verify token and get user info from the auth verify endpoint
        api.get('/api/auth/verify', { 
          timeout: 5000 // Reduced to 5 second timeout for faster login access
        })
          .then(response => {
            console.log('🔐 Verify response in AuthContext:', response.data);
            if (response.data && response.data.user) {
              setUser(response.data.user);
              // ALWAYS update auth data to current domain (domain migration)
              storeAuthData(authData.token, response.data.user);
              console.log('🔐 User logged in successfully on domain:', currentDomain);
              console.log('🔐 Auth data migrated to current domain');
            } else {
              console.log('🔐 No user data in response, clearing auth');
              clearAuthData();
              delete api.defaults.headers.common['Authorization'];
            }
          })
          .catch((error) => {
            console.error('🔐 Error verifying user:', error);
            console.error('🔐 Error details:', {
              message: error.message,
              code: error.code,
              status: error.response?.status,
              data: error.response?.data
            });
            
            // Be more specific about what constitutes an auth failure vs network issue
            if (error.response?.status === 401 || error.response?.status === 403) {
              console.log('🔐 Token invalid (401/403), clearing auth data');
              clearAuthData();
              delete api.defaults.headers.common['Authorization'];
            } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout') || error.code === 'NETWORK_ERROR') {
              console.log('🔐 Network/timeout error during auth verification');
              
              // For timeout errors, don't retry - just proceed to allow login screen access
              if (error.code === 'ECONNABORTED' && error.message?.includes('timeout')) {
                console.log('🔐 Timeout detected - clearing auth data to allow fresh login');
                clearAuthData();
                delete api.defaults.headers.common['Authorization'];
              } else {
                // For other network errors, keep auth data but don't retry
                console.log('🔐 Network error - keeping auth data but proceeding');
              }
            } else if (error.response?.status >= 500) {
              console.log('🔐 Server error (5xx) during auth verification, keeping auth data');
              // Server errors shouldn't log users out
            } else if (error.name === 'CanceledError' || error.message?.includes('canceled')) {
              console.log('🔐 Request was canceled, likely due to component unmount or navigation');
              // Don't treat cancellation as an auth failure
            } else {
              console.log('🔐 Unknown error during auth verification:', error.message || 'Unknown error');
              // For unknown errors, try to keep user logged in but clear if it's clearly an auth issue
              if (error.message?.includes('unauthorized') || error.message?.includes('forbidden')) {
                clearAuthData();
                delete api.defaults.headers.common['Authorization'];
              }
            }
          })
          .finally(() => {
            clearTimeout(safetyTimeout);
            setLoading(false);
            setIsCheckingAuth(false);
          });
      } else {
        console.log('🔐 No valid auth data found, user not logged in');
        clearTimeout(safetyTimeout);
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
