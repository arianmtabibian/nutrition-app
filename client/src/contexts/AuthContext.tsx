import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';
import { storeAuthData, getAuthData, clearAuthData } from '../utils/authPersistence';
import { clearOnboardingCompletion } from '../utils/onboardingUtils';

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
  // Unused state variables removed

  useEffect(() => {
    const checkAuth = () => {
      console.log('🛡️ BULLETPROOF AUTH - NEVER CLEAR DATA');
      
      const authData = getAuthData();
      
      if (authData && authData.user) {
        console.log('✅ Using cached user data - NO SERVER VERIFICATION');
        // Ensure consistent field names for cached user data
        const normalizedUser = {
          ...authData.user,
          first_name: authData.user.first_name || authData.user.firstName,
          last_name: authData.user.last_name || authData.user.lastName
        };
        setUser(normalizedUser);
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
      
      // Clear onboarding completion flag so user can go through onboarding again if they create a new account
      clearOnboardingCompletion();
      
      // The ProtectedRoute component will automatically redirect to /login
      // when user becomes null, using React Router properly
    };

    window.addEventListener('auth-logout', handleLogoutEvent);

    return () => {
      window.removeEventListener('auth-logout', handleLogoutEvent);
    };
  }, []); // No dependencies needed for simple auth check

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
        first_name: userData.first_name || userData.firstName,
        last_name: userData.last_name || userData.lastName,
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
      console.log('🔐 Starting registration process for:', email);
      console.log('🔐 Registration data:', { email, first_name, last_name, username });
      console.log('🔐 API Base URL:', api.defaults.baseURL);
      console.log('🔐 Network status:', navigator.onLine ? 'Online' : 'Offline');
      
      // Implement retry mechanism with exponential backoff
      const maxRetries = 3;
      let lastError: any = null;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`🔐 Registration attempt ${attempt}/${maxRetries}...`);
          
          const startTime = Date.now();
          let response;
          
          // Try axios first with progressive timeout
          const timeout = Math.min(10000 + (attempt * 5000), 25000); // 10s, 15s, 20s, max 25s
          console.log(`🔐 Using ${timeout}ms timeout for attempt ${attempt}`);
          
          try {
            response = await api.post('/api/auth/register', { 
              email, 
              password, 
              first_name, 
              last_name, 
              username 
            }, {
              timeout: timeout
            });
          } catch (axiosError: any) {
            console.warn(`🔐 Axios registration attempt ${attempt} failed:`, axiosError.message);
            
            // Check if it's a CORS error
            if (axiosError.message?.includes('CORS') || axiosError.code === 'ERR_NETWORK') {
              throw new Error('CORS_ERROR: Unable to connect to server. Please check your internet connection and try again.');
            }
            
            // Fallback with direct fetch for other errors
            console.log(`🔐 Trying direct fetch fallback for attempt ${attempt}...`);
            const fetchResponse = await fetch(`${api.defaults.baseURL}/api/auth/register`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email, password, first_name, last_name, username }),
              signal: AbortSignal.timeout(timeout + 5000) // Add 5s buffer for fetch
            });
            
            if (!fetchResponse.ok) {
              const errorText = await fetchResponse.text();
              let errorData;
              try {
                errorData = JSON.parse(errorText);
              } catch {
                errorData = { error: errorText };
              }
              throw new Error(`HTTP ${fetchResponse.status}: ${errorData.error || fetchResponse.statusText}`);
            }
            
            const data = await fetchResponse.json();
            response = { data };
          }
          
          const endTime = Date.now();
          console.log(`🔐 Registration attempt ${attempt} completed in ${endTime - startTime}ms`);
          
          // If we get here, registration was successful
          console.log('🔐 Registration response:', response.data);
          
          const { token, user: userData } = response.data;
          
          if (!token || !userData) {
            console.error('🔐 Invalid registration response - missing token or user data');
            throw new Error('Invalid response from server');
          }
          
          console.log('🔐 Storing auth data for new user:', userData);
          
          // Store authentication data using the new persistence system
          storeAuthData(token, userData);
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          setUser({
            id: userData.id,
            email: userData.email,
            first_name: userData.first_name || userData.firstName,
            last_name: userData.last_name || userData.lastName,
            username: userData.username,
            profile_picture: userData.profile_picture
          });
          
          console.log('🔐 Registration successful! User logged in:', userData.email);
          return; // Success - exit the retry loop
          
        } catch (attemptError: any) {
          lastError = attemptError;
          console.error(`🔐 Registration attempt ${attempt} failed:`, attemptError.message);
          
          // Don't retry for certain errors
          if (attemptError.message?.includes('CORS_ERROR') || 
              attemptError.response?.status === 400 || 
              attemptError.response?.status === 409) {
            throw attemptError; // Don't retry for client errors
          }
          
          // If this is the last attempt, throw the error
          if (attempt === maxRetries) {
            break;
          }
          
          // Wait before retrying (exponential backoff)
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // 1s, 2s, 4s, max 5s
          console.log(`🔐 Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      // If we get here, all retries failed
      throw lastError;
      
    } catch (error: any) {
      console.error('🔐 Registration error after all retries:', error);
      console.error('🔐 Error details:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        data: error.response?.data,
        timeout: error.timeout,
        config: error.config?.timeout
      });
      
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout') || error.message?.includes('timed out')) {
        throw new Error('Registration timed out after multiple attempts. The server might be slow to respond. Please try again in a moment.');
      } else if (error.response?.status === 400) {
        throw new Error(error.response?.data?.error || 'Invalid registration data. Please check your information.');
      } else if (error.response?.status === 409) {
        throw new Error('An account with this email already exists. Please try logging in instead.');
      } else if (error.response?.status >= 500) {
        throw new Error('Server error. Please try again later.');
      } else if (!navigator.onLine) {
        throw new Error('No internet connection. Please check your network.');
      } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        throw new Error('Network connection failed. Please check your internet connection and try again.');
      } else if (error.message?.includes('CORS_ERROR')) {
        throw new Error('Server connection issue. Please check your internet connection and try again.');
      } else {
        throw new Error(error.response?.data?.error || error.message || 'Registration failed. Please try again.');
      }
    }
  };

  const logout = () => {
    // Clear all authentication data using the new persistence system
    clearAuthData();
    delete api.defaults.headers.common['Authorization'];
    
    // Clear onboarding completion flag so user can go through onboarding again if they create a new account
    clearOnboardingCompletion();
    
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
