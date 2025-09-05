import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Heart, MessageCircle, Share, MoreHorizontal, PenTool, Bookmark, Image, X, Plus, UserCircle, Calendar, TrendingUp, TrendingDown, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDistanceToNow, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { diaryAPI } from '../services/api';

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
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
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
    const postDate = new Date(dateString);
    const today = new Date();
    const isToday = postDate.toDateString() === today.toDateString();
    
    if (isToday) {
      return `Today at ${postDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      })}`;
    } else {
      return formatDistanceToNow(postDate, { addSuffix: true });
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
      // Set empty data structure as fallback
      setMonthData({
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1,
        days: []
      });
    }
  }, [currentDate]);

  const loadFeed = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://nutrition-back-jtf3.onrender.com'}/api/social/feed`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts);
      }
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSidebarData = useCallback(async () => {
    try {
      setSidebarLoading(true);
      console.log('Loading sidebar data...');
      
      let profileDataForGoals = null;
      
      // Load profile data with stats
      const profileResponse = await fetch(`${process.env.REACT_APP_API_URL || 'https://nutrition-back-jtf3.onrender.com'}/api/social/profile/${user?.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('Profile response status:', profileResponse.status);
      
      if (profileResponse.ok) {
        profileDataForGoals = await profileResponse.json();
        console.log('Profile data received:', profileDataForGoals);
        setProfileData(profileDataForGoals);
      } else {
        console.error('Profile API error:', profileResponse.status, await profileResponse.text());
      }
      
      // Load today's nutrition data
      const today = format(new Date(), 'yyyy-MM-dd');
      console.log('Loading meals for date:', today);
      
      const mealsResponse = await fetch(`${process.env.REACT_APP_API_URL || 'https://nutrition-back-jtf3.onrender.com'}/api/meals/${today}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('Meals response status:', mealsResponse.status);
      
      if (mealsResponse.ok) {
        const mealsData = await mealsResponse.json();
        console.log('Meals data received:', mealsData);
        const meals = mealsData.meals || [];
        
        // Calculate totals
        const totalCalories = meals.reduce((sum: number, meal: any) => sum + (meal.calories || 0), 0);
        const totalProtein = meals.reduce((sum: number, meal: any) => sum + (meal.protein || 0), 0);
        
        console.log('Calculated totals:', { totalCalories, totalProtein });
        
        // Get goals from profile data
        let calorieGoal = 2000;
        let proteinGoal = 150;
        
        if (profileDataForGoals?.profile) {
          calorieGoal = profileDataForGoals.profile.daily_calories || 2000;
          proteinGoal = profileDataForGoals.profile.daily_protein || 150;
        }
        
        const calorieDeficit = calorieGoal - totalCalories;
        
        console.log('Final nutrition data:', { totalCalories, totalProtein, calorieGoal, proteinGoal, calorieDeficit });
        
        setTodayNutrition({
          totalCalories,
          totalProtein,
          calorieGoal,
          proteinGoal,
          calorieDeficit
        });
      } else {
        console.error('Meals API error:', mealsResponse.status, await mealsResponse.text());
        // Set default nutrition data if no meals
        setTodayNutrition({
          totalCalories: 0,
          totalProtein: 0,
          calorieGoal: profileDataForGoals?.profile?.daily_calories || 2000,
          proteinGoal: profileDataForGoals?.profile?.daily_protein || 150,
          calorieDeficit: profileDataForGoals?.profile?.daily_calories || 2000
        });
      }
      
      // Load calendar data for current month
      await loadMonthData();
      
    } catch (error) {
      console.error('Error loading sidebar data:', error);
    } finally {
      setSidebarLoading(false);
    }
  }, [user?.id, currentDate, loadMonthData]);

  useEffect(() => {
    if (user) {
      loadFeed();
      loadSidebarData();
      loadMonthData(); // Ensure calendar loads initially
    }
  }, [user, loadFeed, loadSidebarData, loadMonthData]);

  // Reload month data when current date changes (for calendar navigation)
  useEffect(() => {
    if (user) {
      console.log('📅 Feed: Current date changed, reloading month data');
      loadMonthData();
    }
  }, [currentDate, loadMonthData, user]);

  // Listen for post creation events to auto-update feed and sidebar
  useEffect(() => {
    const handlePostCreated = () => {
      console.log('Post created event received, refreshing feed and sidebar');
      loadFeed();
      loadSidebarData(); // Also refresh sidebar to update post count
    };

    window.addEventListener('postCreated', handlePostCreated);
    
    return () => {
      window.removeEventListener('postCreated', handlePostCreated);
    };
  }, [loadFeed, loadSidebarData]);

  // Listen for meal updates to refresh sidebar AND calendar
  useEffect(() => {
    const handleMealUpdate = (event: any) => {
      console.log('🍽️ Feed: Meal update event received:', event.type);
      console.log('🍽️ Feed: IMMEDIATELY refreshing calendar...');
      
      // Immediate refresh - no timeout
      loadMonthData();
      loadSidebarData();
      
      // Also do delayed refreshes as backup
      setTimeout(() => {
        console.log('🍽️ Feed: Backup refresh 1 (500ms)...');
        loadMonthData();
        loadSidebarData();
      }, 500);
      
      setTimeout(() => {
        console.log('🍽️ Feed: Backup refresh 2 (1000ms)...');
        loadMonthData();
      }, 1000);
    };

    const handleCalendarRefresh = () => {
      console.log('📅 Feed: Calendar refresh event received - IMMEDIATE refresh');
      loadMonthData();
    };

    // Listen to various meal-related events
    window.addEventListener('mealAdded', handleMealUpdate);
    window.addEventListener('mealDataChanged', handleMealUpdate);
    window.addEventListener('mealDeleted', handleMealUpdate);
    window.addEventListener('mealUpdated', handleMealUpdate);
    window.addEventListener('sidebarRefresh', handleMealUpdate);
    window.addEventListener('calendarRefresh', handleCalendarRefresh);
    
    return () => {
      window.removeEventListener('mealAdded', handleMealUpdate);
      window.removeEventListener('mealDataChanged', handleMealUpdate);
      window.removeEventListener('mealDeleted', handleMealUpdate);
      window.removeEventListener('mealUpdated', handleMealUpdate);
      window.removeEventListener('sidebarRefresh', handleMealUpdate);
      window.removeEventListener('calendarRefresh', handleCalendarRefresh);
    };
  }, [loadSidebarData, loadMonthData]);

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
        // Update local state
        setPosts(posts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                is_bookmarked: !post.is_bookmarked
              }
            : post
        ));
      }
    } catch (error) {
      console.error('Error bookmarking post:', error);
    }
  };

  const handleCreatePost = async () => {
    console.log('handleCreatePost called with:', newPost);
    
    if (!newPost.content.trim()) {
      console.log('No content, returning early');
      alert('Please enter some content for your post');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('content', newPost.content);
      formData.append('allowComments', newPost.allowComments.toString());
      formData.append('hideLikeCount', newPost.hideLikeCount.toString());
      
      if (newPost.imageFile) {
        formData.append('image', newPost.imageFile);
        console.log('Added image file:', newPost.imageFile.name);
      }
      
      if (newPost.mealData) {
        formData.append('mealData', JSON.stringify(newPost.mealData));
      }

      console.log('Sending request to /api/social/posts');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://nutrition-back-jtf3.onrender.com'}/api/social/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Post created successfully:', result);
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
        
        // Reload feed and sidebar data
        loadFeed();
        loadSidebarData();
      } else {
        const errorText = await response.text();
        console.error('Failed to create post. Status:', response.status, 'Response:', errorText);
        alert(`Failed to create post: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert(`Error creating post: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };


  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      // For now, return mock data since search doesn't need to work yet
      const mockUsers = [
        { id: 1, username: 'john_doe', first_name: 'John', last_name: 'Doe', profile_picture: null },
        { id: 2, username: 'jane_smith', first_name: 'Jane', last_name: 'Smith', profile_picture: null },
        { id: 3, username: 'fitness_guru', first_name: 'Mike', last_name: 'Johnson', profile_picture: null }
      ].filter(user => 
        user.username.toLowerCase().includes(query.toLowerCase()) ||
        user.first_name.toLowerCase().includes(query.toLowerCase()) ||
        user.last_name.toLowerCase().includes(query.toLowerCase())
      );
      
      setSearchResults(mockUsers);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const loadComments = async (postId: number) => {
    if (loadingComments.has(postId)) return;
    
    setLoadingComments(prev => {
      const newSet = new Set(prev);
      newSet.add(postId);
      return newSet;
    });
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://nutrition-back-jtf3.onrender.com'}/api/social/posts/${postId}/comments`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setComments(prev => ({ ...prev, [postId]: data.comments }));
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoadingComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }
  };

  const handleToggleComments = (postId: number) => {
    const isExpanded = expandedComments.has(postId);
    
    if (isExpanded) {
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
        loadComments(postId);
      }
    }
  };

  const handleAddComment = async (postId: number) => {
    const content = newComments[postId]?.trim();
    if (!content) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://nutrition-back-jtf3.onrender.com'}/api/social/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
      });
      
      if (response.ok) {
        setNewComments(prev => ({ ...prev, [postId]: '' }));
        loadComments(postId); // Reload comments
        // Update comments count in posts
        setPosts(posts.map(post => 
          post.id === postId 
            ? { ...post, comments_count: post.comments_count + 1 }
            : post
        ));
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="flex max-w-7xl mx-auto gap-6 p-6">
        {/* Left Sidebar - Modern Social Media Style */}
        <div className="w-80 flex-shrink-0 sticky top-6 self-start space-y-6 max-h-[calc(100vh-3rem)] overflow-y-auto">
          {/* Profile Card - Instagram/TikTok Style */}
          <div className="bg-gradient-to-br from-white to-blue-50/30 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-8 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-pink-400/10 to-orange-400/10 rounded-full translate-y-12 -translate-x-12"></div>
            <div className="relative z-10">
              {sidebarLoading ? (
                <div className="animate-pulse">
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full mx-auto mb-6"></div>
                  <div className="h-5 bg-gray-200 rounded-full mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded-full w-3/4 mx-auto mb-6"></div>
                  <div className="flex justify-between mb-6">
                    <div className="h-8 bg-gray-200 rounded-xl w-16"></div>
                    <div className="h-8 bg-gray-200 rounded-xl w-16"></div>
                    <div className="h-8 bg-gray-200 rounded-xl w-16"></div>
                  </div>
                </div>
              ) : profileData ? (
                <>
                  {/* Profile Image - Instagram Story Style */}
                  <div className="text-center mb-6">
                    <div className="relative inline-block">
                      <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-full p-1 animate-pulse">
                        <div className="bg-white rounded-full p-1">
                          {profileData.profile?.profile_picture ? (
                            <img
                              src={profileData.profile.profile_picture}
                              alt={`${user?.first_name} ${user?.last_name}`}
                              className="w-20 h-20 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                              <UserCircle className="w-12 h-12 text-blue-500" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Name - Modern Typography */}
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-1">
                      {user?.first_name} {user?.last_name}
                    </h2>
                    <p className="text-blue-500 font-medium">@{user?.username}</p>
                  </div>
                  
                  {/* Stats - TikTok Style */}
                  <div className="flex justify-between mb-8">
                    <div className="text-center group cursor-pointer">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-2xl group-hover:scale-105 transition-transform">
                        <div className="font-bold text-lg">{profileData.stats?.posts || 0}</div>
                      </div>
                      <div className="text-xs text-gray-600 mt-2 font-medium">Posts</div>
                    </div>
                    <div className="text-center group cursor-pointer">
                      <div className="bg-gradient-to-r from-pink-500 to-red-500 text-white px-4 py-2 rounded-2xl group-hover:scale-105 transition-transform">
                        <div className="font-bold text-lg">{profileData.stats?.followers || 0}</div>
                      </div>
                      <div className="text-xs text-gray-600 mt-2 font-medium">Followers</div>
                    </div>
                    <div className="text-center group cursor-pointer">
                      <div className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-4 py-2 rounded-2xl group-hover:scale-105 transition-transform">
                        <div className="font-bold text-lg">{profileData.stats?.following || 0}</div>
                      </div>
                      <div className="text-xs text-gray-600 mt-2 font-medium">Following</div>
                    </div>
                  </div>
                  
                  {/* CTA Button - Modern Gradient */}
                  <button
                    onClick={() => navigate('/dashboard/inputs')}
                    className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center space-x-3 font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] group"
                  >
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center group-hover:rotate-90 transition-transform duration-300">
                      <Plus className="w-4 h-4" />
                    </div>
                    <span>Share Your Meal</span>
                  </button>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <UserCircle className="w-8 h-8 text-gray-400" />
                  </div>
                  <div className="text-gray-500 font-medium">Unable to load profile</div>
                </div>
              )}
            </div>
        </div>

          {/* Today's Nutrition Card - Modern Dashboard Style */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 backdrop-blur-xl rounded-3xl shadow-xl border border-emerald-200/50 p-6 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-400/10 to-teal-400/10 rounded-full -translate-y-10 translate-x-10"></div>
            
            <div className="relative z-10">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Today's Stats</h3>
                  <p className="text-emerald-600 text-sm font-medium">Your nutrition journey</p>
                </div>
              </div>
          
              {sidebarLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl"></div>
                  <div className="h-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl"></div>
                </div>
              ) : todayNutrition ? (
                <div className="space-y-4">
                  {/* Calorie Deficit - Modern Card Style */}
                  <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          todayNutrition.calorieDeficit > 0 
                            ? 'bg-gradient-to-br from-green-400 to-emerald-500' 
                            : 'bg-gradient-to-br from-red-400 to-pink-500'
                        }`}>
                          {todayNutrition.calorieDeficit > 0 ? (
                            <TrendingDown className="w-5 h-5 text-white" />
                          ) : (
                            <TrendingUp className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 font-medium">Calorie Balance</div>
                          <div className={`font-bold text-lg ${
                            todayNutrition.calorieDeficit > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {todayNutrition.calorieDeficit > 0 ? '-' : '+'}{Math.abs(todayNutrition.calorieDeficit)} cal
                          </div>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                        todayNutrition.calorieDeficit > 0 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {todayNutrition.calorieDeficit > 0 ? 'Deficit' : 'Surplus'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Overview - Compact Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Calories Progress */}
                    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-3 border border-white/50 shadow-sm">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-xs font-bold">C</span>
                        </div>
                        <div className="text-xs text-gray-600 font-medium">Calories</div>
                      </div>
                      <div className="text-sm font-bold text-gray-900 mb-2">
                        {todayNutrition.totalCalories} / {todayNutrition.calorieGoal}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-orange-400 to-red-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min((todayNutrition.totalCalories / todayNutrition.calorieGoal) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Protein Progress */}
                    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-3 border border-white/50 shadow-sm">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-xs font-bold">P</span>
                        </div>
                        <div className="text-xs text-gray-600 font-medium">Protein</div>
                      </div>
                      <div className="text-sm font-bold text-gray-900 mb-2">
                        {Math.round(todayNutrition.totalProtein)}g / {todayNutrition.proteinGoal}g
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min((todayNutrition.totalProtein / todayNutrition.proteinGoal) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <BarChart3 className="w-8 h-8 text-gray-400" />
                  </div>
                  <div className="text-gray-500 font-medium">No data available</div>
                </div>
              )}
            </div>
          </div>

          {/* Calendar Streak Card - Gamified Style */}
          <div className="bg-gradient-to-br from-violet-50 to-purple-50 backdrop-blur-xl rounded-3xl shadow-xl border border-violet-200/50 p-6 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-violet-400/10 to-purple-400/10 rounded-full -translate-y-12 -translate-x-12"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{format(currentDate, 'MMMM yyyy')}</h3>
                    <p className="text-violet-600 text-sm font-medium">Your nutrition streak</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentDate(prev => subMonths(prev, 1))}
                    className="w-10 h-10 bg-white/60 backdrop-blur-sm hover:bg-white/80 rounded-2xl border border-white/50 transition-all duration-200 flex items-center justify-center group"
                  >
                    <ChevronLeft className="w-5 h-5 text-violet-600 group-hover:scale-110 transition-transform" />
                  </button>
                  <button
                    onClick={() => setCurrentDate(prev => addMonths(prev, 1))}
                    className="w-10 h-10 bg-white/60 backdrop-blur-sm hover:bg-white/80 rounded-2xl border border-white/50 transition-all duration-200 flex items-center justify-center group"
                  >
                    <ChevronRight className="w-5 h-5 text-violet-600 group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              </div>
          </div>
          
          {sidebarLoading ? (
            <div className="animate-pulse">
              <div className="grid grid-cols-7 gap-2 p-2 bg-gray-50 rounded-lg">
                {/* Day headers skeleton */}
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={`header-${i}`} className="h-6 bg-gray-200 rounded"></div>
                ))}
                {/* Calendar days skeleton */}
                {Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} className="aspect-square bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Calendar Grid - Compact and beautiful */}
              <div className="grid grid-cols-7 gap-2 p-2 bg-gray-50 rounded-lg">
                {/* Day headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2 text-center text-xs font-bold text-gray-600 uppercase tracking-wide">
                    {day.substring(0, 1)}
                  </div>
                ))}
                
                {/* Padding days for proper calendar layout */}
                {monthData && (() => {
                  const start = startOfMonth(currentDate);
                  const firstDayOfMonth = start.getDay();
                  const paddingDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);
                  const days = eachDayOfInterval({
                    start: startOfMonth(currentDate),
                    end: endOfMonth(currentDate)
                  });
                  
                  const getDayStatus = (day: any) => {
                    if (!day?.has_data) return 'no-data';
                    if (day.calories_met && day.protein_met) return 'both-met';
                    if (day.calories_met || day.protein_met) return 'partial';
                    return 'none-met';
                  };

                  const getDayColor = (day: any) => {
                    const status = getDayStatus(day);
                    switch (status) {
                      case 'both-met':
                        return 'bg-green-500 text-white'; // EXACT match to Diary
                      case 'partial':
                        return 'bg-yellow-500 text-white'; // EXACT match to Diary  
                      case 'none-met':
                        return 'bg-red-500 text-white'; // EXACT match to Diary
                      default:
                        return 'bg-gray-100 text-gray-400'; // EXACT match to Diary
                    }
                  };

                  return (
                    <>
                      {/* Padding days */}
                      {paddingDays.map((_, i) => (
                        <div key={`padding-${i}`} className="aspect-square" />
                      ))}
                      
                      {/* Calendar days */}
                      {days.map(day => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const dayData = monthData.days?.find((d: any) => d.date === dateStr);
                        const isCurrentDay = isToday(day);
                        
                        // Debug logging for ALL days with data
                        if (dayData?.has_data) {
                          console.log(`📅 Feed Calendar: Day ${format(day, 'd')} data:`, {
                            date: dateStr,
                            hasData: dayData.has_data,
                            calories: dayData.total_calories,
                            caloriesMet: dayData.calories_met,
                            proteinMet: dayData.protein_met,
                            status: getDayStatus(dayData),
                            color: getDayColor(dayData)
                          });
                        }
                        
                        return (
                          <div
                            key={day.toString()}
                            className={`
                              aspect-square p-1 text-xs font-medium rounded-lg transition-all duration-200 cursor-pointer
                              flex items-center justify-center
                              ${getDayColor(dayData || { has_data: false })}
                              ${isCurrentDay ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
                              hover:opacity-80 hover:scale-105
                            `}
                          >
                            <div className="font-bold text-sm">{format(day, 'd')}</div>
                          </div>
                        );
                      })}
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </div>

        {/* Main Feed Content - Modern Social Media Style */}
        <div className="flex-1 space-y-6">
          {/* Create Post Button - Instagram Style */}
          <div className="sticky top-6 z-20">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6 relative overflow-hidden">
              {/* Decorative gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 via-purple-500/5 to-blue-500/5"></div>
              
              <div className="relative z-10">
                <button
                  onClick={() => setShowCreatePost(true)}
                  className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:from-pink-600 hover:via-purple-600 hover:to-blue-600 text-white py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center space-x-3 font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] group"
                >
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                    <PenTool className="w-5 h-5" />
                  </div>
                  <span>Share Your Journey</span>
                </button>
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
                  className="w-full border border-gray-300 rounded-lg p-3 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                  console.log('Post button clicked', newPost);
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

      {/* Feed Posts */}
      {posts.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <PenTool className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-medium mb-2">No posts in your feed</h3>
          <p className="mb-6">Follow some users to see their posts here, or create your own post!</p>
          
          <div className="space-y-4">
          <button
            onClick={() => setShowCreatePost(true)}
              className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors mr-4"
          >
            Create your first post
          </button>
            
            <button
              onClick={() => setShowFollowSearch(true)}
              className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              Find people to follow
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Posts Feed - Instagram/TikTok Style */}
          <div className="space-y-8">
          {posts.map((post) => (
              <div key={post.id} className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 overflow-hidden group hover:shadow-2xl transition-all duration-300">
                {/* Post Header - Modern Profile Style */}
                <div className="flex items-center justify-between p-6">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      {/* Instagram-style story ring */}
                      <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-full p-0.5">
                        <div className="bg-white rounded-full p-0.5">
                          {post.user.profile_picture ? (
                            <img
                              src={post.user.profile_picture}
                              alt={`${post.user.first_name} ${post.user.last_name}`}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                              {post.user.first_name?.charAt(0) || post.user.username?.charAt(0)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-lg">
                        {post.user.first_name} {post.user.last_name}
                      </div>
                      <div className="text-sm text-gray-500 font-medium">{formatPostDate(post.created_at)}</div>
                    </div>
                  </div>
                  <button className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-2xl flex items-center justify-center transition-all duration-200 group-hover:scale-110">
                    <MoreHorizontal className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                {/* Post Content - Modern Typography */}
                {post.content && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-800 text-lg leading-relaxed">{post.content}</p>
                  </div>
                )}

                {/* Post Image - Instagram Style */}
                {post.image_url && (
                  <div className="px-6 pb-4">
                    <div className="rounded-2xl overflow-hidden shadow-lg">
                      <img 
                        src={post.image_url} 
                        alt="Post" 
                        className="w-full h-80 object-cover hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  </div>
                )}

                {/* Meal Data - Modern Nutrition Cards */}
                {post.meal_data && (
                  <div className="px-6 pb-4">
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-200/50">
                      <div className="flex items-center mb-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mr-3">
                          <span className="text-white text-sm font-bold">🍽️</span>
                        </div>
                        <h4 className="font-bold text-gray-800">Nutrition Facts</h4>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 text-center">
                          <div className="text-lg font-bold text-orange-600">{post.meal_data.calories}</div>
                          <div className="text-xs text-gray-600 font-medium">Calories</div>
                        </div>
                        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 text-center">
                          <div className="text-lg font-bold text-blue-600">{post.meal_data.protein}g</div>
                          <div className="text-xs text-gray-600 font-medium">Protein</div>
                        </div>
                        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 text-center">
                          <div className="text-lg font-bold text-purple-600">{post.meal_data.carbs}g</div>
                          <div className="text-xs text-gray-600 font-medium">Carbs</div>
                        </div>
                        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 text-center">
                          <div className="text-lg font-bold text-yellow-600">{post.meal_data.fat}g</div>
                          <div className="text-xs text-gray-600 font-medium">Fat</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Post Actions - Modern Social Media Style */}
                <div className="px-6 py-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      {/* Like Button - Instagram Style */}
                      <button
                        onClick={() => handleLike(post.id)}
                        className={`group flex items-center space-x-2 transition-all duration-300 ${
                          post.is_liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                          post.is_liked 
                            ? 'bg-red-50 scale-110' 
                            : 'bg-gray-50 group-hover:bg-red-50 group-hover:scale-110'
                        }`}>
                          <Heart className={`w-5 h-5 ${post.is_liked ? 'fill-current' : ''} transition-all duration-300`} />
                        </div>
                        {!post.hide_like_count || post.user.id === user?.id ? (
                          <span className="font-semibold">{post.likes_count}</span>
                        ) : (
                          <span className="font-semibold">•</span>
                        )}
                      </button>

                      {/* Comment Button */}
                      {post.allow_comments !== false && (
                        <button 
                          onClick={() => handleToggleComments(post.id)}
                          className="group flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-all duration-300"
                        >
                          <div className="w-10 h-10 bg-gray-50 group-hover:bg-blue-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                            <MessageCircle className="w-5 h-5" />
                          </div>
                          <span className="font-semibold">{post.comments_count}</span>
                        </button>
                      )}

                      {/* Share Button */}
                      <button className="group text-gray-500 hover:text-green-500 transition-all duration-300">
                        <div className="w-10 h-10 bg-gray-50 group-hover:bg-green-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                          <Share className="w-5 h-5" />
                        </div>
                      </button>
                    </div>
                    {/* Bookmark Button */}
                    <button
                      onClick={() => handleBookmark(post.id)}
                      className={`group transition-all duration-300 ${
                        post.is_bookmarked ? 'text-purple-500' : 'text-gray-500 hover:text-purple-500'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                        post.is_bookmarked 
                          ? 'bg-purple-50 scale-110' 
                          : 'bg-gray-50 group-hover:bg-purple-50 group-hover:scale-110'
                      }`}>
                        <Bookmark className={`w-5 h-5 ${post.is_bookmarked ? 'fill-current' : ''} transition-all duration-300`} />
                      </div>
                    </button>
                  </div>
                </div>

              {/* Comments Section */}
              {post.allow_comments !== false && expandedComments.has(post.id) && (
                <div className="border-t border-gray-200">
                  {/* Show latest comments */}
                  {loadingComments.has(post.id) ? (
                    <div className="p-4 text-center text-gray-500">Loading comments...</div>
                  ) : comments[post.id] && comments[post.id].length > 0 ? (
                    <div className="p-4">
                      <div className="space-y-3 mb-4">
                        {comments[post.id].slice(0, 3).map((comment) => (
                          <div key={comment.id} className="flex space-x-3">
                            {comment.user.profile_picture ? (
                              <img
                                src={comment.user.profile_picture}
                                alt={`${comment.user.first_name} ${comment.user.last_name}`}
                                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {comment.user.first_name?.charAt(0) || comment.user.username?.charAt(0)}
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="bg-gray-100 rounded-lg px-3 py-2">
                                <div className="font-medium text-sm text-gray-900">
                                  {comment.user.first_name} {comment.user.last_name}
                                </div>
                                <div className="text-sm text-gray-700">{comment.content}</div>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {formatPostDate(comment.created_at)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {comments[post.id].length > 3 && (
                        <button className="text-sm text-blue-600 hover:text-blue-700 mb-4">
                          View all {comments[post.id].length} comments
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500">No comments yet</div>
                  )}

                  {/* Add Comment */}
                  <div className="p-4 border-t border-gray-100">
                    <div className="flex space-x-3">
                      {user?.profile_picture ? (
                        <img
                          src={user.profile_picture}
                          alt={`${user.first_name} ${user.last_name}`}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {user?.first_name?.charAt(0) || 'U'}
                        </div>
                      )}
                      <div className="flex-1 flex space-x-2">
                        <input
                          type="text"
                          value={newComments[post.id] || ''}
                          onChange={(e) => setNewComments(prev => ({ ...prev, [post.id]: e.target.value }))}
                          placeholder="Write a comment..."
                          className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                        />
                        <button
                          onClick={() => handleAddComment(post.id)}
                          disabled={!newComments[post.id]?.trim()}
                          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors"
                        >
                          Post
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              </div>
            ))}
          </div>
        </>
      )}
        </div>

      {/* Follow People Search Modal */}
      {showFollowSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Find People to Follow</h3>
              <button
                onClick={() => {
                  setShowFollowSearch(false);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchUsers(e.target.value);
                }}
                placeholder="Search for users..."
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Search Results */}
            <div className="max-h-64 overflow-y-auto">
              {searchLoading ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-2 p-4">
                  {searchResults.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {user.profile_picture ? (
                          <img
                            src={user.profile_picture}
                            alt={`${user.first_name} ${user.last_name}`}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <UserCircle className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="text-sm text-gray-500">@{user.username}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          // Follow functionality placeholder
                          alert(`Follow functionality coming soon for ${user.username}!`);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                      >
                        Follow
                      </button>
                    </div>
                  ))}
                </div>
              ) : searchQuery && !searchLoading ? (
                <div className="p-4 text-center text-gray-500">
                  No users found matching "{searchQuery}"
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  Start typing to search for users...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Right Sidebar - Groups */}
      <div className="w-80 flex-shrink-0 sticky top-4 self-start space-y-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
        {/* Groups Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <UserCircle className="w-5 h-5 mr-2" />
            My Groups
          </h3>
          
          {/* Mock Group Cards */}
          <div className="space-y-3 mb-4">
            {/* Group 1 */}
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">FG</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 truncate">Fitness Goals</h4>
                <p className="text-xs text-gray-500">124 members</p>
              </div>
              <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700 transition-colors">
                View
              </button>
            </div>

            {/* Group 2 */}
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">HR</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 truncate">Healthy Recipes</h4>
                <p className="text-xs text-gray-500">89 members</p>
              </div>
              <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700 transition-colors">
                View
              </button>
            </div>

            {/* Group 3 */}
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">WL</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 truncate">Weight Loss</h4>
                <p className="text-xs text-gray-500">203 members</p>
              </div>
              <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700 transition-colors">
                View
              </button>
            </div>
          </div>

          {/* Find More Groups Link */}
          <div className="text-center border-t border-gray-200 pt-4">
            <button 
              onClick={() => {
                // TODO: Navigate to groups discovery page
                console.log('Find more groups clicked');
              }}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline transition-colors"
            >
              Find more groups
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feed;






