// Utility for handling authentication persistence across domain changes
export interface UserData {
  token: string;
  user: any;
  domain: string;
  timestamp: number;
}

export const AUTH_STORAGE_KEY = 'nutritrack_auth_data';

/**
 * Store authentication data with domain tracking
 */
export const storeAuthData = (token: string, user: any): void => {
  const authData: UserData = {
    token,
    user,
    domain: window.location.origin,
    timestamp: Date.now()
  };
  
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('domain', window.location.origin);
  
  console.log('Auth data stored for domain:', window.location.origin);
};

/**
 * Retrieve authentication data, handling domain changes gracefully
 */
export const getAuthData = (): UserData | null => {
  try {
    const authDataStr = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!authDataStr) return null;
    
    const authData: UserData = JSON.parse(authDataStr);
    const currentDomain = window.location.origin;
    
    // If domain changed, we still try to use the token
    // The backend will validate if it's still valid
    if (authData.domain !== currentDomain) {
      console.log('Domain changed from', authData.domain, 'to', currentDomain);
      console.log('Attempting to use existing token on new domain');
    }
    
    return authData;
  } catch (error) {
    console.error('Error retrieving auth data:', error);
    return null;
  }
};

/**
 * Clear all authentication data
 */
export const clearAuthData = (): void => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('domain');
  localStorage.removeItem('local_posts'); // Clear old format
  localStorage.removeItem('nutritrack_local_posts'); // Clear new format
  console.log('All auth data cleared');
};

/**
 * Check if we have valid authentication data
 */
export const hasValidAuth = (): boolean => {
  const authData = getAuthData();
  if (!authData) return false;
  
  // Check if token is not too old (7 days)
  const tokenAge = Date.now() - authData.timestamp;
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  
  if (tokenAge > maxAge) {
    console.log('Token is too old, clearing auth data');
    clearAuthData();
    return false;
  }
  
  return true;
};
