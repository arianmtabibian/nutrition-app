import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Heart, MessageCircle, Share, MoreHorizontal, PenTool, Edit3, Settings, Grid, Bookmark, UserPlus, UserCheck, UserCircle, Image, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { diaryAPI, mealsAPI, profileAPI } from '../services/api';

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

  useEffect(() => {
    if (user && activeTab === 'liked') {
      loadLikedPosts();
    } else if (user && activeTab === 'saved') {
      loadBookmarkedPosts();
    }
  }, [user, activeTab]);

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

  const loadLikedPosts = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://nutrition-back-jtf3.onrender.com'}/api/social/profile/${user?.id}/liked-posts`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setLikedPosts(data.posts);
      }
    } catch (error) {
      console.error('Error loading liked posts:', error);
    }
  };

  const loadBookmarkedPosts = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://nutrition-back-jtf3.onrender.com'}/api/social/profile/${user?.id}/favorited-posts`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setBookmarkedPosts(data.posts);
      }
    } catch (error) {
      console.error('Error loading bookmarked posts:', error);
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

  const handleBookmark = async (postId: number) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://nutrition-back-jtf3.onrender.com'}/api/social/posts/${postId}/favorite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
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
      }
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

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://nutrition-back-jtf3.onrender.com'}/api/social/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        setNewPost({ 
          content: '', 
          imageFile: null, 
          mealData: null,
          allowComments: true,
          hideLikeCount: false
        });
        setShowCreatePost(false);
        
        // Trigger a custom event to update the feed
        window.dispatchEvent(new CustomEvent('postCreated', { detail: result }));
        
        loadPosts(); // Reload posts
      } else {
        const error = await response.json();
        console.error('Failed to create post:', error);
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200">

        {/* Profile Header */}
        <div className="border-b border-gray-200 pb-8 pt-8">
          <div className="flex items-start space-x-8 px-6">
            {/* Profile Picture */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
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
              <button className="absolute bottom-0 right-0 bg-gradient-to-r from-orange-500 to-red-500 text-white p-2 rounded-full hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-lg">
                <PenTool className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-4">
                <h1 className="text-2xl font-light">{profileData.user.username || 'User'}</h1>
                {!profileData.profile.daily_calories && !profileData.profile.weight ? (
                  <button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-4 py-1.5 rounded font-medium transition-all duration-200 shadow-md">
                    <Edit3 className="w-4 h-4 inline mr-2" />
                    Complete Profile
                  </button>
                ) : (
                  <button 
                    onClick={openEditProfile}
                    className="bg-gray-50 hover:bg-gray-100 px-4 py-1.5 rounded font-medium transition-colors border border-gray-200"
                  >
                    <Edit3 className="w-4 h-4 inline mr-2" />
                    Edit Profile
                  </button>
                )}
                <button className="bg-gray-50 hover:bg-gray-100 p-2 rounded transition-colors border border-gray-200">
                  <Settings className="w-5 h-5" />
                </button>
              </div>

              {/* Stats */}
              <div className="flex space-x-8 mb-4">
                <div>
                  <span className="font-semibold text-orange-600">{profileData.stats.posts}</span> posts
                </div>
                <div>
                  <span className="font-semibold text-orange-600">{profileData.stats.followers}</span> followers
                </div>
                <div>
                  <span className="font-semibold text-orange-600">{profileData.stats.following}</span> following
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
              <div className="bg-orange-50 rounded-lg px-4 py-2 mb-4 border border-orange-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-orange-500">🔥</span>
                  <span className="font-semibold text-gray-800">Daily Streak:</span>
                  {streakLoading ? (
                    <span className="text-lg text-orange-500">Loading...</span>
                  ) : streak > 0 ? (
                    <span className="text-2xl font-bold text-orange-500">{streak} {streak === 1 ? 'day' : 'days'}</span>
                  ) : (
                    <span className="text-lg text-orange-500">Start your goal today!</span>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600">
                    {streakLoading ? 'Calculating...' : streak > 0 
                      ? `Hit your goal for ${streak} ${streak === 1 ? 'day' : 'days'} in a row!` 
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
                    <button className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 px-4 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-md">
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
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
          >
            <PenTool className="w-5 h-5" />
            <span>Create a new post</span>
          </button>
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
          onClick={() => setActiveTab('liked')}
          className={`flex items-center space-x-2 px-8 py-5 border-b-2 transition-colors ${
            activeTab === 'liked' 
              ? 'border-gray-900 text-gray-900' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>LIKED</span>
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

      {/* Posts Feed */}
      {activeTab === 'posts' && (
        <div className="space-y-6 pt-6">
          {posts.map((post) => (
            <div key={post.id} className="border border-gray-200 rounded-lg">
              {/* Post Header */}
              <div className="flex items-center justify-between p-4 pb-3">
                <div className="flex items-center space-x-3">
                  {profileData?.profile?.profile_picture ? (
                    <img
                      src={profileData.profile.profile_picture}
                      alt={`${user?.first_name} ${user?.last_name}`}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <UserCircle className="w-6 h-6 text-gray-400" />
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
          ))}
        </div>
      )}

      {/* Liked Posts */}
      {activeTab === 'liked' && (
        <div className="space-y-6 pt-6">
          {likedPosts.map((post) => (
            <div key={post.id} className="border border-gray-200 rounded-lg">
              {/* Post Header */}
              <div className="flex items-center justify-between p-4 pb-3">
                <div className="flex items-center space-x-3">
                  {post.user.profile_picture ? (
                    <img
                      src={post.user.profile_picture}
                      alt={`${post.user.first_name} ${post.user.last_name}`}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <UserCircle className="w-6 h-6 text-gray-400" />
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
              <div className="flex items-center justify-between p-4 border-t border-gray-200">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center space-x-2 transition-colors ${
                      post.is_liked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                    }`}
                  >
                    <Heart className={`w-6 h-6 ${post.is_liked ? 'fill-current' : ''}`} />
                    {!post.hide_like_count && (
                      <span className="text-sm">{post.likes_count}</span>
                    )}
                  </button>
                  <button className="text-gray-400 hover:text-gray-600 transition-colors">
                    <MessageCircle className="w-6 h-6" />
                    <span className="text-sm ml-1">{post.comments_count}</span>
                  </button>
                  <button className="text-gray-400 hover:text-gray-600 transition-colors">
                    <Share className="w-6 h-6" />
                  </button>
                </div>
                <button
                  onClick={() => handleBookmark(post.id)}
                  className={`flex items-center space-x-2 transition-colors ${
                    post.is_bookmarked ? 'text-blue-500' : 'text-gray-400 hover:text-blue-500'
                  }`}
                >
                  <Bookmark className={`w-6 h-6 ${post.is_bookmarked ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Saved Posts */}
      {activeTab === 'saved' && (
        <div className="space-y-6 pt-6">
          {bookmarkedPosts.map((post) => (
            <div key={post.id} className="border border-gray-200 rounded-lg">
              {/* Post Header */}
              <div className="flex items-center justify-between p-4 pb-3">
                <div className="flex items-center space-x-3">
                  {post.user.profile_picture ? (
                    <img
                      src={post.user.profile_picture}
                      alt={`${post.user.first_name} ${post.user.last_name}`}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <UserCircle className="w-6 h-6 text-gray-400" />
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
              <div className="flex items-center justify-between p-4 border-t border-gray-200">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center space-x-2 transition-colors ${
                      post.is_liked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                    }`}
                  >
                    <Heart className={`w-6 h-6 ${post.is_liked ? 'fill-current' : ''}`} />
                    {!post.hide_like_count && (
                      <span className="text-sm">{post.likes_count}</span>
                    )}
                  </button>
                  <button className="text-gray-400 hover:text-gray-600 transition-colors">
                    <MessageCircle className="w-6 h-6" />
                    <span className="text-sm ml-1">{post.comments_count}</span>
                  </button>
                  <button className="text-gray-400 hover:text-gray-600 transition-colors">
                    <Share className="w-6 h-6" />
                  </button>
                </div>
                <button
                  onClick={() => handleBookmark(post.id)}
                  className={`flex items-center space-x-2 transition-colors ${
                    post.is_bookmarked ? 'text-blue-500' : 'text-gray-400 hover:text-blue-500'
                  }`}
                >
                  <Bookmark className={`w-6 h-6 ${post.is_bookmarked ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}


      {/* No Posts Message */}
      {activeTab === 'posts' && posts.length === 0 && (
        <div className="p-12 text-center text-gray-500">
          <PenTool className="w-16 h-16 mx-auto mb-4 text-gray-300" />
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

      {/* No Liked Posts Message */}
      {activeTab === 'liked' && likedPosts.length === 0 && (
        <div className="p-12 text-center text-gray-500">
          <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-medium mb-2">No liked posts yet</h3>
          <p>Posts you like will appear here.</p>
        </div>
      )}

      {/* No Saved Posts Message */}
      {activeTab === 'saved' && bookmarkedPosts.length === 0 && (
        <div className="p-12 text-center text-gray-500">
          <Bookmark className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-medium mb-2">No saved posts yet</h3>
          <p>Posts you save will appear here.</p>
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
