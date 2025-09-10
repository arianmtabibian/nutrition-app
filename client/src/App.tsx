import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useOnboardingProtection } from './hooks/useOnboardingProtection';

// Test auto-deploy connection - 2025-01-05
// Second test after config fix
// Fresh project test - should auto-deploy

import Welcome from './components/Welcome';
import EnhancedRegister from './components/EnhancedRegister';
import Onboarding from './components/Onboarding';
import Login from './components/auth/Login';
import Dashboard from './components/Dashboard';
import LoadingSpinner from './components/ui/LoadingSpinner';
import OnboardingGuard from './components/OnboardingGuard';

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  // Add a small delay to prevent flash of login page during auth verification
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// OnboardingProtectedRoute removed - OnboardingGuard now handles this logic

// Public route component - for unauthenticated users only
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  // If user is authenticated, redirect to dashboard (OnboardingGuard will handle onboarding redirect)
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

// Registration route component - always accessible for new user registration
const RegistrationRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  // Allow registration even if user is authenticated (for creating new accounts)
  // The registration form will handle the case where user is already logged in
  return <>{children}</>;
};

function AppRoutes() {
  // Global protection against onboarding access for existing users
  useOnboardingProtection();
  
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/register" element={
        <RegistrationRoute>
          <EnhancedRegister />
        </RegistrationRoute>
      } />
      <Route path="/onboarding" element={
        <ProtectedRoute>
          <OnboardingGuard requireOnboarding={false}>
            <Onboarding />
          </OnboardingGuard>
        </ProtectedRoute>
      } />
      <Route path="/dashboard/*" element={
        <ProtectedRoute>
          <OnboardingGuard requireOnboarding={true}>
            <Dashboard />
          </OnboardingGuard>
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <AppRoutes />
      </div>
    </AuthProvider>
  );
}

export default App;
