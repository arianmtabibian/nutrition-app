import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Heart, MessageCircle, Share, MoreHorizontal, PenTool, Edit3, Settings, Grid, Bookmark, UserPlus, UserCheck, UserCircle, Image, X } from 'lucide-react';
import { formatDistanceToNow, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths } from 'date-fns';
import { diaryAPI, mealsAPI, socialAPI } from '../services/api';

interface Post {
  id: number;
  content: string;
  image_url: string | null;
  meal_data: any;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  is_bookmarked: boolean;
  allow_comments?: boolean;
  hide_like_count?: boolean;
  created_at: string;
  user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    profile_picture?: string;
  };
}

interface ProfileData {
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    username: string;
  };
  profile: {
    profile_picture: string;
    bio: string;
    daily_calories: number;
    daily_protein: number;
    weight: number;
    target_weight: number;
    height: number;
    age: number;
    activity_level: string;
    gender: string;
  };
  stats: {
    posts: number;
    followers: number;
    following: number;
  };
  isFollowing: boolean;
}

const SocialProfile: React.FC = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'liked' | 'saved'>('posts');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState({ 
    content: '', 
    imageFile: null as File | null, 
    mealData: null,
    allowComments: true,
    hideLikeCount: false
  });
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followers] = useState<any[]>([]);
  const [following] = useState<any[]>([]);
  const [editProfileData, setEditProfileData] = useState({
    daily_calories: 0,
    daily_protein: 0,
    weight: 0,
    target_weight: 0,
    height: 0,
    age: 0,
    activity_level: 'moderate',
    gender: 'male',
    bio: ''
  });

  // State for streak calculation
  const [streak, setStreak] = useState(0);
  const [streakLoading, setStreakLoading] = useState(true);
  
  // State for nutrition and calendar data
  const [todayNutrition, setTodayNutrition] = useState<any>(null);
  const [currentDate] = useState(new Date());
  const [monthData, setMonthData] = useState<any>(null);
  const [nutritionLoading] = useState(true);

  // SIMPLE streak calculation - just count consecutive yellow/green squares
  const calculateStreak = async () => {
    try {
      setStreakLoading(true);
      
      // Get current month data
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      
      const response = await diaryAPI.getMonth(year, month);
      const monthData = response.data;
      
      if (!monthData || !monthData.days) {
        setStreak(0);
        return;
      }

      // Get days with data, sorted by date (newest first)
      const daysWithData = monthData.days
        .filter((day: any) => day.has_data)
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

      let streak = 0;
      
      // Count consecutive colored squares from today backwards
      for (const day of daysWithData) {
        // Simple check: yellow = one goal met, green = both goals met
        const isColored = day.calories_met || day.protein_met;
        
        if (isColored) {
          streak++;
          console.log(`Day ${day.date}: COLORED (calories: ${day.calories_met}, protein: ${day.protein_met}) - Streak: ${streak}`);
        } else {
          console.log(`Day ${day.date}: NOT colored - Streak stops at ${streak}`);
          break;
        }
      }
      
      console.log(`FINAL STREAK: ${streak}`);
      setStreak(streak);
    } catch (error) {
      console.error('Streak calculation failed:', error);
      setStreak(0);
    } finally {
      setStreakLoading(false);
    }
  };

  // Load nutrition data (same as Feed component)
  const loadNutritionData = async () => {
    try {
      // setNutritionLoading(true); // Removed - no setter available
      console.log('📊 Profile: Loading nutrition data...');
      
      if (!user?.id || !profileData) {
        console.log('📊 Profile: No user or profile data available');
        // setNutritionLoading(false); // Removed - no setter available
        return;
      }

      // Load today's nutrition using same method as Overview/Feed
      const today = new Date().toISOString().split('T')[0];
      console.log('📊 Profile: Loading meals for date:', today);
      
      const mealsResponse = await mealsAPI.getByDate(today);
      console.log('📊 Profile: Raw meals response:', mealsResponse);
      
      if (mealsResponse.data && mealsResponse.data.meals) {
        const meals = mealsResponse.data.meals || [];
        console.log('📊 Profile: Processing meals:', meals.length, 'meals found');
        
        const totalCalories = meals.reduce((sum: number, meal: any) => sum + (meal.calories || 0), 0);
        const totalProtein = meals.reduce((sum: number, meal: any) => sum + (meal.protein || 0), 0);
        const totalCarbs = meals.reduce((sum: number, meal: any) => sum + (meal.carbs || 0), 0);
        const totalFat = meals.reduce((sum: number, meal: any) => sum + (meal.fat || 0), 0);
        
        const nutritionData = {
          totalCalories: totalCalories,
          totalProtein: totalProtein,
          totalCarbs: totalCarbs,
          totalFat: totalFat,
          calorieGoal: profileData.profile?.daily_calories || 2000,
          proteinGoal: profileData.profile?.daily_protein || 150,
        };
        
        console.log('📊 Profile: Final calculated nutrition data:', nutritionData);
        setTodayNutrition(nutritionData);
      }
    } catch (error) {
      console.error('Error loading nutrition data:', error);
    } finally {
      // setNutritionLoading(false); // Removed - no setter available
    }
  };

  // Load calendar data (same as Feed component)
  const loadCalendarData = async () => {
    try {
      console.log('📅 Profile: Loading calendar data...');
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      
      const response = await diaryAPI.getMonth(year, month);
      console.log('📅 Profile: Calendar response:', response);
      
      if (response.data) {
        setMonthData(response.data);
        console.log('📅 Profile: Calendar data loaded successfully');
      }
    } catch (error) {
      console.error('Error loading calendar data:', error);
    }
  };

  useEffect(() => {
    if (profileData) {
      calculateStreak();
      loadNutritionData();
      loadCalendarData();
    }
  }, [profileData]); // Functions are stable, no need to include in deps

  // Listen for meal updates to refresh data
  useEffect(() => {
    const handleMealDataChanged = () => {
      console.log('📊 Profile: Meal data changed event received, refreshing...');
      loadNutritionData();
      loadCalendarData();
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'mealAdded' || e.key === 'mealDeleted' || e.key === 'mealUpdated') {
        console.log('📊 Profile: Storage event detected, refreshing...');
        handleMealDataChanged();
      }
    };

    // Listen for custom events (same tab)
    window.addEventListener('mealDataChanged', handleMealDataChanged);
    window.addEventListener('mealAdded', handleMealDataChanged);
    window.addEventListener('mealUpdated', handleMealDataChanged);
    window.addEventListener('mealDeleted', handleMealDataChanged);
    
    // Listen for storage events (cross-tab)
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('sidebarRefresh', handleMealDataChanged);

    return () => {
      window.removeEventListener('mealDataChanged', handleMealDataChanged);
      window.removeEventListener('mealAdded', handleMealDataChanged);
      window.removeEventListener('mealUpdated', handleMealDataChanged);
      window.removeEventListener('mealDeleted', handleMealDataChanged);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('sidebarRefresh', handleMealDataChanged);
    };
  }, [profileData]); // Functions are stable, no need to include in deps

  useEffect(() => {
    if (user) {
      loadProfile();
      loadPosts();
    }
  }, [user]); // Functions are stable, no need to include in deps

  useEffect(() => {
    if (user && activeTab === 'liked') {
      loadLikedPosts();
    } else if (user && activeTab === 'saved') {
      loadBookmarkedPosts();
    }
  }, [user, activeTab]); // Functions are stable, no need to include in deps

  const loadProfile = async (retryCount = 0) => {
    try {
      setLoading(true);
      console.log('Loading profile for user ID:', user?.id);
      
      if (!user?.id) {
        console.error('No user ID available');
        setLoading(false);
        return;
      }
      
      // Use centralized socialAPI instead of direct fetch
      const response = await socialAPI.getProfile(user.id);
      console.log('Profile response:', response);
      
      if (response && response.data) {
        console.log('Profile data received:', response.data);
        setProfileData(response.data);
      } else {
        console.error('No profile data in response');
        
        // If profile doesn't exist, create a basic one
        if (retryCount === 0) {
          console.log('Attempting to create basic profile...');
          await createBasicProfile();
          return;
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      
      // Handle specific error cases
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        if (axiosError.response?.status === 404 && retryCount === 0) {
          console.log('Profile not found (404), attempting to create basic profile...');
          await createBasicProfile();
          return;
        }
      }
      
      // Retry logic for network errors
      if (retryCount < 3 && (error instanceof Error && (error.message?.includes('Failed to fetch') || error.name === 'TypeError'))) {
        console.log(`Retrying profile load (attempt ${retryCount + 1})...`);
        setTimeout(() => loadProfile(retryCount + 1), 1000 * (retryCount + 1));
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const createBasicProfile = async () => {
    try {
      console.log('Creating basic profile for user:', user);
      
      // Create a basic profile structure
      const basicProfileData: ProfileData = {
        user: {
          id: user?.id || 0,
          email: user?.email || '',
          first_name: user?.first_name || 'User',
          last_name: user?.last_name || '',
          username: user?.username || 'user'
        },
        profile: {
          profile_picture: '',
          bio: '',
          daily_calories: 2000,
          daily_protein: 150,
          weight: 0,
          target_weight: 0,
          height: 0,
          age: 0,
          activity_level: 'moderate',
          gender: 'male'
        },
        stats: {
          posts: 0,
          followers: 0,
          following: 0
        },
        isFollowing: false
      };
      
      setProfileData(basicProfileData);
      console.log('Basic profile created successfully');
      
    } catch (error) {
      console.error('Error creating basic profile:', error);
    }
  };

  const openEditProfile = () => {
    if (profileData) {
      setEditProfileData({
        daily_calories: profileData.profile.daily_calories || 0,
        daily_protein: profileData.profile.daily_protein || 0,
        weight: profileData.profile.weight || 0,
        target_weight: profileData.profile.target_weight || 0,
        height: profileData.profile.height || 0,
        age: profileData.profile.age || 0,
        activity_level: profileData.profile.activity_level || 'moderate',
        gender: profileData.profile.gender || 'male',
        bio: profileData.profile.bio || ''
      });
      setShowEditProfile(true);
    }
  };

  const handleEditProfile = async () => {
    try {
      // Get token from proper auth system
      const authData = JSON.parse(localStorage.getItem('nutritrack_auth_data') || '{}');
      const token = authData.token || localStorage.getItem('token');
      if (!token || !user?.id) return;

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://nutrition-back-jtf3.onrender.com'}/api/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editProfileData)
      });

      if (response.ok) {
        // Reload profile data
        await loadProfile();
        setShowEditProfile(false);
        // You could add a success message here
      } else {
        console.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const loadPosts = async (retryCount = 0) => {
    try {
      if (!user?.id) {
        console.log('❌ No user ID available for loading posts');
        return;
      }
      
      console.log('📋 Loading posts for user:', user.id);
      const response = await socialAPI.getUserPosts(user.id);
      console.log('📋 Posts response:', response);
      
      if (response && response.data && response.data.posts) {
        console.log('✅ Loaded', response.data.posts.length, 'posts for profile');
        setPosts(response.data.posts);
      } else {
        console.log('⚠️ No posts data in response');
        setPosts([]);
      }
    } catch (error) {
      console.error('❌ Error loading posts:', error);
      
      // Retry logic for network errors
      if (retryCount < 3 && (error instanceof Error && (error.message?.includes('Failed to fetch') || error.name === 'TypeError'))) {
        console.log(`Retrying posts load (attempt ${retryCount + 1})...`);
        setTimeout(() => loadPosts(retryCount + 1), 1000 * (retryCount + 1));
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const loadLikedPosts = async () => {
    try {
      if (!user?.id) {
        console.log('❌ No user ID available for loading liked posts');
        return;
      }
      
      console.log('❤️ Loading liked posts for user:', user.id);
      const response = await socialAPI.getLikedPosts(user.id);
      console.log('❤️ Liked posts response:', response);
      
      if (response && response.data && response.data.posts) {
        console.log('✅ Loaded', response.data.posts.length, 'liked posts');
        setLikedPosts(response.data.posts);
      } else {
        console.log('⚠️ No liked posts data in response');
        setLikedPosts([]);
      }
    } catch (error) {
      console.error('❌ Error loading liked posts:', error);
      setLikedPosts([]);
    }
  };

  const loadBookmarkedPosts = async () => {
    try {
      if (!user?.id) {
        console.log('❌ No user ID available for loading bookmarked posts');
        return;
      }
      
      console.log('🔖 Loading bookmarked posts for user:', user.id);
      const response = await socialAPI.getBookmarkedPosts(user.id);
      console.log('🔖 Bookmarked posts response:', response);
      
      if (response && response.data && response.data.posts) {
        console.log('✅ Loaded', response.data.posts.length, 'bookmarked posts');
        setBookmarkedPosts(response.data.posts);
      } else {
        console.log('⚠️ No bookmarked posts data in response');
        setBookmarkedPosts([]);
      }
    } catch (error) {
      console.error('❌ Error loading bookmarked posts:', error);
      setBookmarkedPosts([]);
    }
  };

  const handleLike = async (postId: number) => {
    try {
      await socialAPI.likePost(postId);
      
      // Update local state
      setPosts(posts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              is_liked: !post.is_liked,
              likes_count: post.is_liked ? post.likes_count - 1 : post.likes_count + 1
            }
          : post
      ));
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleBookmark = async (postId: number) => {
    try {
      await socialAPI.bookmarkPost(postId);
      
      // Update local state in all relevant arrays
      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, is_bookmarked: !post.is_bookmarked }
          : post
      ));
      setLikedPosts(likedPosts.map(post => 
        post.id === postId 
          ? { ...post, is_bookmarked: !post.is_bookmarked }
          : post
      ));
      setBookmarkedPosts(bookmarkedPosts.map(post => 
        post.id === postId 
          ? { ...post, is_bookmarked: !post.is_bookmarked }
          : post
      ));
    } catch (error) {
      console.error('Error bookmarking post:', error);
    }
  };

  const handleCreatePost = async () => {
    try {
      const formData = new FormData();
      formData.append('content', newPost.content);
      formData.append('allowComments', newPost.allowComments.toString());
      formData.append('hideLikeCount', newPost.hideLikeCount.toString());
      
      if (newPost.imageFile) {
        formData.append('image', newPost.imageFile);
      }
      
      if (newPost.mealData) {
        formData.append('mealData', JSON.stringify(newPost.mealData));
      }

      const response = await socialAPI.createPost(formData);
      
      const result = response.data;
      console.log('New post data:', result);
      
      // Ensure the post has proper user information
      if (!result.created_at) {
        result.created_at = new Date().toISOString();
      }
      
      if (!result.user && user) {
        result.user = {
          id: user.id,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          profile_picture: user.profile_picture || undefined
        };
      }
      
      setNewPost({ 
        content: '', 
        imageFile: null, 
        mealData: null,
        allowComments: true,
        hideLikeCount: false
      });
      setShowCreatePost(false);
      
      // Store the new post in localStorage for persistence across navigation
      const existingLocalPosts = JSON.parse(localStorage.getItem('local_posts') || '[]');
      const updatedLocalPosts = [result, ...existingLocalPosts.filter((p: any) => p.id !== result.id)];
      localStorage.setItem('local_posts', JSON.stringify(updatedLocalPosts));
      console.log('💾 SocialProfile: Stored post in localStorage for persistence');
      
      // Trigger a custom event to update the feed
      window.dispatchEvent(new CustomEvent('postCreated', { detail: result }));
      
      loadPosts(); // Reload posts
    } catch (error) {
      console.error('Error creating post:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        console.error('Response error:', axiosError.response?.status, axiosError.response?.data);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
            <UserCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-medium mb-2">Profile not found</h3>
          <p className="text-gray-500 mb-4">We couldn't load your profile information.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Background Header Section */}
      <div className="relative h-64 bg-gradient-to-br from-green-400 via-blue-500 to-purple-600">
        {/* Background Image Placeholder */}
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        
        {/* Profile Picture - Centered */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 z-50">
          <div className="relative">
            <div className="w-40 h-40 rounded-full bg-white p-1 shadow-xl">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-5xl font-bold overflow-hidden">
                {profileData.profile.profile_picture ? (
                  <img 
                    src={profileData.profile.profile_picture} 
                    alt="Profile" 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  (profileData.user.first_name && profileData.user.first_name.charAt(0)) || 
                  (profileData.user.username && profileData.user.username.charAt(0)) || 
                  'U'
                )}
              </div>
            </div>
            <button className="absolute bottom-2 right-2 bg-gradient-to-r from-orange-500 to-red-500 text-white p-3 rounded-full hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-lg z-10">
              <PenTool className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Background Edit Button */}
        <button className="absolute top-4 right-4 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-700 px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 shadow-md">
          <Image className="w-4 h-4" />
          <span>Edit Background</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 pt-24 pb-8">
        {/* Profile Info Section - Compressed Layout */}
        <div className="text-center mb-4">
          {/* Name and Edit Button Row */}
          <div className="flex items-center justify-center space-x-4 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">{profileData.user.first_name} {profileData.user.last_name}</h1>
            {!profileData.profile.daily_calories && !profileData.profile.weight ? (
              <button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 shadow-md">
                <Edit3 className="w-4 h-4 inline mr-2" />
                Complete Profile
              </button>
            ) : (
              <button 
                onClick={openEditProfile}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors border border-gray-300"
              >
                <Edit3 className="w-4 h-4 inline mr-2" />
                Edit Profile
              </button>
            )}
          </div>
          
          {/* Username and Stats Row */}
          <div className="flex items-center justify-center space-x-6 mb-3">
            <p className="text-gray-600">@{profileData.user.username}</p>
            
            {/* Stats inline with username */}
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <span className="text-lg font-bold text-orange-600">{profileData.stats.posts}</span>
                <span className="text-sm text-gray-600 ml-1">Posts</span>
              </div>
              <div className="w-px h-4 bg-gray-300"></div>
              <button 
                className="text-center hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors"
                onClick={() => setShowFollowersModal(true)}
              >
                <span className="text-lg font-bold text-orange-600 hover:text-orange-700">{profileData.stats.followers}</span>
                <span className="text-sm text-gray-600 ml-1">Followers</span>
              </button>
              <div className="w-px h-4 bg-gray-300"></div>
              <button 
                className="text-center hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors"
                onClick={() => setShowFollowingModal(true)}
              >
                <span className="text-lg font-bold text-orange-600 hover:text-orange-700">{profileData.stats.following}</span>
                <span className="text-sm text-gray-600 ml-1">Following</span>
              </button>
            </div>
          </div>
          
          {/* Bio */}
          {profileData.profile.bio ? (
            <p className="text-gray-700 max-w-md mx-auto text-sm">{profileData.profile.bio}</p>
          ) : (
            <p className="text-gray-500 italic text-sm">No bio yet</p>
          )}
        </div>

        {/* Stats and Progress Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left Column - Activity & Streak */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Activity</h3>
            
            {/* Activity Level */}
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg mb-6">
              <span className="text-sm font-medium text-gray-700">Activity Level</span>
              <span className="text-lg font-bold text-gray-900 capitalize">
                {profileData.profile.activity_level || 'Not set'}
              </span>
            </div>

            {/* Daily Streak - Simplified */}
            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-6">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-3">
                  <span className="text-white text-2xl">🔥</span>
                  <span className="font-semibold text-white text-lg">Daily Streak</span>
                </div>
                {streakLoading ? (
                  <div className="text-white">Loading...</div>
                ) : streak > 0 ? (
                  <div>
                    <div className="text-4xl font-bold text-white mb-2">{streak}</div>
                    <div className="text-sm font-medium text-orange-100">
                      {streak === 1 ? 'Day' : 'Days'} Strong!
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-3xl font-bold text-white mb-2">0</div>
                    <div className="text-sm font-medium text-orange-100">Start Today!</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Middle Column - Progress Bars */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Nutrition Goals</h3>
            
            {profileData.profile.daily_calories && todayNutrition ? (
              <div className="space-y-6">
                {/* Calories Progress */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Daily Calories</span>
                    <span className="text-sm text-gray-600">
                      {todayNutrition.totalCalories} / {todayNutrition.calorieGoal} cal
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full" 
                      style={{
                        width: `${Math.min(100, Math.round((todayNutrition.totalCalories / todayNutrition.calorieGoal) * 100))}%`
                      }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {Math.round((todayNutrition.totalCalories / todayNutrition.calorieGoal) * 100)}% of daily goal
                  </div>
                </div>

                {/* Protein Progress */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Daily Protein</span>
                    <span className="text-sm text-gray-600">
                      {todayNutrition.totalProtein}g / {todayNutrition.proteinGoal}g
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full" 
                      style={{
                        width: `${Math.min(100, Math.round((todayNutrition.totalProtein / todayNutrition.proteinGoal) * 100))}%`
                      }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {Math.round((todayNutrition.totalProtein / todayNutrition.proteinGoal) * 100)}% of daily goal
                  </div>
                </div>

                {/* Weight Progress */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Weight Goal</span>
                    <span className="text-sm text-gray-600">{profileData.profile.weight} → {profileData.profile.target_weight} lbs</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-gradient-to-r from-green-500 to-teal-500 h-3 rounded-full" style={{width: '40%'}}></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">40% to target weight</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">Set up your nutrition goals to track progress</p>
                <button className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 px-4 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-md">
                  Set Goals
                </button>
              </div>
            )}
          </div>

          {/* Right Column - Mini Calendar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Activity Calendar</h3>
            
            {/* Mini Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 text-xs">
              {/* Days of week header */}
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day) => (
                <div key={day} className="text-center text-gray-500 font-medium p-1">{day}</div>
              ))}
              
              {/* Calendar days */}
              {(() => {
                const monthStart = startOfMonth(currentDate);
                const monthEnd = endOfMonth(currentDate);
                const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
                
                // Pad the beginning to align with Monday start
                const startPadding = (monthStart.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
                const paddedDays = Array(startPadding).fill(null).concat(calendarDays);
                
                // Fill to 35 days (5 weeks)
                while (paddedDays.length < 35) {
                  paddedDays.push(null);
                }
                
                return paddedDays.slice(0, 35).map((day, i) => {
                  if (!day) {
                    return <div key={i} className="aspect-square"></div>;
                  }
                  
                  const dayData = monthData?.days?.find((d: any) => 
                    d.date === format(day, 'yyyy-MM-dd')
                  );
                  
                  const hasActivity = dayData?.has_data;
                  const caloriesMet = dayData?.calories_met;
                  const proteinMet = dayData?.protein_met;
                  const isCurrentDay = isToday(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  
                  let bgColor = 'bg-gray-100 text-gray-600';
                  if (hasActivity) {
                    if (caloriesMet && proteinMet) {
                      bgColor = 'bg-orange-500 text-white'; // Both goals met
                    } else if (caloriesMet || proteinMet) {
                      bgColor = 'bg-orange-300 text-white'; // One goal met
                    } else {
                      bgColor = 'bg-orange-100 text-orange-600'; // Has data but no goals met
                    }
                  }
                  
                  if (isCurrentDay) {
                    bgColor += ' ring-2 ring-orange-400';
                  }
                  
                  return (
                    <div
                      key={i}
                      className={`aspect-square rounded flex items-center justify-center text-xs ${bgColor} ${
                        !isCurrentMonth ? 'opacity-30' : ''
                      }`}
                    >
                      {format(day, 'd')}
                    </div>
                  );
                });
              })()}
            </div>
            
            <div className="mt-4 text-xs text-gray-500">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-orange-500 rounded"></div>
                  <span>Goal met</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-gray-100 rounded border"></div>
                  <span>No activity</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout - Posts and Groups */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Posts (2 columns width) */}
          <div className="lg:col-span-2">
            {/* Posts Header with Tabs */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex space-x-6">
                <button
                  onClick={() => setActiveTab('posts')}
                  className={`text-lg font-semibold transition-colors pb-2 border-b-2 ${
                    activeTab === 'posts' 
                      ? 'text-orange-600 border-orange-600' 
                      : 'text-gray-500 border-transparent hover:text-gray-700'
                  }`}
                >
                  Posts
                </button>
                <button
                  onClick={() => setActiveTab('liked')}
                  className={`text-lg font-semibold transition-colors pb-2 border-b-2 ${
                    activeTab === 'liked' 
                      ? 'text-orange-600 border-orange-600' 
                      : 'text-gray-500 border-transparent hover:text-gray-700'
                  }`}
                >
                  Liked
                </button>
                <button
                  onClick={() => setActiveTab('saved')}
                  className={`text-lg font-semibold transition-colors pb-2 border-b-2 ${
                    activeTab === 'saved' 
                      ? 'text-orange-600 border-orange-600' 
                      : 'text-gray-500 border-transparent hover:text-gray-700'
                  }`}
                >
                  Saved
                </button>
              </div>
              <button
                onClick={() => setShowCreatePost(true)}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 shadow-md"
              >
                <PenTool className="w-4 h-4" />
                <span>New Post</span>
              </button>
            </div>
            
            {/* Posts Feed */}
            <div className="space-y-6">
              {/* Posts Tab */}
              {activeTab === 'posts' && (
                <>
                  {posts.length > 0 ? (
                    posts.map((post) => (
                  <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Post Header */}
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center space-x-3">
                        {profileData?.profile?.profile_picture ? (
                          <img
                            src={profileData.profile.profile_picture}
                            alt={`${user?.first_name} ${user?.last_name}`}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {(user?.first_name && user.first_name.charAt(0)) || 'U'}
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {user?.first_name} {user?.last_name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {new Date(post.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <MoreHorizontal className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600" />
                    </div>

                    {/* Post Content */}
                    {post.content && (
                      <div className="px-4 pb-3">
                        <p className="text-gray-900">{post.content}</p>
                      </div>
                    )}

                    {/* Post Image */}
                    {post.image_url && (
                      <div className="px-4 pb-3">
                        <img
                          src={post.image_url}
                          alt="Post content"
                          className="w-full rounded-lg object-cover max-h-96"
                        />
                      </div>
                    )}

                    {/* Post Actions */}
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => handleLike(post.id)}
                          className={`flex items-center space-x-1 transition-colors ${
                            post.is_liked ? 'text-red-600' : 'text-gray-600 hover:text-red-600'
                          }`}
                        >
                          <Heart className={`w-5 h-5 ${post.is_liked ? 'fill-current' : ''}`} />
                          {!post.hide_like_count && <span className="text-sm">{post.likes_count}</span>}
                        </button>
                        
                        {post.allow_comments && (
                          <button className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors">
                            <MessageCircle className="w-5 h-5" />
                            <span className="text-sm">{post.comments_count}</span>
                          </button>
                        )}
                        
                        <button className="flex items-center space-x-1 text-gray-600 hover:text-green-600 transition-colors">
                          <Share className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <button
                        onClick={() => handleBookmark(post.id)}
                        className={`flex items-center space-x-2 transition-colors ${
                          post.is_bookmarked ? 'text-blue-500' : 'text-gray-400 hover:text-blue-500'
                        }`}
                      >
                        <Bookmark className={`w-5 h-5 ${post.is_bookmarked ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>
                    ))
                  ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                      <PenTool className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-xl font-medium mb-2 text-gray-600">No posts yet!</h3>
                      <p className="text-gray-500 mb-4">When you share photos and videos, they'll appear here.</p>
                      <button
                        onClick={() => setShowCreatePost(true)}
                        className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 px-4 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-md"
                      >
                        Share your first post
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Liked Posts Tab */}
              {activeTab === 'liked' && (
                <>
                  {likedPosts.length > 0 ? (
                    likedPosts.map((post) => (
                      <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {/* Post content similar to above */}
                        <div className="flex items-center justify-between p-4">
                          <div className="flex items-center space-x-3">
                            {post.user.profile_picture ? (
                              <img
                                src={post.user.profile_picture}
                                alt={`${post.user.first_name} ${post.user.last_name}`}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-semibold">
                                {post.user.first_name?.charAt(0) || 'U'}
                              </div>
                            )}
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {post.user.first_name} {post.user.last_name}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {new Date(post.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                        {post.content && (
                          <div className="px-4 pb-3">
                            <p className="text-gray-900">{post.content}</p>
                          </div>
                        )}
                        {post.image_url && (
                          <div className="px-4 pb-3">
                            <img
                              src={post.image_url}
                              alt="Post content"
                              className="w-full rounded-lg object-cover max-h-96"
                            />
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                      <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-xl font-medium mb-2 text-gray-600">No liked posts yet</h3>
                      <p className="text-gray-500">Posts you like will appear here.</p>
                    </div>
                  )}
                </>
              )}

              {/* Saved Posts Tab */}
              {activeTab === 'saved' && (
                <>
                  {bookmarkedPosts.length > 0 ? (
                    bookmarkedPosts.map((post) => (
                      <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {/* Post content similar to above */}
                        <div className="flex items-center justify-between p-4">
                          <div className="flex items-center space-x-3">
                            {post.user.profile_picture ? (
                              <img
                                src={post.user.profile_picture}
                                alt={`${post.user.first_name} ${post.user.last_name}`}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-semibold">
                                {post.user.first_name?.charAt(0) || 'U'}
                              </div>
                            )}
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {post.user.first_name} {post.user.last_name}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {new Date(post.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                        {post.content && (
                          <div className="px-4 pb-3">
                            <p className="text-gray-900">{post.content}</p>
                          </div>
                        )}
                        {post.image_url && (
                          <div className="px-4 pb-3">
                            <img
                              src={post.image_url}
                              alt="Post content"
                              className="w-full rounded-lg object-cover max-h-96"
                            />
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                      <Bookmark className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-xl font-medium mb-2 text-gray-600">No saved posts yet</h3>
                      <p className="text-gray-500">Posts you save will appear here.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right Column - Groups */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Groups</h2>
              <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors border border-gray-300">
                <UserPlus className="w-4 h-4 inline mr-2" />
                Join Group
              </button>
            </div>
            
            {/* Groups List */}
            <div className="space-y-4">
              {/* Sample Groups - Replace with actual data */}
              {[
                { name: "Fitness Enthusiasts", members: 1234, image: "🏃‍♂️" },
                { name: "Healthy Recipes", members: 856, image: "🥗" },
                { name: "Weight Loss Support", members: 2341, image: "⚖️" },
                { name: "Marathon Runners", members: 567, image: "🏃‍♀️" },
              ].map((group, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white text-xl">
                      {group.image}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{group.name}</h3>
                      <p className="text-sm text-gray-500">{group.members.toLocaleString()} members</p>
                    </div>
                    <button className="bg-orange-50 hover:bg-orange-100 text-orange-600 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
                      View
                    </button>
                  </div>
                </div>
              ))}
              
              {/* No Groups Message */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                <UserPlus className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2 text-gray-600">Join Groups</h3>
                <p className="text-gray-500 mb-4">Connect with like-minded people in nutrition and fitness groups.</p>
                <button className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 px-4 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-md">
                  Explore Groups
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-xl font-semibold text-gray-900">Create New Post</h3>
              <button
                onClick={() => setShowCreatePost(false)}
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
                  className="w-full border border-gray-300 rounded-lg p-4 resize-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
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
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setNewPost({ ...newPost, imageFile: file });
                        }
                      }}
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
                onClick={() => setShowCreatePost(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  console.log('SocialProfile Post button clicked', newPost);
                  handleCreatePost();
                }}
                disabled={!newPost.content.trim()}
                className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Edit Profile</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Daily Calories</label>
                <input
                  type="number"
                  value={editProfileData.daily_calories || ''}
                  onChange={(e) => setEditProfileData(prev => ({ ...prev, daily_calories: parseFloat(e.target.value) || 0 }))}
                  className="w-full border border-gray-300 rounded-lg p-2"
                  placeholder="2000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Daily Protein (g)</label>
                <input
                  type="number"
                  value={editProfileData.daily_protein || ''}
                  onChange={(e) => setEditProfileData(prev => ({ ...prev, daily_protein: parseFloat(e.target.value) || 0 }))}
                  className="w-full border border-gray-300 rounded-lg p-2"
                  placeholder="150"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Weight (lbs)</label>
                <input
                  type="number"
                  value={editProfileData.weight || ''}
                  onChange={(e) => setEditProfileData(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
                  className="w-full border border-gray-300 rounded-lg p-2"
                  placeholder="150"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Weight (lbs)</label>
                <input
                  type="number"
                  value={editProfileData.target_weight || ''}
                  onChange={(e) => setEditProfileData(prev => ({ ...prev, target_weight: parseFloat(e.target.value) || 0 }))}
                  className="w-full border border-gray-300 rounded-lg p-2"
                  placeholder="140"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Height (inches)</label>
                <input
                  type="number"
                  value={editProfileData.height || ''}
                  onChange={(e) => setEditProfileData(prev => ({ ...prev, height: parseFloat(e.target.value) || 0 }))}
                  className="w-full border border-gray-300 rounded-lg p-2"
                  placeholder="70"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                <input
                  type="number"
                  value={editProfileData.age || ''}
                  onChange={(e) => setEditProfileData(prev => ({ ...prev, age: parseFloat(e.target.value) || 0 }))}
                  className="w-full border border-gray-300 rounded-lg p-2"
                  placeholder="25"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Activity Level</label>
                <select
                  value={editProfileData.activity_level}
                  onChange={(e) => setEditProfileData(prev => ({ ...prev, activity_level: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg p-2"
                >
                  <option value="sedentary">Sedentary</option>
                  <option value="light">Light</option>
                  <option value="moderate">Moderate</option>
                  <option value="active">Active</option>
                  <option value="very_active">Very Active</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  value={editProfileData.gender}
                  onChange={(e) => setEditProfileData(prev => ({ ...prev, gender: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg p-2"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                value={editProfileData.bio || ''}
                onChange={(e) => setEditProfileData(prev => ({ ...prev, bio: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg p-2"
                rows={3}
                placeholder="Tell us about yourself..."
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleEditProfile}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
              <button
                onClick={() => setShowEditProfile(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Followers Modal */}
      {showFollowersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Followers</h3>
              <button
                onClick={() => setShowFollowersModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {followers.length > 0 ? (
              <div className="space-y-3">
                {followers.map((follower) => (
                  <div key={follower.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {follower.first_name?.charAt(0) || follower.username?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {follower.first_name} {follower.last_name}
                      </div>
                      <div className="text-sm text-gray-500">@{follower.username}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <UserCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No followers yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Following Modal */}
      {showFollowingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Following</h3>
              <button
                onClick={() => setShowFollowingModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {following.length > 0 ? (
              <div className="space-y-3">
                {following.map((user) => (
                  <div key={user.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {user.first_name?.charAt(0) || user.username?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {user.first_name} {user.last_name}
                      </div>
                      <div className="text-sm text-gray-500">@{user.username}</div>
                    </div>
                    <button className="text-sm bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded-lg transition-colors">
                      Following
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <UserCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Not following anyone yet</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialProfile;
