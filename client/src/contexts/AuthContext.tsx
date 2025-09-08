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
      }, 3000); // 3 second safety net - faster access to login
      
      // Check if user is already logged in - DOMAIN FLEXIBLE
      const authData = getAuthData();
      const currentDomain = window.location.origin;
      
      console.log('🔐 Auth check - Domain:', currentDomain);
      console.log('🔐 Auth data exists:', !!authData);
      
      if (authData && hasValidAuth()) {
        console.log('🔐 Found valid auth data, verifying with backend...');
        api.defaults.headers.common['Authorization'] = `Bearer ${authData.token}`;
        
        // Skip verification if we've had recent timeouts
        const recentTimeouts = localStorage.getItem('auth_timeout_count');
        const timeoutCount = recentTimeouts ? parseInt(recentTimeouts) : 0;
        
        if (timeoutCount >= 3) {
          console.log('🔐 Skipping auth verification due to recent timeouts, proceeding to login screen');
          clearTimeout(safetyTimeout);
          setLoading(false);
          setIsCheckingAuth(false);
          return;
        }
        
        // Verify token and get user info from the auth verify endpoint
        api.get('/api/auth/verify', { 
          timeout: 10000 // Increased timeout to prevent data loss on refresh
        })
          .then(response => {
            console.log('🔐 Verify response in AuthContext:', response.data);
            if (response.data && response.data.user) {
              setUser(response.data.user);
              // ALWAYS update auth data to current domain (domain migration)
              storeAuthData(authData.token, response.data.user);
              console.log('🔐 User logged in successfully on domain:', currentDomain);
              console.log('🔐 Auth data migrated to current domain');
              
              // Reset timeout counter on successful verification
              localStorage.removeItem('auth_timeout_count');
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
              console.log('🔐 Network/timeout error during auth verification - KEEPING USER LOGGED IN');
              
              // CRITICAL FIX: Don't clear auth data on timeout - keep user logged in
              if (error.code === 'ECONNABORTED' && error.message?.includes('timeout')) {
                console.log('🔐 Timeout detected - but KEEPING auth data to prevent profile issues');
                
                // Keep the user logged in with existing auth data
                if (authData && authData.user) {
                  setUser(authData.user);
                  console.log('🔐 Using cached user data due to timeout');
                }
                
                // Increment timeout counter but don't clear auth
                const currentCount = parseInt(localStorage.getItem('auth_timeout_count') || '0');
                localStorage.setItem('auth_timeout_count', (currentCount + 1).toString());
              } else {
                // For other network errors, keep auth data and use cached user
                console.log('🔐 Network error - using cached user data');
                if (authData && authData.user) {
                  setUser(authData.user);
                }
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
