/**
 * Utility functions for managing onboarding state
 */

export const ONBOARDING_STORAGE_KEY = 'onboarding_completed';
export const ONBOARDING_DATE_KEY = 'onboarding_completed_date';

/**
 * Check if user has completed onboarding based on localStorage
 */
export const hasCompletedOnboardingLocally = (): boolean => {
  return localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true';
};

/**
 * Mark onboarding as completed in localStorage
 */
export const markOnboardingCompleted = (): void => {
  localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
  localStorage.setItem(ONBOARDING_DATE_KEY, new Date().toISOString());
};

/**
 * Clear onboarding completion status from localStorage
 */
export const clearOnboardingCompletion = (): void => {
  localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  localStorage.removeItem(ONBOARDING_DATE_KEY);
};

/**
 * Get the date when onboarding was completed
 */
export const getOnboardingCompletionDate = (): Date | null => {
  const dateStr = localStorage.getItem(ONBOARDING_DATE_KEY);
  return dateStr ? new Date(dateStr) : null;
};

/**
 * Check if user has completed onboarding based on profile data
 */
export const hasCompletedOnboardingFromProfile = (profile: any): boolean => {
  return profile && 
    profile.daily_calories !== null && 
    profile.daily_calories !== undefined && 
    profile.daily_calories > 0 &&
    profile.daily_protein !== null && 
    profile.daily_protein !== undefined && 
    profile.daily_protein > 0;
};
