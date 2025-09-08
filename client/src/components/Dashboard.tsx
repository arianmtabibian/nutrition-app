import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUserSession } from '../hooks/useUserSession';
import { LogOut, User, Plus, BarChart3, Home, Target, PenTool, Image, X, ChevronDown, UserPlus, Settings, Utensils, Search } from 'lucide-react';
import { profileAPI, socialAPI } from '../services/api';
import Overview from './Overview';
import SocialProfile from './SocialProfile';
import Feed from './Feed';
import Inputs from './Inputs';
import Groups from './Groups';
import MealPlan from './MealPlan';

// LoadingSpinner removed - not used in this component

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // const { hasAccessedAppBefore } = useUserSession(); // Unused variable removed
  const [loading, setLoading] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [dropdownButtonRef, setDropdownButtonRef] = useState<HTMLButtonElement | null>(null);
  const [newPost, setNewPost] = useState({
    content: '',
    imageFile: null as File | null,
    allowComments: true,
    hideLikeCount: false
  });
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState('Friends'); // Default filter

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

      console.log('Sending request to socialAPI.createPost from Dashboard');
      
      // Use the centralized socialAPI instead of direct fetch
      const response = await socialAPI.createPost(formData);

      console.log('Dashboard response status:', response.status);

      if (response && (response.status === 200 || response.status === 201)) {
        const result = response.data;
        console.log('Dashboard post created successfully:', result);
        
        // Ensure the post has proper user information
        if (!result.user && user) {
          result.user = {
            id: user.id,
            username: user.username,
            first_name: user.first_name,
            last_name: user.last_name,
            profile_picture: user.profile_picture || undefined
          };
        }
        
        // Store the new post in localStorage for persistence across navigation
        const existingLocalPosts = JSON.parse(localStorage.getItem('local_posts') || '[]');
        const updatedLocalPosts = [result, ...existingLocalPosts.filter((p: any) => p.id !== result.id)];
        localStorage.setItem('local_posts', JSON.stringify(updatedLocalPosts));
        console.log('💾 Dashboard: Stored post in localStorage for persistence');
        
        setNewPost({ content: '', imageFile: null, allowComments: true, hideLikeCount: false });
        setShowNewPostModal(false);
        
        // Trigger a custom event to update the feed
        window.dispatchEvent(new CustomEvent('postCreated', { detail: result }));
        
        // Don't navigate - let the user stay on current page
        console.log('🎉 Post created successfully from Dashboard!');
      } else {
        console.error('Dashboard failed to create post. Status:', response?.status, 'Response:', response);
        alert(`Failed to create post: ${response?.status || 'Unknown error'}`);
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
    { id: 'groups', name: 'Groups', icon: User, path: '/dashboard/groups' },
    { id: 'mealplan', name: 'Meal Plan', icon: Utensils, path: '/dashboard/mealplan' },
    { id: 'profile', name: 'Profile', icon: User, path: '/dashboard/profile' },
  ];

  const getCurrentTab = () => {
    const currentPath = location.pathname;
    return tabs.find(tab => currentPath.startsWith(tab.path)) || tabs[0];
  };

  const currentTab = getCurrentTab();

  // Check if user needs onboarding (new users only) - RENDER REDEPLOY PROTECTION
  useEffect(() => {
    const checkProfileExists = async (retryCount = 0) => {
      try {
        const response = await profileAPI.get();
        if (!response.data.profile) {
          // Check if this might be a temporary issue (Render redeploy)
          const hasAccessedApp = localStorage.getItem('hasAccessedApp');
          const lastAccess = localStorage.getItem('lastAccess');
          
          if (hasAccessedApp === 'true' && lastAccess) {
            const lastAccessDate = new Date(lastAccess);
            const hoursSinceAccess = (Date.now() - lastAccessDate.getTime()) / (1000 * 60 * 60);
            
            // If user accessed recently (within 24 hours), this is likely a Render redeploy
            if (hoursSinceAccess < 24) {
              console.log('🔄 Render redeploy detected - user accessed recently, waiting for database restore...');
              
              if (retryCount < 5) {
                // Wait and retry - database might be restoring
                setTimeout(() => checkProfileExists(retryCount + 1), 2000 * (retryCount + 1));
                return;
              } else {
                console.log('⚠️ Database still not restored after retries, allowing dashboard access');
                setCheckingProfile(false);
                return;
              }
            }
          }
          
          // Truly new user - redirect to onboarding
          console.log('New user with no profile, redirecting to onboarding');
          navigate('/onboarding');
          return;
        }
        
        // User has a profile - mark them as having accessed the app
        localStorage.setItem('hasAccessedApp', 'true');
        localStorage.setItem('lastAccess', new Date().toISOString());
        console.log('✅ User has profile, allowing dashboard access');
        setCheckingProfile(false);
      } catch (error: any) {
        console.error('❌ Error checking profile:', error);
        
        // Enhanced error handling for Render redeploys
        const hasAccessedApp = localStorage.getItem('hasAccessedApp');
        
        if (error?.response?.status === 404) {
          // Check if this is a returning user experiencing Render redeploy
          if (hasAccessedApp === 'true' && retryCount < 3) {
            console.log('🔄 Returning user, 404 might be temporary (Render redeploy), retrying...');
            setTimeout(() => checkProfileExists(retryCount + 1), 3000);
            return;
          }
          console.log('Profile not found (404), redirecting to onboarding');
          navigate('/onboarding');
        } else {
          // For network/server errors, be more lenient with existing users
          if (hasAccessedApp === 'true') {
            console.log('🔄 Existing user with network error, allowing dashboard access');
            setCheckingProfile(false);
          } else if (retryCount < 2) {
            console.log('🔄 Network error, retrying profile check...');
            setTimeout(() => checkProfileExists(retryCount + 1), 2000);
          } else {
            console.log('⚠️ Network issues persist, allowing onboarding attempt');
            navigate('/onboarding');
          }
        }
      }
    };
    
    if (user) {
      checkProfileExists();
    } else {
      setCheckingProfile(false);
    }
  }, [user, navigate]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.profile-dropdown')) {
        setShowProfileDropdown(false);
      }
      // Close search when clicking outside the inline search bar
      if (showSearchDropdown && !target.closest('.inline-search-bar')) {
        setShowSearchDropdown(false);
        setSearchQuery('');
      }
    };

    if (showProfileDropdown || showSearchDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileDropdown, showSearchDropdown]);

  // Listen for meal updates to refresh sidebar data globally
  useEffect(() => {
    const handleMealUpdate = (event: any) => {
      console.log('🏠 Dashboard: Meal update event received:', event.type);
      // Force refresh of any sidebar data if needed
      // This ensures sidebar updates across all tabs
      setTimeout(() => {
        console.log('🏠 Dashboard: Dispatching sidebar refresh...');
        window.dispatchEvent(new CustomEvent('sidebarRefresh'));
      }, 100);
    };

    const handleNavigateToMeals = () => {
      navigate('/dashboard/inputs');
    };

    // Listen to various meal-related events
    window.addEventListener('mealAdded', handleMealUpdate);
    window.addEventListener('mealDataChanged', handleMealUpdate);
    window.addEventListener('mealDeleted', handleMealUpdate);
    window.addEventListener('mealUpdated', handleMealUpdate);
    window.addEventListener('navigateToMeals', handleNavigateToMeals);
    
    return () => {
      window.removeEventListener('mealAdded', handleMealUpdate);
      window.removeEventListener('mealDataChanged', handleMealUpdate);
      window.removeEventListener('mealDeleted', handleMealUpdate);
      window.removeEventListener('mealUpdated', handleMealUpdate);
      window.removeEventListener('navigateToMeals', handleNavigateToMeals);
    };
  }, [navigate]);

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
          <div className="flex items-center justify-between h-20">
            {/* Left Section: Logo + Search */}
            <div className="flex items-center space-x-6">
              <button 
                onClick={() => navigate('/dashboard/feed')}
                className="flex items-center hover:opacity-80 transition-opacity"
              >
                <div className="relative">
                  <div className="h-10 w-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                </div>
                <h1 className="ml-3 text-xl font-bold text-gray-900">
                  NutriTrack
                </h1>
              </button>
              
              {/* Inline Search Bar */}
              <div className="flex items-center">
              {showSearchDropdown ? (
                <div className="flex items-center bg-white border border-gray-300 rounded-xl shadow-lg transition-all duration-200 inline-search-bar">
                  {/* Search Filter Dropdown */}
                  <div className="relative">
                    <select
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="appearance-none bg-white hover:bg-gray-50 border-0 rounded-l-xl px-4 py-2 pr-10 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all duration-200 cursor-pointer"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: 'right 0.5rem center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '1.2em 1.2em'
                      }}
                    >
                      <option value="Friends" className="bg-white text-gray-700 py-3 px-4 hover:bg-gray-50">Friends</option>
                      <option value="Groups" className="bg-white text-gray-700 py-3 px-4 hover:bg-gray-50">Groups</option>
                    </select>
                  </div>
                  
                  {/* Search Input */}
                  <input
                    type="text"
                    placeholder={`Search ${searchFilter.toLowerCase()}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-0 border-l border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm w-64 bg-white placeholder-gray-500"
                    autoFocus
                  />
                  
                  {/* Close Button */}
                  <button
                    onClick={() => {
                      setShowSearchDropdown(false);
                      setSearchQuery('');
                    }}
                    className="p-2 hover:bg-gray-100 rounded-r-xl transition-colors border-l border-gray-300"
                  >
                    <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowSearchDropdown(true)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 border border-gray-300"
                >
                  <Search className="h-4 w-4" />
                  <span>Search</span>
                </button>
              )}
              </div>
            </div>
            
            {/* Right Section: User Info + Actions */}
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                Welcome, <span className="font-medium">{user?.first_name || 'User'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Server connected"></div>
                <span className="text-xs text-gray-500">Connected</span>
              </div>

              <button
                onClick={() => {
                  navigate('/dashboard/inputs');
                  // Trigger sidebar refresh when going to add meal
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('sidebarRefresh'));
                  }, 100);
                }}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
              >
                <Plus className="h-4 w-4" />
                <span>Meals</span>
              </button>
              <button
                onClick={() => setShowNewPostModal(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
              >
                <PenTool className="h-4 w-4" />
                <span>Post</span>
              </button>
              {/* Profile Dropdown */}
              <div className="relative profile-dropdown">
                <button
                  ref={setDropdownButtonRef}
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                    {user?.profile_picture ? (
                      <img 
                        src={user.profile_picture} 
                        alt="Profile" 
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${
                    showProfileDropdown ? 'rotate-180' : ''
                  }`} />
                </button>

              </div>
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
                  {tab.id === 'profile' ? (
                    <div className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-r from-orange-500 to-red-500">
                      {user?.profile_picture ? (
                        <img 
                          src={user.profile_picture} 
                          alt="Profile" 
                          className="w-5 h-5 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-3 h-3 text-white" />
                      )}
                    </div>
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
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
          <Route path="/inputs" element={<Inputs />} />
          <Route path="/mealplan" element={<MealPlan />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/profile" element={<SocialProfile />} />
          {/* Catch-all route for any invalid dashboard paths */}
          <Route path="*" element={<Navigate to="/dashboard/feed" replace />} />
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

      {/* Profile Dropdown Portal - Renders outside normal DOM hierarchy */}
      {showProfileDropdown && dropdownButtonRef && createPortal(
        <div 
          className="profile-dropdown"
          style={{
            position: 'fixed',
            top: `${dropdownButtonRef.getBoundingClientRect().bottom + 8}px`,
            right: `${window.innerWidth - dropdownButtonRef.getBoundingClientRect().right}px`,
            zIndex: 999999,
            width: '192px',
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
            border: '1px solid rgb(229, 231, 235)',
            padding: '0.25rem 0'
          }}
        >
          <button
            onClick={() => {
              setShowProfileDropdown(false);
              // TODO: Navigate to find friends page
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Find Friends</span>
          </button>
          <button
            onClick={() => {
              setShowProfileDropdown(false);
              navigate('/dashboard/profile');
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
          >
            <User className="w-4 h-4" />
            <span>My Profile</span>
          </button>
          <button
            onClick={() => {
              setShowProfileDropdown(false);
              // TODO: Navigate to settings page
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
          <div className="border-t border-gray-100 my-1"></div>
          <button
            onClick={() => {
              setShowProfileDropdown(false);
              handleLogout();
            }}
            disabled={loading}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>,
        document.body
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
