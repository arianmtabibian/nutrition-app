import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Heart, MessageCircle, Share, MoreHorizontal, PenTool, Bookmark, Image, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDistanceToNow, format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, addMonths, subMonths } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { diaryAPI, mealsAPI, profileAPI, socialAPI } from '../services/api';
import { usePostPersistence } from '../hooks/usePostPersistence';

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

interface Comment {
  id: number;
  content: string;
  created_at: string;
  user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    profile_picture?: string;
  };
}

const Feed: React.FC = () => {
  const { user } = useAuth();
  // const navigate = useNavigate(); // Unused
  const [posts, setPosts] = useState<Post[]>([]);
  const { localPosts, savePostLocally, mergeWithServerPosts, clearLocalPosts } = usePostPersistence();
  const [loading, setLoading] = useState(true);
  const [creatingPost, setCreatingPost] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState({ 
    content: '', 
    imageFile: null as File | null, 
    mealData: null,
    allowComments: true,
    hideLikeCount: false
  });
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const [comments, setComments] = useState<{ [postId: number]: Comment[] }>({});
  const [newComments, setNewComments] = useState<{ [postId: number]: string }>({});
  const [loadingComments, setLoadingComments] = useState<Set<number>>(new Set());
  
  // Sidebar data states
  const [profileData, setProfileData] = useState<any>(null);
  const [todayNutrition, setTodayNutrition] = useState<any>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthData, setMonthData] = useState<any>(null);
  const [sidebarLoading, setSidebarLoading] = useState(true);
  
  // Follow people search states
  const [showFollowSearch, setShowFollowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const formatPostDate = (dateString: string) => {
    // Handle invalid or missing date strings
    if (!dateString) {
      return 'Just now';
    }

    const postDate = new Date(dateString);
    
    // Check if the date is valid
    if (isNaN(postDate.getTime())) {
      console.warn('Invalid date string:', dateString);
      return 'Just now';
    }

    const today = new Date();
    const isToday = postDate.toDateString() === today.toDateString();
    
    if (isToday) {
      return `Today at ${postDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      })}`;
    } else {
      try {
        return formatDistanceToNow(postDate, { addSuffix: true });
      } catch (error) {
        console.warn('Error formatting date distance:', error);
        return 'Recently';
      }
    }
  };

  const loadMonthData = useCallback(async () => {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      
      console.log('📅 Feed Calendar: Loading month data for:', { year, month });
      
      // Use the EXACT same API call as Diary component
      const response = await diaryAPI.getMonth(year, month);
      
      console.log('📅 Feed Calendar: Response received:', response.data);
      console.log('📅 Feed Calendar: Days with data:', response.data.days?.filter((d: any) => d.has_data)?.length || 0);
      
      setMonthData(response.data);
    } catch (error) {
      console.error('📅 Feed Calendar: Error loading month data:', error);
      setMonthData(null);
    }
  }, [currentDate]);

  const loadSidebarData = useCallback(async () => {
    if (!user) return;
    
    setSidebarLoading(true);
    try {
      console.log('📊 Feed: Loading sidebar data...');
      
      // Load profile data using the same API as Overview - FIXED
      const profileResponse = await profileAPI.get();
      console.log('📊 Feed: Full profile response:', profileResponse.data);
      
      if (profileResponse.data) {
        setProfileData(profileResponse.data);
        console.log('📊 Feed: Profile data set:', {
          posts: profileResponse.data.profile?.posts_count,
          followers: profileResponse.data.profile?.followers_count,
          following: profileResponse.data.profile?.following_count
        });
      }

      // Load today's nutrition using EXACT same method as Overview - FIXED
      const today = new Date().toISOString().split('T')[0];
      console.log('📊 Feed: Loading meals for date:', today);
      
      const mealsResponse = await mealsAPI.getByDate(today);
      console.log('📊 Feed: Raw meals response:', mealsResponse);
      console.log('📊 Feed: Meals data:', mealsResponse.data);
      
      if (mealsResponse.data && mealsResponse.data.meals) {
        // Calculate totals from meals (EXACT same as Overview)
        const meals = mealsResponse.data.meals || [];
        console.log('📊 Feed: Processing meals:', meals.length, 'meals found');
        
        const totalCalories = meals.reduce((sum: number, meal: any) => {
          console.log('📊 Feed: Meal calories:', meal.calories);
          return sum + (meal.calories || 0);
        }, 0);
        const totalProtein = meals.reduce((sum: number, meal: any) => sum + (meal.protein || 0), 0);
        const totalCarbs = meals.reduce((sum: number, meal: any) => sum + (meal.carbs || 0), 0);
        const totalFat = meals.reduce((sum: number, meal: any) => sum + (meal.fat || 0), 0);
        
        // Create nutrition data object (same structure as Overview)
        const nutritionData = {
          totalCalories: totalCalories,
          totalProtein: totalProtein,
          totalCarbs: totalCarbs,
          totalFat: totalFat,
          calorieGoal: profileResponse.data.profile?.daily_calories || 2000,
          proteinGoal: profileResponse.data.profile?.daily_protein || 150,
        };
        
        console.log('📊 Feed: Final calculated nutrition data:', nutritionData);
        setTodayNutrition(nutritionData);
      } else {
        console.log('📊 Feed: No meals data found, setting empty nutrition');
        setTodayNutrition({
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFat: 0,
          calorieGoal: profileResponse.data.profile?.daily_calories || 2000,
          proteinGoal: profileResponse.data.profile?.daily_protein || 150,
        });
      }

      // Load month data for calendar - FIXED
      await loadMonthData();
      
    } catch (error) {
      console.error('📊 Feed: Error loading sidebar data:', error);
      // Set default nutrition data on error
      setTodayNutrition({
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        calorieGoal: 2000,
        proteinGoal: 150,
      });
    } finally {
      setSidebarLoading(false);
    }
  }, [user, loadMonthData]);

  const loadPosts = async () => {
    try {
      console.log('📡 Loading posts from feed...');
      console.log('💾 Current localStorage posts:', JSON.parse(localStorage.getItem('local_posts') || '[]'));
      const response = await socialAPI.getFeed();
      console.log('📡 Feed response:', response);
      
      if (response && response.data) {
        console.log('✅ Posts loaded successfully:', response.data);
        // Ensure response.data is an array
        let serverPosts = [];
        if (Array.isArray(response.data)) {
          serverPosts = response.data;
        } else if (response.data.posts && Array.isArray(response.data.posts)) {
          serverPosts = response.data.posts;
        }
        
        console.log('🔄 Server returned', serverPosts.length, 'posts');
        console.log('💾 Local posts:', localPosts.length);
        
        // ALWAYS merge server and local posts properly
        const mergedPosts = mergeWithServerPosts(serverPosts);
        console.log('✅ Merged posts:', mergedPosts.length, 'total posts');
        setPosts(mergedPosts);
      } else {
        console.warn('⚠️ No data in feed response');
        // Don't clear posts if server fails - keep local posts
        if (localPosts.length > 0) {
          console.log('📱 Using local posts as fallback:', localPosts.length);
          setPosts(localPosts);
        } else {
          setPosts([]);
        }
      }
    } catch (error) {
      console.error('❌ Error loading posts:', error);
      // On error, use local posts as fallback
      if (localPosts.length > 0) {
        console.log('📱 Using local posts due to error:', localPosts.length);
        setPosts(localPosts);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: number) => {
    try {
      console.log('👍 Toggling like for post:', postId);
      const response = await socialAPI.likePost(postId);
      console.log('👍 Like response:', response.data);
      
      // Update local state optimistically
      setPosts(prevPosts => {
        const postsArray = Array.isArray(prevPosts) ? prevPosts : [];
        return postsArray.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                is_liked: !post.is_liked,
                likes_count: post.is_liked ? post.likes_count - 1 : post.likes_count + 1
              }
            : post
        );
      });
    } catch (error) {
      console.error('❌ Error liking post:', error);
      alert('Failed to like post. Please try again.');
    }
  };

  const handleBookmark = async (postId: number) => {
    try {
      console.log('🔖 Toggling bookmark for post:', postId);
      const response = await socialAPI.bookmarkPost(postId);
      console.log('🔖 Bookmark response:', response.data);
      
      // Update local state optimistically
      setPosts(prevPosts => {
        const postsArray = Array.isArray(prevPosts) ? prevPosts : [];
        return postsArray.map(post => 
          post.id === postId 
            ? { ...post, is_bookmarked: !post.is_bookmarked }
            : post
        );
      });
    } catch (error) {
      console.error('❌ Error bookmarking post:', error);
      alert('Failed to bookmark post. Please try again.');
    }
  };

  const toggleComments = async (postId: number) => {
    if (expandedComments.has(postId)) {
      setExpandedComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    } else {
      setExpandedComments(prev => {
        const newSet = new Set(prev);
        newSet.add(postId);
        return newSet;
      });
      
      if (!comments[postId]) {
        setLoadingComments(prev => {
          const newSet = new Set(prev);
          newSet.add(postId);
          return newSet;
        });
        
        try {
          console.log('💬 Loading comments for post:', postId);
          const response = await socialAPI.getComments(postId);
          
          if (response && response.data) {
            console.log('✅ Comments loaded:', response.data);
            setComments(prev => ({ ...prev, [postId]: response.data }));
          }
        } catch (error) {
          console.error('❌ Error loading comments:', error);
        } finally {
          setLoadingComments(prev => {
            const newSet = new Set(prev);
            newSet.delete(postId);
            return newSet;
          });
        }
      }
    }
  };

  const handleAddComment = async (postId: number) => {
    const content = newComments[postId]?.trim();
    if (!content) return;

    try {
      console.log('💬 Adding comment to post:', postId, 'Content:', content);
      const response = await socialAPI.addComment(postId, content);
      
      if (response && response.data) {
        console.log('✅ Comment added:', response.data);
        const newComment = response.data;
        setComments(prev => ({
          ...prev,
          [postId]: [...(prev[postId] || []), newComment]
        }));
        setNewComments(prev => ({ ...prev, [postId]: '' }));
        
        setPosts(prevPosts => {
          const postsArray = Array.isArray(prevPosts) ? prevPosts : [];
          return postsArray.map(post => 
            post.id === postId 
              ? { ...post, comments_count: post.comments_count + 1 }
              : post
          );
        });
      }
    } catch (error) {
      console.error('❌ Error adding comment:', error);
    }
  };

  const handleCreatePost = async () => {
    console.log('🛡️ BULLETPROOF POST CREATION v2.0 STARTING...');
    console.log('📝 Current newPost state:', newPost);
    
    // BULLETPROOF VALIDATION
    if (!newPost.content.trim() && !newPost.imageFile) {
      alert('Please enter some content or add an image before posting.');
      return;
    }

    if (!user?.id) {
      alert('You must be logged in to create a post.');
      return;
    }

    setCreatingPost(true);

    // BULLETPROOF: Create post immediately for instant UI feedback
    const instantPost = {
      id: Date.now(),
      content: newPost.content.trim(),
      image_url: null,
      meal_data: newPost.mealData,
      user: {
        id: user.id,
        username: user.username || `user${user.id}`,
        first_name: user.first_name || 'User',
        last_name: user.last_name || 'User',
        profile_picture: user.profile_picture
      },
      created_at: new Date().toISOString(),
      likes_count: 0,
      comments_count: 0,
      is_liked: false,
      is_bookmarked: false,
      allow_comments: newPost.allowComments,
      hide_like_count: newPost.hideLikeCount,
      _status: 'creating'
    };

    // Show post immediately
    console.log('⚡ Adding post to feed immediately for instant feedback');
    setPosts(prevPosts => {
      const postsArray = Array.isArray(prevPosts) ? prevPosts : [];
      return [instantPost, ...postsArray];
    });

    // Reset form immediately for better UX
    setNewPost({
      content: '',
      imageFile: null,
      mealData: null,
      allowComments: true,
      hideLikeCount: false
    });
    setShowCreatePost(false);

    // BULLETPROOF: Try to save to server in background
    try {
      const formData = new FormData();
      formData.append('content', instantPost.content);
      formData.append('allow_comments', instantPost.allow_comments.toString());
      formData.append('hide_like_count', instantPost.hide_like_count.toString());
      
      if (newPost.imageFile) {
        formData.append('image', newPost.imageFile);
      }
      
      if (newPost.mealData) {
        formData.append('meal_data', JSON.stringify(newPost.mealData));
      }

      console.log('🚀 Attempting to save to server...');

      // Try multiple methods to save to server
      let serverSuccess = false;
      let serverResponse = null;

      // Method 1: socialAPI
      try {
        const response = await socialAPI.createPost(formData);
        if (response && (response.status === 200 || response.status === 201) && response.data) {
          serverSuccess = true;
          serverResponse = response.data;
          console.log('✅ socialAPI SUCCESS');
        }
      } catch (apiError) {
        console.warn('⚠️ socialAPI failed:', apiError);
      }

      // Method 2: Direct fetch
      if (!serverSuccess) {
        try {
          const authData = JSON.parse(localStorage.getItem('nutritrack_auth_data') || '{}');
          const token = authData.token || localStorage.getItem('token');
          
          if (token) {
            const directResponse = await fetch(`${process.env.REACT_APP_API_URL || 'https://nutrition-back-jtf3.onrender.com'}/api/social/posts`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` },
              body: formData
            });
            
            if (directResponse.ok) {
              serverResponse = await directResponse.json();
              serverSuccess = true;
              console.log('✅ Direct fetch SUCCESS');
            }
          }
        } catch (directError) {
          console.warn('⚠️ Direct fetch failed:', directError);
        }
      }

      // Update the post in the feed with server data or keep as local
      const finalPost = {
        ...instantPost,
        id: serverResponse?.postId || serverResponse?.post?.id || instantPost.id,
        image_url: serverResponse?.imageUrl || serverResponse?.post?.image_url || null,
        _status: serverSuccess ? 'saved' : 'local-only',
        _serverSaved: serverSuccess
      };

      // Update the existing post in the feed
      setPosts(prevPosts => {
        const postsArray = Array.isArray(prevPosts) ? prevPosts : [];
        return postsArray.map(p => 
          p.id === instantPost.id ? finalPost : p
        );
      });

      // Save for persistence
      savePostLocally(finalPost);

      if (serverSuccess) {
        console.log('🎉 POST SAVED TO SERVER SUCCESSFULLY');
        window.dispatchEvent(new CustomEvent('postCreated', { detail: finalPost }));
      } else {
        console.log('📱 POST SAVED LOCALLY - Will sync when server available');
      }

    } catch (error) {
      console.error('💥 Background server save failed:', error);
      // Don't show error to user - post is already visible
      console.log('📱 Post remains local-only due to server issues');
    } finally {
      setCreatingPost(false);
      console.log('✅ BULLETPROOF POST CREATION COMPLETED');
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setNewPost(prev => ({ ...prev, imageFile: file }));
    }
  };

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      // Get token from proper auth system
      const authData = JSON.parse(localStorage.getItem('nutritrack_auth_data') || '{}');
      const token = authData.token || localStorage.getItem('token');
      
      const response = await fetch(`/api/social/users/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleFollow = async (userId: number) => {
    try {
      // Get token from proper auth system
      const authData = JSON.parse(localStorage.getItem('nutritrack_auth_data') || '{}');
      const token = authData.token || localStorage.getItem('token');
      
      const response = await fetch(`/api/social/users/${userId}/follow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setSearchResults(searchResults.map(user =>
          user.id === userId
            ? { ...user, is_following: !user.is_following }
            : user
        ));
      }
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  useEffect(() => {
    if (user) {
      console.log('🔧 Feed: Loading posts...');
      // First, immediately show local posts if available
      if (localPosts.length > 0) {
        console.log('⚡ Feed: Showing local posts immediately:', localPosts.length);
        setPosts(localPosts);
      }
      // Then load from server and merge
      loadPosts();
    }
  }, [user, localPosts, loadPosts]); // Added missing dependency

  // Debug posts state changes
  useEffect(() => {
    console.log('🎯 Posts state changed:', posts.length, 'posts');
    console.log('📊 Current posts:', posts);
  }, [posts]);

  useEffect(() => {
    console.log('🔧 Feed: Month data effect triggered');
    loadMonthData();
  }, [loadMonthData]);

  // Force data load when user becomes available
  useEffect(() => {
    if (user) {
      console.log('🔧 Feed: User available, loading data immediately...');
      
      // Clear any stale local posts to prevent duplicates on login
      if (localPosts.length > 0) {
        console.log('🧹 Clearing stale local posts to prevent duplicates');
        clearLocalPosts();
      }
      
      loadSidebarData();
      loadMonthData();
      loadPosts();
    }
  }, [user, clearLocalPosts, loadMonthData, loadPosts, loadSidebarData, localPosts.length]); // Added missing dependencies

  // Enhanced automatic syncing with Overview page - IMPROVED
  useEffect(() => {
    const handleMealDataChanged = () => {
      console.log('📊 Feed: Meal data changed event received, auto-syncing...');
      loadSidebarData();
      loadMonthData(); // Also refresh calendar when meals change
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'mealAdded' || e.key === 'mealDeleted' || e.key === 'mealUpdated') {
        console.log('📊 Feed: Storage event detected, auto-syncing...');
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

    // Also listen for sidebar refresh events from other components
    window.addEventListener('sidebarRefresh', handleMealDataChanged);

    return () => {
      window.removeEventListener('mealDataChanged', handleMealDataChanged);
      window.removeEventListener('mealAdded', handleMealDataChanged);
      window.removeEventListener('mealUpdated', handleMealDataChanged);
      window.removeEventListener('mealDeleted', handleMealDataChanged);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('sidebarRefresh', handleMealDataChanged);
    };
  }, [loadSidebarData, loadMonthData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        
        {/* Three Column Layout */}
        <div className="flex gap-6 max-w-7xl mx-auto p-6">
          
          {/* Left Sidebar - Profile & Calendar */}
          <div className="w-80 flex-shrink-0 sticky top-6 self-start space-y-6 max-h-[calc(100vh-3rem)] overflow-y-auto">
            
            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 relative overflow-hidden">
              {/* Subtle decorative elements */}
              <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-full -translate-y-8 translate-x-8"></div>
              <div className="absolute bottom-0 left-0 w-12 h-12 bg-purple-50 rounded-full translate-y-6 -translate-x-6"></div>
              
              <div className="relative text-center">
                {user?.profile_picture ? (
                  <div className="relative inline-block">
                    <img 
                      src={user.profile_picture} 
                      alt="Profile" 
                      className="w-20 h-20 rounded-full mx-auto mb-4 object-cover ring-3 ring-blue-100 shadow-md"
                    />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-3 border-white"></div>
                  </div>
                ) : (
                  <div className="relative inline-block">
                    <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl font-semibold mx-auto mb-4 ring-3 ring-blue-100 shadow-md">
                      {user?.first_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-3 border-white"></div>
                  </div>
                )}
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {user?.first_name} {user?.last_name}
                </h3>
                <p className="text-gray-500 mb-4">@{user?.username}</p>
                
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-600">{profileData?.profile?.posts_count || 0}</div>
                    <div className="text-xs text-gray-500">Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">{profileData?.profile?.following_count || 0}</div>
                    <div className="text-xs text-gray-500">Following</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-purple-600">{profileData?.profile?.followers_count || 0}</div>
                    <div className="text-xs text-gray-500">Followers</div>
                  </div>
                </div>
                
                <button 
                  onClick={() => setShowFollowSearch(true)}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-2.5 px-4 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Find People
                </button>
              </div>
            </div>

            {/* Today's Nutrition Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-14 h-14 bg-green-50 rounded-full -translate-y-7 translate-x-7"></div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-4 relative">Today's Nutrition</h3>
              {todayNutrition ? (
                <div className="space-y-4 relative">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Calories</span>
                    <span className="font-semibold text-gray-900">
                      {todayNutrition.totalCalories || 0} / {todayNutrition.calorieGoal || 2000}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 shadow-inner">
                    <div 
                      className="bg-orange-500 h-2.5 rounded-full transition-all duration-300" 
                      style={{ 
                        width: `${Math.min(100, ((todayNutrition.totalCalories || 0) / (todayNutrition.calorieGoal || 2000)) * 100)}%` 
                      }}
                    ></div>
                  </div>
                  
                  {/* Protein Progress */}
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-gray-600">Protein</span>
                    <span className="font-semibold text-gray-900">
                      {todayNutrition.totalProtein || 0}g / {todayNutrition.proteinGoal || 150}g
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 shadow-inner">
                    <div 
                      className="bg-green-500 h-2.5 rounded-full transition-all duration-300" 
                      style={{ 
                        width: `${Math.min(100, ((todayNutrition.totalProtein || 0) / (todayNutrition.proteinGoal || 150)) * 100)}%` 
                      }}
                    ></div>
                  </div>
                  
                  {/* Macros - REMOVED PROTEIN RECTANGLE */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center bg-yellow-50 rounded-lg p-2">
                      <div className="text-yellow-600 font-semibold text-sm">{todayNutrition.totalCarbs || 0}g</div>
                      <div className="text-gray-500 text-xs">Carbs</div>
                    </div>
                    <div className="text-center bg-red-50 rounded-lg p-2">
                      <div className="text-red-600 font-semibold text-sm">{todayNutrition.totalFat || 0}g</div>
                      <div className="text-gray-500 text-xs">Fat</div>
                    </div>
                    <div className="text-center bg-blue-50 rounded-lg p-2">
                      <div className="text-blue-600 font-semibold text-sm">{Math.round(((todayNutrition.totalCalories || 0) / (todayNutrition.calorieGoal || 2000)) * 100)}%</div>
                      <div className="text-gray-500 text-xs">Goal</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-400 text-center py-6 relative">No nutrition data for today</div>
              )}
            </div>

            {/* Calendar Streak Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 relative overflow-hidden">
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-purple-50 rounded-full translate-y-8 -translate-x-8"></div>
              
              <div className="flex items-center justify-between mb-4 relative">
                <h3 className="text-lg font-semibold text-gray-900">Calendar</h3>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-500" />
                  </button>
                  <button 
                    onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
              
              <div className="text-center mb-3 relative">
                <div className="text-sm font-medium text-gray-900 bg-gray-50 rounded-lg py-2 px-3">
                  {format(currentDate, 'MMMM yyyy')}
                </div>
              </div>
              
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 text-xs relative">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                  <div key={day} className="text-center p-2 text-gray-500 font-medium">
                    {day}
                  </div>
                ))}
                {eachDayOfInterval({
                  start: startOfMonth(currentDate),
                  end: endOfMonth(currentDate)
                }).map(day => {
                  const dayData = monthData?.days?.find((d: any) => 
                    new Date(d.date).getDate() === day.getDate()
                  );
                  const hasData = dayData?.has_data;
                  const isCurrentDay = isToday(day);
                  
                  return (
                    <div
                      key={day.toISOString()}
                      className={`
                        text-center p-2 rounded-lg text-sm font-medium transition-all duration-200
                        ${isCurrentDay ? 'bg-orange-500 text-white shadow-md' : ''}
                        ${hasData && !isCurrentDay ? 'bg-green-100 text-green-700' : ''}
                        ${!hasData && !isCurrentDay ? 'text-gray-400 hover:bg-gray-50' : ''}
                      `}
                    >
                      {day.getDate()}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Feed Content */}
          <div className="flex-1 space-y-6">
            {/* Create Post Button - Simple */}
            <button
              onClick={() => setShowCreatePost(true)}
              className="w-full bg-white border border-gray-200 rounded-lg p-4 text-left hover:bg-gray-50 transition-colors shadow-sm"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-semibold">
                  {user?.first_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                </div>
                <span className="text-gray-600">What's on your mind?</span>
              </div>
            </button>

            {/* Posts - Original Simple Design */}
            <div className="space-y-6">
              {posts.length === 0 && !loading && (
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 text-center">
                  <div className="mb-4">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="w-8 h-8 text-orange-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts yet</h3>
                    <p className="text-gray-600 mb-6">Your feed is empty. Start connecting with others to see their posts!</p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={() => setShowFollowSearch(true)}
                      className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                      Find Friends
                    </button>
                    <button
                      onClick={() => {/* Navigate to groups when implemented */}}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                      Browse Groups
                    </button>
                  </div>
                </div>
              )}
              
              {Array.isArray(posts) && posts.length > 0 && posts.map(post => (
                <div key={post.id} className="bg-white border border-gray-200 rounded-lg shadow-sm">
                  {/* Post Header */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-sm font-semibold">
                        {post.user?.first_name?.charAt(0) || post.user?.username?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {post.user?.first_name || 'Unknown'} {post.user?.last_name || 'User'}
                        </div>
                        <div className="text-sm text-gray-500">{formatPostDate(post.created_at)}</div>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Post Content */}
                  {post.content && (
                    <div className="p-4">
                      <p className="text-gray-900">{post.content}</p>
                    </div>
                  )}

                  {/* Post Image */}
                  {post.image_url && (
                    <div className="w-full">
                      <img 
                        src={post.image_url} 
                        alt="Post" 
                        className="w-full object-cover"
                      />
                    </div>
                  )}

                  {/* Meal Data */}
                  {post.meal_data && (
                    <div className="p-4 bg-gray-50 border-t border-gray-200">
                      <div className="text-sm font-medium text-gray-900 mb-2">Meal Information</div>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div className="text-center">
                          <div className="font-semibold text-orange-600">{post.meal_data.calories || 0}</div>
                          <div className="text-gray-600">Calories</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-green-600">{post.meal_data.protein || 0}g</div>
                          <div className="text-gray-600">Protein</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-yellow-600">{post.meal_data.carbs || 0}g</div>
                          <div className="text-gray-600">Carbs</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-red-600">{post.meal_data.fat || 0}g</div>
                          <div className="text-gray-600">Fat</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Post Actions */}
                  <div className="px-4 py-3 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6">
                        <button
                          onClick={() => handleLike(post.id)}
                          className={`flex items-center space-x-2 ${post.is_liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
                        >
                          <Heart className={`w-5 h-5 ${post.is_liked ? 'fill-current' : ''}`} />
                          <span className="text-sm">{post.likes_count}</span>
                        </button>
                        <button
                          onClick={() => toggleComments(post.id)}
                          className="flex items-center space-x-2 text-gray-500 hover:text-orange-500"
                        >
                          <MessageCircle className="w-5 h-5" />
                          <span className="text-sm">{post.comments_count}</span>
                        </button>
                        <button className="text-gray-500 hover:text-orange-500">
                          <Share className="w-5 h-5" />
                        </button>
                      </div>
                      <button
                        onClick={() => handleBookmark(post.id)}
                        className={`${post.is_bookmarked ? 'text-orange-500' : 'text-gray-500 hover:text-orange-500'}`}
                      >
                        <Bookmark className={`w-5 h-5 ${post.is_bookmarked ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Comments Section */}
                  {expandedComments.has(post.id) && (
                    <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                      {/* Add Comment */}
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-sm font-semibold">
                          {user?.first_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 flex items-center space-x-2">
                          <input
                            type="text"
                            placeholder="Add a comment..."
                            value={newComments[post.id] || ''}
                            onChange={(e) => setNewComments(prev => ({...prev, [post.id]: e.target.value}))}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                          />
                          <button
                            onClick={() => handleAddComment(post.id)}
                            disabled={!newComments[post.id]?.trim()}
                            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
                          >
                            Post
                          </button>
                        </div>
                      </div>

                      {/* Comments List */}
                      <div className="space-y-3">
                        {comments[post.id]?.map(comment => (
                          <div key={comment.id} className="flex items-start space-x-3">
                            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-sm font-semibold">
                              {comment.user?.first_name?.charAt(0) || comment.user?.username?.charAt(0) || 'U'}
                            </div>
                            <div className="flex-1">
                              <div className="bg-white rounded-lg p-3">
                                <div className="font-semibold text-sm text-gray-900">
                                  {comment.user?.first_name || 'Unknown'} {comment.user?.last_name || 'User'}
                                </div>
                                <div className="text-gray-700">{comment.content}</div>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">{formatPostDate(comment.created_at)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Sidebar - Groups */}
          <div className="w-80 flex-shrink-0 sticky top-6 self-start space-y-6 max-h-[calc(100vh-3rem)] overflow-y-auto">
            
            {/* Groups Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-14 h-14 bg-indigo-50 rounded-full -translate-y-7 translate-x-7"></div>
              
              <div className="flex items-center justify-between mb-6 relative">
                <h3 className="text-lg font-semibold text-gray-900">Groups</h3>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-full transition-colors">
                  See All
                </button>
              </div>
              
              <div className="space-y-3 relative">
                {/* Mock Group Items */}
                <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center shadow-sm">
                    <span className="text-white font-semibold text-sm">VG</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 group-hover:text-green-600 transition-colors">Vegan Recipes</div>
                    <div className="text-sm text-gray-500">1.2k members</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center shadow-sm">
                    <span className="text-white font-semibold text-sm">FT</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">Fitness Goals</div>
                    <div className="text-sm text-gray-500">856 members</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center shadow-sm">
                    <span className="text-white font-semibold text-sm">WL</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 group-hover:text-purple-600 transition-colors">Weight Loss</div>
                    <div className="text-sm text-gray-500">2.1k members</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shadow-sm">
                    <span className="text-white font-semibold text-sm">KT</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 group-hover:text-orange-600 transition-colors">Keto Diet</div>
                    <div className="text-sm text-gray-500">643 members</div>
                  </div>
                </div>
              </div>
              
              <button className="w-full mt-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-2.5 px-4 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105">
                Create Group
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Create Post Modal - Improved Design */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-100">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <PenTool className="w-4 h-4 text-orange-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Create Post</h2>
              </div>
              <button
                onClick={() => setShowCreatePost(false)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center text-white font-semibold shadow-md">
                  {user?.first_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                </div>
                <div className="flex-1">
                  <textarea
                    placeholder="What's on your mind?"
                    value={newPost.content}
                    onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                    className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-300 resize-none bg-gray-50 hover:bg-white transition-colors"
                    rows={5}
                  />
                </div>
              </div>

              {newPost.imageFile && (
                <div className="relative">
                  <img
                    src={URL.createObjectURL(newPost.imageFile)}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => setNewPost(prev => ({ ...prev, imageFile: null }))}
                    className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-1 rounded-full hover:bg-opacity-70"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Post Options */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 bg-orange-100 rounded flex items-center justify-center">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">Post Settings</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center space-x-3 cursor-pointer p-3 bg-white rounded-lg border border-gray-200 hover:border-orange-300 transition-colors">
                    <input
                      type="checkbox"
                      checked={newPost.allowComments}
                      onChange={(e) => setNewPost(prev => ({ ...prev, allowComments: e.target.checked }))}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700">Allow comments</span>
                  </label>
                  
                  <label className="flex items-center space-x-3 cursor-pointer p-3 bg-white rounded-lg border border-gray-200 hover:border-orange-300 transition-colors">
                    <input
                      type="checkbox"
                      checked={newPost.hideLikeCount}
                      onChange={(e) => setNewPost(prev => ({ ...prev, hideLikeCount: e.target.checked }))}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700">Hide like count</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-3 text-gray-600 hover:text-orange-600 cursor-pointer p-2 hover:bg-orange-50 rounded-lg transition-colors">
                    <Image className="w-5 h-5" />
                    <span className="text-sm font-medium">Add Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowCreatePost(false)}
                    className="px-6 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreatePost}
                    disabled={(!newPost.content.trim() && !newPost.imageFile) || creatingPost}
                    className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2"
                  >
                    {creatingPost && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    )}
                    <span>{creatingPost ? 'Posting...' : 'Share Post'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Follow People Search Modal */}
      {showFollowSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">Find People</h2>
              <button
                onClick={() => setShowFollowSearch(false)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Search for people..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    searchUsers(e.target.value);
                  }}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {searchLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {searchResults.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                          {user?.first_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {user?.first_name || 'Unknown'} {user?.last_name || 'User'}
                          </div>
                          <div className="text-sm text-gray-500">@{user.username}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleFollow(user.id)}
                        className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                          user.is_following
                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-md hover:shadow-lg'
                        }`}
                      >
                        {user.is_following ? 'Following' : 'Follow'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Feed;