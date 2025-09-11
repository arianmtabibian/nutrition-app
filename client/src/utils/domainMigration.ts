// Domain migration utility for Vercel deployments
// This helps users stay logged in when Vercel creates new domains

export interface UserData {
  token: string;
  user: any;
  vercel_domain: string;
}

export const migrateUserData = async (): Promise<boolean> => {
  try {
    const currentDomain = window.location.origin;
    const storedDomain = localStorage.getItem('vercel_domain');
    const token = localStorage.getItem('token');
    
    console.log('🔄 Domain migration check:', {
      currentDomain,
      storedDomain,
      hasToken: !!token
    });
    
    // If no stored domain, this is first visit
    if (!storedDomain) {
      console.log('📍 First visit, setting domain:', currentDomain);
      localStorage.setItem('vercel_domain', currentDomain);
      return true;
    }
    
    // If same domain, no migration needed
    if (storedDomain === currentDomain) {
      console.log('✅ Same domain, no migration needed');
      return true;
    }
    
    // Different domain detected - attempt migration
    console.log('🔄 New Vercel domain detected, migrating user data...');
    console.log('📍 Old domain:', storedDomain);
    console.log('📍 New domain:', currentDomain);
    
    if (!token) {
      // No token to migrate
      console.log('⚠️ No token to migrate, updating domain only');
      localStorage.setItem('vercel_domain', currentDomain);
      return false;
    }
    
    // Try to validate token on the backend API
    try {
      const backendUrl = process.env.REACT_APP_API_URL || 'https://nutrition-backend-9k3a.onrender.com';
      console.log('🔍 Validating token on backend:', backendUrl);
      
      const response = await fetch(`${backendUrl}/api/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('🔍 Backend response status:', response.status);
      
      if (response.ok) {
        // Token is valid, migration successful
        console.log('✅ User data migrated successfully to new domain');
        localStorage.setItem('vercel_domain', currentDomain);
        return true;
      } else {
        // Token invalid, but don't clear everything - just clear the token
        console.log('❌ Token invalid, clearing token but preserving other data');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.setItem('vercel_domain', currentDomain);
        return false;
      }
    } catch (error) {
      // Network error, try to preserve token but update domain
      console.log('⚠️ Network error during migration, preserving token');
      localStorage.setItem('vercel_domain', currentDomain);
      return false;
    }
  } catch (error) {
    console.error('❌ Error during domain migration:', error);
    return false;
  }
};

export const clearUserData = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  // Don't clear vercel_domain as we want to track domain changes
};

export const getUserData = (): UserData | null => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  const vercel_domain = localStorage.getItem('vercel_domain');
  
  if (token && user && vercel_domain) {
    return {
      token,
      user: JSON.parse(user),
      vercel_domain
    };
  }
  
  return null;
};

export const setUserData = (token: string, user: any): void => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('vercel_domain', window.location.origin);
};
