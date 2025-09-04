import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Heart, MessageCircle, Share, MoreHorizontal, Camera, Edit3, Settings, Grid, Bookmark, UserPlus, UserCheck, UserCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { diaryAPI, mealsAPI } from '../services/api';

interface Post {
  id: number;
  content: string;
  image_url: string | null;
  meal_data: any;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  created_at: string;
  user: {
    username: string;
    first_name: string;
    last_name: string;
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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState({ content: '', imageUrl: '', mealData: null });
  const [showEditProfile, setShowEditProfile] = useState(false);
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

  // Calculate streak from diary data
  const calculateStreak = async () => {
    try {
      setStreakLoading(true);
      
      // First, try to recalculate daily nutrition for the current month to ensure data is up to date
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;
      
      try {
        await mealsAPI.recalculateDailyNutrition(startDate, endDate);
        console.log('Daily nutrition recalculated for streak calculation');
      } catch (recalcError) {
        console.log('Could not recalculate daily nutrition, continuing with existing data');
      }
      
      // Get the current month's data to calculate streak
      const response = await diaryAPI.getMonth(year, month);
      const monthData = response.data;
      
      if (!monthData || !monthData.days) {
        setStreak(0);
        return;
      }

      // Sort days by date (newest first) and calculate consecutive days where goals were met
      const allDays = monthData.days || [];
      console.log('Total days in month data:', allDays.length);
      
      const daysWithData = allDays.filter((day: any) => day.has_data);
      console.log('Days with meal data:', daysWithData.length);
      
      const sortedDays = daysWithData
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

      console.log('Sample day data (first 3):', sortedDays.slice(0, 3));
      
      let currentStreak = 0;
      
      // EXACT SAME LOGIC AS DIARY CALENDAR - Copy the getDayStatus function
      const getDayStatus = (day: any) => {
        if (!day.has_data) return 'no-data';
        if (day.calories_met && day.protein_met) return 'both-met';  // GREEN
        if (day.calories_met || day.protein_met) return 'partial';   // YELLOW
        return 'none-met';  // RED
      };
      
      // Calculate streak from the most recent day backwards
      // Count consecutive days that are GREEN or YELLOW (same as diary calendar)
      for (const day of sortedDays) {
        const status = getDayStatus(day);
        
        console.log(`Day ${day.date}:`, {
          has_data: day.has_data,
          calories_met: day.calories_met,
          protein_met: day.protein_met,
          status: status
        });
        
        // ONLY count GREEN or YELLOW squares (ignore no-data days)
        if (status === 'both-met' || status === 'partial') {
          currentStreak++;
          const color = status === 'both-met' ? 'GREEN' : 'YELLOW';
          console.log(`✅ Day ${day.date} is ${color}, streak: ${currentStreak}`);
        } else if (status === 'none-met') {
          // Red square - streak ends
          console.log(`❌ Day ${day.date} is RED, streak ends at: ${currentStreak}`);
          break;
        } else {
          // No data - skip this day, don't break streak
          console.log(`⚪ Day ${day.date} has no data, skipping`);
        }
      }
      
      console.log('Final calculated streak:', currentStreak);
      setStreak(currentStreak);
    } catch (error) {
      console.error('Failed to calculate streak:', error);
      setStreak(0);
    } finally {
      setStreakLoading(false);
    }
  };

  useEffect(() => {
    if (profileData) {
      calculateStreak();
    }
  }, [profileData]);

  useEffect(() => {
    if (user) {
      loadProfile();
      loadPosts();
    }
  }, [user]);

  const loadProfile = async (retryCount = 0) => {
    try {
      setLoading(true);
      console.log('Loading profile for user ID:', user?.id);
      
      if (!user?.id) {
        console.error('No user ID available');
        setLoading(false);
        return;
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token available');
        setLoading(false);
        return;
      }
      
             const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://nutrition-back-jtf3.onrender.com'}/api/social/profile/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Profile response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Profile data received:', data);
        setProfileData(data);
      } else {
        const errorText = await response.text();
        console.error('Profile response error:', errorText);
        console.error('Response status:', response.status);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      
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
      const token = localStorage.getItem('token');
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
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://nutrition-back-jtf3.onrender.com'}/api/social/posts/${user?.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      
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

  const handleLike = async (postId: number) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://nutrition-back-jtf3.onrender.com'}/api/social/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
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
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleCreatePost = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://nutrition-back-jtf3.onrender.com'}/api/social/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newPost)
      });
      if (response.ok) {
        setNewPost({ content: '', imageUrl: '', mealData: null });
        setShowCreatePost(false);
        loadPosts(); // Reload posts
      }
    } catch (error) {
      console.error('Error creating post:', error);
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
    <div className="max-w-4xl mx-auto bg-white">
      {/* Profile Header */}
      <div className="border-b border-gray-200 pb-8 pt-8">
        <div className="flex items-start space-x-8 px-6">
          {/* Profile Picture */}
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold">
              {profileData.profile.profile_picture ? (
                <img 
                  src={profileData.profile.profile_picture} 
                  alt="Profile" 
                  className="w-32 h-32 rounded-full object-cover"
                />
                             ) : (
                 (profileData.user.first_name && profileData.user.first_name.charAt(0)) || 
                 (profileData.user.username && profileData.user.username.charAt(0)) || 
                 'U'
               )}
            </div>
            <button className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors">
              <Camera className="w-4 h-4" />
            </button>
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-4">
              <h1 className="text-2xl font-light">{profileData.user.username || 'User'}</h1>
              {!profileData.profile.daily_calories && !profileData.profile.weight ? (
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded font-medium transition-colors">
                  <Edit3 className="w-4 h-4 inline mr-2" />
                  Complete Profile
                </button>
              ) : (
                <button 
                  onClick={openEditProfile}
                  className="bg-gray-100 hover:bg-gray-200 px-4 py-1.5 rounded font-medium transition-colors"
                >
                  <Edit3 className="w-4 h-4 inline mr-2" />
                  Edit Profile
                </button>
              )}
              <button className="bg-gray-100 hover:bg-gray-200 p-2 rounded transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>

            {/* Stats */}
            <div className="flex space-x-8 mb-4">
              <div>
                <span className="font-semibold">{profileData.stats.posts}</span> posts
              </div>
              <div>
                <span className="font-semibold">{profileData.stats.followers}</span> followers
              </div>
              <div>
                <span className="font-semibold">{profileData.stats.following}</span> following
              </div>
            </div>

            {/* Bio and Name */}
            <div className="mb-4">
              <h2 className="font-semibold">
                {profileData.user.first_name || 'First'} {profileData.user.last_name || 'Last'}
              </h2>
              {profileData.profile.bio && (
                <p className="text-gray-700 mt-1">{profileData.profile.bio}</p>
              )}
              {!profileData.profile.bio && (
                <p className="text-gray-500 mt-1 italic">No bio yet</p>
              )}
            </div>

            {/* Streak Counter */}
            <div className="bg-orange-100 rounded-lg px-4 py-2 mb-4 border border-orange-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-orange-500">🔥</span>
                <span className="font-semibold text-gray-800">Daily Streak:</span>
                {streakLoading ? (
                  <span className="text-lg text-orange-500">Loading...</span>
                ) : streak > 0 ? (
                  <span className="text-2xl font-bold text-orange-500">{streak} days</span>
                ) : (
                  <span className="text-lg text-orange-500">Start your goal today!</span>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-600">
                  {streakLoading ? 'Calculating...' : streak > 0 
                    ? `Hit your goal for ${streak} day${streak === 1 ? '' : 's'} in a row!` 
                    : 'Build a streak!'
                  }
                </p>
              </div>
            </div>

            {/* Nutrition Profile Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">Nutrition Goals</h3>
              {!profileData.profile.daily_calories && !profileData.profile.weight ? (
                <div className="text-center py-4">
                  <p className="text-gray-500 mb-3">Complete your profile to set nutrition goals</p>
                  <button className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                    Set Goals
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Daily Calories:</span>
                    <span className="ml-2 font-medium">{profileData.profile.daily_calories || 'Not set'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Daily Protein:</span>
                    <span className="ml-2 font-medium">{profileData.profile.daily_protein || 'Not set'}g</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Current Weight:</span>
                    <span className="ml-2 font-medium">{profileData.profile.weight || 'Not set'} lbs</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Target Weight:</span>
                    <span className="ml-2 font-medium">{profileData.profile.target_weight || 'Not set'} lbs</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Post Button */}
      <div className="px-6 py-6 border-b border-gray-200">
        <button
          onClick={() => setShowCreatePost(true)}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          <Camera className="w-5 h-5" />
          <span>Create a new post</span>
        </button>
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Create Post</h3>
            <textarea
              value={newPost.content}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              placeholder="What's on your mind?"
              className="w-full border border-gray-300 rounded-lg p-3 mb-4 resize-none"
              rows={4}
            />
            <input
              type="text"
              value={newPost.imageUrl}
              onChange={(e) => setNewPost({ ...newPost, imageUrl: e.target.value })}
              placeholder="Image URL (optional)"
              className="w-full border border-gray-300 rounded-lg p-3 mb-4"
            />
            <div className="flex space-x-3">
              <button
                onClick={handleCreatePost}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Post
              </button>
              <button
                onClick={() => setShowCreatePost(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex items-center space-x-2 px-8 py-5 border-b-2 transition-colors ${
            activeTab === 'posts' 
              ? 'border-gray-900 text-gray-900' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Grid className="w-4 h-4" />
          <span>POSTS</span>
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={`flex items-center space-x-2 px-8 py-5 border-b-2 transition-colors ${
            activeTab === 'saved' 
              ? 'border-gray-900 text-gray-900' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>SAVED</span>
        </button>
      </div>

      {/* Posts Grid */}
      {activeTab === 'posts' && (
        <div className="grid grid-cols-3 gap-1 pt-6">
          {posts.map((post) => (
            <div key={post.id} className="aspect-square bg-gray-100 relative group cursor-pointer">
              {post.image_url ? (
                <img 
                  src={post.image_url} 
                  alt="Post" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <MessageCircle className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">{post.content?.substring(0, 50)}...</p>
                  </div>
                </div>
              )}
              
              {/* Hover overlay with stats */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-6">
                  <div className="flex items-center space-x-2">
                    <Heart className={`w-5 h-5 ${post.is_liked ? 'fill-current' : ''}`} />
                    <span>{post.likes_count}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="w-5 h-5" />
                    <span>{post.comments_count}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Saved Posts */}
      {activeTab === 'saved' && (
        <div className="p-12 text-center text-gray-500">
          <Bookmark className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-medium mb-2">No saved posts yet</h3>
          <p>Save photos and videos that you want to see again.</p>
        </div>
      )}

      {/* No Posts Message */}
      {activeTab === 'posts' && posts.length === 0 && (
        <div className="p-12 text-center text-gray-500">
          <Camera className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-medium mb-2">No posts yet</h3>
          <p>When you share photos and videos, they'll appear on your profile.</p>
          <button
            onClick={() => setShowCreatePost(true)}
            className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Share your first photo
          </button>
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
    </div>
  );
};

export default SocialProfile;
