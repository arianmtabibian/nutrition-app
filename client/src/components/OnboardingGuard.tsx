import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { profileAPI } from '../services/api';
import LoadingSpinner from './ui/LoadingSpinner';

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
        const response = await profileAPI.get();
        
        // Check if user has daily_calories set (key onboarding field)
        const profile = response.data.profile;
        const completed = profile && profile.daily_calories !== null && profile.daily_calories !== undefined;
        
        console.log('🔍 OnboardingGuard: Profile:', profile);
        console.log('🔍 OnboardingGuard: daily_calories:', profile?.daily_calories);
        console.log('🔍 OnboardingGuard: Has completed onboarding:', completed);
        
        setHasCompletedOnboarding(completed);
        setError(null);
      } catch (error: any) {
        console.error('🔍 OnboardingGuard: Error checking onboarding status:', error);
        
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
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  // If we require onboarding to be completed but it's not
  if (requireOnboarding && !hasCompletedOnboarding) {
    console.log('🚫 OnboardingGuard: Redirecting to onboarding (required but not completed)');
    return <Navigate to="/onboarding" replace />;
  }

  // If we require onboarding to NOT be completed but it is
  if (!requireOnboarding && hasCompletedOnboarding) {
    console.log('🚫 OnboardingGuard: Redirecting to dashboard (already completed)');
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
