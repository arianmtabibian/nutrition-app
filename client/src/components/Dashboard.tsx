import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, Calendar, Plus, BarChart3, Home, Target } from 'lucide-react';
import { profileAPI } from '../services/api';
import Overview from './Overview';
import SocialProfile from './SocialProfile';
import Feed from './Feed';
import Diary from './Diary';
import Inputs from './Inputs';
import Groups from './Groups';

import LoadingSpinner from './ui/LoadingSpinner';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);

  const handleLogout = async () => {
    setLoading(true);
    try {
      logout();
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'feed', name: 'Feed', icon: Home, path: '/dashboard/feed' },
    { id: 'overview', name: 'Overview', icon: BarChart3, path: '/dashboard/overview' },
    { id: 'diary', name: 'Diary', icon: Calendar, path: '/dashboard/diary' },
    { id: 'groups', name: 'Groups', icon: User, path: '/dashboard/groups' },
    { id: 'profile', name: 'Profile', icon: User, path: '/dashboard/profile' },
  ];

  const getCurrentTab = () => {
    const currentPath = location.pathname;
    return tabs.find(tab => currentPath.startsWith(tab.path)) || tabs[0];
  };

  const currentTab = getCurrentTab();

  // Check if user has any profile at all - if not, redirect to onboarding
  useEffect(() => {
    const checkProfileExists = async () => {
      try {
        const response = await profileAPI.get();
        if (!response.data.profile) {
          // No profile exists, redirect to onboarding
          navigate('/onboarding');
          return;
        }
        
        // User has a profile, they can access the dashboard
        setCheckingProfile(false);
      } catch (error) {
        // Profile doesn't exist or error occurred, redirect to onboarding
        navigate('/onboarding');
      }
    };
    
    if (user) {
      checkProfileExists();
    }
  }, [user, navigate]);

  if (checkingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-orange-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-18">
            <div className="flex items-center">
              <div className="relative">
                <div className="h-10 w-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Target className="w-5 h-5 text-white" />
                </div>
              </div>
              <h1 className="ml-3 text-xl font-bold text-gray-900">
                NutriTrack
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                Welcome, <span className="font-medium">{user?.first_name || 'User'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Server connected"></div>
                <span className="text-xs text-gray-500">Connected</span>
              </div>

              <button
                onClick={() => navigate('/dashboard/inputs')}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Plus className="h-4 w-4" />
                <span>Add Meal</span>
              </button>
              <button
                onClick={handleLogout}
                disabled={loading}
                className="border-2 border-gray-300 hover:border-orange-300 text-gray-700 hover:text-orange-600 px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 hover:bg-orange-50"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-orange-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab.id === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => navigate(tab.path)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-3 font-semibold text-sm transition-all duration-200 transform hover:-translate-y-0.5 ${
                    isActive
                      ? 'border-orange-500 text-orange-600 shadow-sm'
                      : 'border-transparent text-gray-500 hover:text-orange-600 hover:border-orange-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard/feed" replace />} />
          <Route path="/overview" element={<Overview />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/diary" element={<Diary />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/profile" element={<SocialProfile />} />
          <Route path="/inputs" element={<Inputs />} />

        </Routes>
      </main>
    </div>
  );
};

// Helper component for navigation
const Navigate: React.FC<{ to: string; replace?: boolean }> = ({ to, replace }) => {
  const navigate = useNavigate();
  React.useEffect(() => {
    navigate(to, { replace });
  }, [navigate, to, replace]);
  return null;
};

export default Dashboard;
