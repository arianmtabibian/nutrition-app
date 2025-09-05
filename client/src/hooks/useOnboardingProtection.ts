import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Smart global protection hook - allows new users to complete onboarding once
export const useOnboardingProtection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    // Only run this protection if user is authenticated
    if (!user) return;
    
    // Mark that user has accessed the app when they reach dashboard
    // This happens AFTER they complete onboarding, not before
    if (location.pathname.startsWith('/dashboard')) {
      localStorage.setItem('hasAccessedApp', 'true');
      localStorage.setItem('lastAccess', new Date().toISOString());
    }
    
    // Note: We don't prevent onboarding access at the global level anymore
    // The Onboarding component itself handles the profile check to determine
    // if the user should be there or not
  }, [location.pathname, user, navigate]);
};
