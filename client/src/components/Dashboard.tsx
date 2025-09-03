import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, Calendar, Plus, BarChart3, Home } from 'lucide-react';
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

  // Check if user has completed profile setup - onboarding is mandatory
  useEffect(() => {
    const checkProfileCompletion = async () => {
      try {
        const response = await profileAPI.get();
        const profile = response.data.profile;
        
        // Check if user has completed ALL required onboarding fields
        if (!profile || 
            !profile.weight || 
            !profile.height || 
            !profile.age || 
            !profile.activity_level || 
            !profile.gender ||
            !profile.daily_calories ||
            !profile.daily_protein) {
          // Profile incomplete, redirect to onboarding - no skipping allowed
          navigate('/onboarding');
          return;
        }
        
        setCheckingProfile(false);
      } catch (error) {
        // Profile doesn't exist or error occurred, redirect to onboarding
        navigate('/onboarding');
      }
    };
    
    if (user) {
      checkProfileCompletion();
    }
  }, [user, navigate]);

  if (checkingProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">N</span>
              </div>
              <h1 className="ml-3 text-xl font-semibold text-gray-900">
                Nutrition Tracker
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
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Input Meal</span>
              </button>
              <button
                onClick={handleLogout}
                disabled={loading}
                className="btn-secondary flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab.id === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => navigate(tab.path)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    isActive
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
