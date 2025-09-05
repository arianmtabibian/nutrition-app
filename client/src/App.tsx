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

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

// Smart protection for onboarding - only blocks users who have completed onboarding
const OnboardingProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Allow new users to access onboarding, but prevent users who have completed it from returning
  // The actual profile check happens inside the Onboarding component for proper async handling
  return <>{children}</>;
};

// Public route component (redirects if already logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return user ? <Navigate to="/dashboard" replace /> : <>{children}</>;
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
        <PublicRoute>
          <EnhancedRegister />
        </PublicRoute>
      } />
      <Route path="/onboarding" element={
        <OnboardingProtectedRoute>
          <Onboarding />
        </OnboardingProtectedRoute>
      } />
      <Route path="/dashboard/*" element={
        <ProtectedRoute>
          <Dashboard />
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
