import { useEffect } from 'react';

// Track user session to prevent inappropriate onboarding redirects
export const useUserSession = () => {
  useEffect(() => {
    // Mark that this user has accessed the app before
    const hasAccessedApp = localStorage.getItem('hasAccessedApp');
    if (!hasAccessedApp) {
      localStorage.setItem('hasAccessedApp', 'true');
      localStorage.setItem('firstAccess', new Date().toISOString());
    }
    
    // Update last access time
    localStorage.setItem('lastAccess', new Date().toISOString());
  }, []);

  const hasAccessedAppBefore = (): boolean => {
    return localStorage.getItem('hasAccessedApp') === 'true';
  };

  const getFirstAccessDate = (): Date | null => {
    const dateStr = localStorage.getItem('firstAccess');
    return dateStr ? new Date(dateStr) : null;
  };

  const getLastAccessDate = (): Date | null => {
    const dateStr = localStorage.getItem('lastAccess');
    return dateStr ? new Date(dateStr) : null;
  };

  return {
    hasAccessedAppBefore,
    getFirstAccessDate,
    getLastAccessDate
  };
};
