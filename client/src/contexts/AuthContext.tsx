import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
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
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const currentDomain = window.location.origin;
    const storedDomain = localStorage.getItem('domain');
    
    console.log('Token check:', token ? 'exists' : 'not found');
    console.log('Current domain:', currentDomain);
    console.log('Stored domain:', storedDomain);
    
    // If domain changed, clear all auth data
    if (storedDomain && storedDomain !== currentDomain) {
      console.log('Domain changed, clearing auth data');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('domain');
      delete api.defaults.headers.common['Authorization'];
      setLoading(false);
      return;
    }
    
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Verify token and get user info from the auth verify endpoint
      api.get('/api/auth/verify')
        .then(response => {
          console.log('Verify response in AuthContext:', response.data);
          if (response.data.user) {
            setUser(response.data.user);
            // Store current domain for future checks
            localStorage.setItem('domain', currentDomain);
            console.log('User logged in successfully');
          }
        })
        .catch((error) => {
          console.error('Error verifying user:', error);
          // Token is invalid, remove it
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('domain');
          delete api.defaults.headers.common['Authorization'];
          console.log('Token cleared due to verification failure');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      console.log('No token found, user not logged in');
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { token, user: userData } = response.data;
      
      // Store token, user data, and current domain in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('domain', window.location.origin);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser({
        id: userData.id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        username: userData.username
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  };

  const register = async (email: string, password: string, first_name: string, last_name: string, username: string) => {
    try {
      const response = await api.post('/api/auth/register', { email, password, first_name, last_name, username });
      const { token, user: userData } = response.data;
      
      // Store token, user data, and current domain in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('domain', window.location.origin);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser({
        id: userData.id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        username: userData.username
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Registration failed');
    }
  };

  const logout = () => {
    // Clear user data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('domain');
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
