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
    
    // If no stored domain, this is first visit
    if (!storedDomain) {
      localStorage.setItem('vercel_domain', currentDomain);
      return true;
    }
    
    // If same domain, no migration needed
    if (storedDomain === currentDomain) {
      return true;
    }
    
    // Different domain detected - attempt migration
    console.log('New Vercel domain detected, migrating user data...');
    console.log('Old domain:', storedDomain);
    console.log('New domain:', currentDomain);
    
    if (!token) {
      // No token to migrate
      localStorage.setItem('vercel_domain', currentDomain);
      return false;
    }
    
    // Try to validate token on the new domain
    try {
      const response = await fetch(`${currentDomain}/api/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        // Token is valid on new domain, migration successful
        console.log('User data migrated successfully to new domain');
        localStorage.setItem('vercel_domain', currentDomain);
        return true;
      } else {
        // Token invalid on new domain, clear everything
        console.log('Token invalid on new domain, clearing user data');
        localStorage.clear();
        localStorage.setItem('vercel_domain', currentDomain);
        return false;
      }
    } catch (error) {
      // Network error, try to preserve token but update domain
      console.log('Network error during migration, preserving token');
      localStorage.setItem('vercel_domain', currentDomain);
      return false;
    }
  } catch (error) {
    console.error('Error during domain migration:', error);
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
