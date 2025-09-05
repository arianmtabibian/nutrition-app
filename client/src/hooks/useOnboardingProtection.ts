import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Global protection hook to prevent any navigation to onboarding for existing users
export const useOnboardingProtection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    // Only run this protection if user is authenticated
    if (!user) return;

    // Check if user is trying to access onboarding
    if (location.pathname === '/onboarding') {
      const hasAccessedApp = localStorage.getItem('hasAccessedApp');
      
      if (hasAccessedApp === 'true') {
        console.log('Global navigation guard: Preventing onboarding access for existing user');
        navigate('/dashboard', { replace: true });
        return;
      }
    }
    
    // Mark that user has accessed the app (for future protection)
    if (location.pathname.startsWith('/dashboard')) {
      localStorage.setItem('hasAccessedApp', 'true');
      localStorage.setItem('lastAccess', new Date().toISOString());
    }
  }, [location.pathname, user, navigate]);
};
