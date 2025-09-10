import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { profileAPI } from '../services/api';
import LoadingSpinner from './ui/LoadingSpinner';
import { hasCompletedOnboardingFromProfile } from '../utils/onboardingUtils';

interface OnboardingGuardProps {
  children: React.ReactNode;
  requireOnboarding?: boolean; // true = must have completed onboarding, false = must NOT have completed
}

const OnboardingGuard: React.FC<OnboardingGuardProps> = ({ children, requireOnboarding = true }) => {
  const [loading, setLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        console.log('🔍 OnboardingGuard: Checking onboarding status...');
        console.log('🔍 OnboardingGuard: requireOnboarding =', requireOnboarding);
        
        const response = await profileAPI.get();
        console.log('🔍 OnboardingGuard: Full API response:', response.data);
        
        // Check if user has daily_calories set (key onboarding field)
        const profile = response.data.profile;
        const hasCompletedOnboardingFromAPI = response.data.hasCompletedOnboarding;
        
        // Use utility function for consistent onboarding completion check
        const completed = hasCompletedOnboardingFromProfile(profile);
        
        console.log('🔍 OnboardingGuard: Profile object:', profile);
        console.log('🔍 OnboardingGuard: daily_calories value:', profile?.daily_calories);
        console.log('🔍 OnboardingGuard: daily_protein value:', profile?.daily_protein);
        console.log('🔍 OnboardingGuard: hasCompletedOnboarding from API:', hasCompletedOnboardingFromAPI);
        console.log('🔍 OnboardingGuard: Calculated completed:', completed);
        console.log('🔍 OnboardingGuard: Final decision - Has completed onboarding:', completed);
        
        setHasCompletedOnboarding(completed);
        setError(null);
      } catch (error: any) {
        console.error('🔍 OnboardingGuard: Error checking onboarding status:', error);
        console.error('🔍 OnboardingGuard: Error response:', error.response);
        
        if (error?.response?.status === 404) {
          // No profile exists = hasn't completed onboarding
          console.log('🔍 OnboardingGuard: No profile found (404) = not completed');
          setHasCompletedOnboarding(false);
        } else {
          // For other errors, assume they haven't completed onboarding to be safe
          console.log('🔍 OnboardingGuard: Error occurred, assuming not completed');
          setHasCompletedOnboarding(false);
          setError('Unable to verify onboarding status');
        }
      } finally {
        setLoading(false);
      }
    };

    checkOnboardingStatus();
  }, [requireOnboarding]);

  if (loading) {
    return <LoadingSpinner />;
  }

  // If we require onboarding to be completed but it's not
  if (requireOnboarding && !hasCompletedOnboarding) {
    console.log('🚫 OnboardingGuard: REDIRECT DECISION - Need onboarding completed but it is not');
    console.log('🚫 OnboardingGuard: requireOnboarding =', requireOnboarding, 'hasCompletedOnboarding =', hasCompletedOnboarding);
    console.log('🚫 OnboardingGuard: Redirecting to /onboarding');
    return <Navigate to="/onboarding" replace />;
  }

  // If we require onboarding to NOT be completed but it is
  if (!requireOnboarding && hasCompletedOnboarding) {
    console.log('🚫 OnboardingGuard: REDIRECT DECISION - Onboarding should not be completed but it is');
    console.log('🚫 OnboardingGuard: requireOnboarding =', requireOnboarding, 'hasCompletedOnboarding =', hasCompletedOnboarding);
    console.log('🚫 OnboardingGuard: Redirecting to /dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  // Show error if there was one, but still allow access
  if (error) {
    console.warn('⚠️ OnboardingGuard: Proceeding despite error:', error);
  }

  console.log('✅ OnboardingGuard: Access granted');
  return <>{children}</>;
};

export default OnboardingGuard;
