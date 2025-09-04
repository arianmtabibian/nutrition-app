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

  useEffect(() => {
    // Check if user is already logged in using the new persistence system
    const authData = getAuthData();
    const currentDomain = window.location.origin;
    
    console.log('Auth check - Domain:', currentDomain);
    console.log('Auth data exists:', !!authData);
    
    if (authData && hasValidAuth()) {
      console.log('Found valid auth data, verifying with backend...');
      api.defaults.headers.common['Authorization'] = `Bearer ${authData.token}`;
      
      // Verify token and get user info from the auth verify endpoint
      api.get('/api/auth/verify')
        .then(response => {
          console.log('Verify response in AuthContext:', response.data);
          if (response.data.user) {
            setUser(response.data.user);
            // Update auth data with current domain
            storeAuthData(authData.token, response.data.user);
            console.log('User logged in successfully on domain:', currentDomain);
          }
        })
        .catch((error) => {
          console.error('Error verifying user:', error);
          // Token is invalid, clear all auth data
          clearAuthData();
          delete api.defaults.headers.common['Authorization'];
          console.log('Token cleared due to verification failure');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      console.log('No valid auth data found, user not logged in');
      setLoading(false);
    }
  }, []);

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
