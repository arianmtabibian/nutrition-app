import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, Calendar, Plus, BarChart3, Home, Target, PenTool, Image, X } from 'lucide-react';
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
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [newPost, setNewPost] = useState({
    content: '',
    imageFile: null as File | null,
    allowComments: true,
    hideLikeCount: false
  });

  const handleCreatePost = async () => {
    console.log('Dashboard handleCreatePost called with:', newPost);
    
    if (!newPost.content.trim()) {
      console.log('No content, returning early');
      alert('Please enter some content for your post');
      return;
    }

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('content', newPost.content);
      formData.append('allowComments', newPost.allowComments.toString());
      formData.append('hideLikeCount', newPost.hideLikeCount.toString());
      
      if (newPost.imageFile) {
        formData.append('image', newPost.imageFile);
        console.log('Added image file:', newPost.imageFile.name);
      }

      console.log('Sending request to /api/social/posts from Dashboard');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://nutrition-back-jtf3.onrender.com'}/api/social/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
          // Don't set Content-Type header - let the browser set it for FormData
        },
        body: formData
      });

      console.log('Dashboard response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Dashboard post created successfully:', result);
        setNewPost({ content: '', imageFile: null, allowComments: true, hideLikeCount: false });
        setShowNewPostModal(false);
        // Navigate to feed to see the new post
        navigate('/dashboard/feed');
        alert('Post created successfully!');
      } else {
        const errorText = await response.text();
        console.error('Dashboard failed to create post. Status:', response.status, 'Response:', errorText);
        alert(`Failed to create post: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Dashboard error creating post:', error);
      alert('Error creating post: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewPost({ ...newPost, imageFile: file });
    }
  };

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
          <div className="flex justify-between items-center h-20">
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
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
              >
                <Plus className="h-4 w-4" />
                <span>Add Meal</span>
              </button>
              <button
                onClick={() => setShowNewPostModal(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
              >
                <PenTool className="h-4 w-4" />
                <span>New Post</span>
              </button>
              <button
                onClick={handleLogout}
                disabled={loading}
                className="border-2 border-gray-300 hover:border-orange-300 text-gray-700 hover:text-orange-600 px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 hover:bg-orange-50"
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

      {/* New Post Modal */}
      {showNewPostModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-xl font-semibold text-gray-900">Create New Post</h3>
              <button
                onClick={() => setShowNewPostModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4 flex-1 overflow-y-auto">
              {/* Text Input */}
              <div>
                <textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  placeholder="What's going on?"
                  className="w-full border border-gray-300 rounded-lg p-4 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  rows={4}
                />
              </div>

              {/* Image Preview */}
              {newPost.imageFile && (
                <div className="relative">
                  <img
                    src={URL.createObjectURL(newPost.imageFile)}
                    alt="Preview"
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => setNewPost({ ...newPost, imageFile: null })}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-lg"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              {/* Upload Controls */}
              <div className="border border-gray-200 rounded-lg p-3">
                <h4 className="font-medium text-gray-900 mb-2">Add to your post</h4>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg cursor-pointer transition-colors">
                    <Image className="h-4 w-4" />
                    <span className="text-sm font-medium">Upload Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Privacy Settings */}
              <div className="border border-gray-200 rounded-lg p-3">
                <h4 className="font-medium text-gray-900 mb-3">Privacy Settings</h4>
                <div className="space-y-3">
                  {/* Allow Comments Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Allow comments</label>
                      <p className="text-xs text-gray-500">Let people comment on your post</p>
                    </div>
                    <button
                      onClick={() => setNewPost({ ...newPost, allowComments: !newPost.allowComments })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        newPost.allowComments ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          newPost.allowComments ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Hide Like Count Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Hide like count</label>
                      <p className="text-xs text-gray-500">Only you will see the total number of likes</p>
                    </div>
                    <button
                      onClick={() => setNewPost({ ...newPost, hideLikeCount: !newPost.hideLikeCount })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        newPost.hideLikeCount ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          newPost.hideLikeCount ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
              <button
                onClick={() => setShowNewPostModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  console.log('Dashboard Post button clicked', newPost);
                  handleCreatePost();
                }}
                disabled={!newPost.content.trim()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}
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
