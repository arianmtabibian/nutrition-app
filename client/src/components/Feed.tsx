import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Heart, MessageCircle, Share, MoreHorizontal, PenTool, Bookmark, Image, X, Plus, UserCircle, Calendar, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { formatDistanceToNow, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface Post {
  id: number;
  content: string;
  image_url: string | null;
  meal_data: any;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
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
      
      console.log('Loading calendar data for:', { year, month });
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://nutrition-back-jtf3.onrender.com'}/api/diary/month/${year}/${month}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('Calendar response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Calendar data received:', data);
        setMonthData(data);
      } else {
        console.error('Calendar API error:', response.status, await response.text());
        // Set empty data structure as fallback
        setMonthData({
          year,
          month,
          days: []
        });
      }
    } catch (error) {
      console.error('Error loading month data:', error);
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
      
      const mealsResponse = await fetch(`${process.env.REACT_APP_API_URL || 'https://nutrition-back-jtf3.onrender.com'}/api/meals/date/${today}`, {
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
    }
  }, [user, loadFeed, loadSidebarData]);

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

  // Listen for meal updates to refresh sidebar
  useEffect(() => {
    const handleMealUpdate = (event: any) => {
      console.log('Meal update event received:', event.type);
      loadSidebarData();
    };

    // Listen to various meal-related events
    window.addEventListener('mealAdded', handleMealUpdate);
    window.addEventListener('mealDataChanged', handleMealUpdate);
    window.addEventListener('mealDeleted', handleMealUpdate);
    window.addEventListener('mealUpdated', handleMealUpdate);
    window.addEventListener('sidebarRefresh', handleMealUpdate);
    
    return () => {
      window.removeEventListener('mealAdded', handleMealUpdate);
      window.removeEventListener('mealDataChanged', handleMealUpdate);
      window.removeEventListener('mealDeleted', handleMealUpdate);
      window.removeEventListener('mealUpdated', handleMealUpdate);
      window.removeEventListener('sidebarRefresh', handleMealUpdate);
    };
  }, [loadSidebarData]);

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
    <div className="flex max-w-7xl mx-auto gap-6 p-4">
      {/* Sidebar */}
      <div className="w-80 flex-shrink-0 sticky top-4 self-start space-y-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {sidebarLoading ? (
            <div className="animate-pulse">
              <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
              <div className="flex justify-between mb-4">
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          ) : profileData ? (
            <>
              {/* Profile Image */}
              <div className="text-center mb-4">
                {profileData.profile?.profile_picture ? (
                  <img
                    src={profileData.profile.profile_picture}
                    alt={`${user?.first_name} ${user?.last_name}`}
                    className="w-20 h-20 rounded-full mx-auto object-cover border-4 border-blue-100"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto flex items-center justify-center border-4 border-blue-100">
                    <UserCircle className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>
              
              {/* Name */}
              <h2 className="text-xl font-semibold text-gray-900 text-center mb-1">
                {user?.first_name} {user?.last_name}
              </h2>
              <p className="text-gray-500 text-center text-sm mb-4">@{user?.username}</p>
              
              {/* Stats */}
              <div className="flex justify-between text-center mb-4">
                <div>
                  <div className="font-semibold text-lg text-gray-900">{profileData.stats?.posts || 0}</div>
                  <div className="text-xs text-gray-500">Posts</div>
                </div>
                <div>
                  <div className="font-semibold text-lg text-gray-900">{profileData.stats?.followers || 0}</div>
                  <div className="text-xs text-gray-500">Followers</div>
                </div>
                <div>
                  <div className="font-semibold text-lg text-gray-900">{profileData.stats?.following || 0}</div>
                  <div className="text-xs text-gray-500">Following</div>
                </div>
              </div>
              
              {/* Section Break */}
              <div className="border-t border-gray-200 pt-4">
                <button
                  onClick={() => navigate('/dashboard/inputs')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Meal</span>
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="text-gray-500">Unable to load profile</div>
            </div>
          )}
        </div>

        {/* Overview Summary Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Today's Overview
          </h3>
          
          {sidebarLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ) : todayNutrition ? (
            <div className="space-y-3">
              {/* Calorie Deficit */}
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Calorie Deficit:</span>
                <div className="flex items-center">
                  {todayNutrition.calorieDeficit > 0 ? (
                    <TrendingDown className="w-4 h-4 text-green-600 mr-1" />
                  ) : (
                    <TrendingUp className="w-4 h-4 text-red-600 mr-1" />
                  )}
                  <span className={`font-semibold ${todayNutrition.calorieDeficit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(todayNutrition.calorieDeficit)} cal
                  </span>
                </div>
              </div>
              
              {/* Protein */}
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Protein:</span>
                <span className="font-semibold text-gray-900">
                  {Math.round(todayNutrition.totalProtein)}g / {todayNutrition.proteinGoal}g
                </span>
              </div>
              
              {/* Progress Bars */}
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Calories</span>
                    <span>{todayNutrition.totalCalories} / {todayNutrition.calorieGoal}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${Math.min((todayNutrition.totalCalories / todayNutrition.calorieGoal) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Protein</span>
                    <span>{Math.round(todayNutrition.totalProtein)} / {todayNutrition.proteinGoal}g</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${Math.min((todayNutrition.totalProtein / todayNutrition.proteinGoal) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="text-gray-500">No data available</div>
            </div>
          )}
        </div>

        {/* Calendar Streak Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            {format(currentDate, 'MMMM yyyy')}
          </h3>
          
          {sidebarLoading ? (
            <div className="animate-pulse">
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} className="h-8 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {/* Day headers */}
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                  <div key={i} className="font-medium text-gray-500 py-2">
                    {day}
                  </div>
                ))}
                
                {/* Calendar days */}
                {monthData && eachDayOfInterval({
                  start: startOfMonth(currentDate),
                  end: endOfMonth(currentDate)
                }).map((date) => {
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const dayData = monthData.days?.find((d: any) => d.date === dateStr);
                  const hasData = dayData?.has_data;
                  const metGoals = dayData?.calories_met && dayData?.protein_met;
                  
                  return (
                    <div
                      key={dateStr}
                      className={`
                        h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium
                        ${isToday(date) ? 'ring-2 ring-blue-500' : ''}
                        ${!isSameMonth(date, currentDate) ? 'text-gray-300' : ''}
                        ${hasData 
                          ? metGoals 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                          : 'text-gray-400 hover:bg-gray-100'
                        }
                      `}
                    >
                      {format(date, 'd')}
                    </div>
                  );
                })}
              </div>
              
              {/* Legend */}
              <div className="flex items-center justify-center space-x-4 text-xs">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-100 rounded-full"></div>
                  <span className="text-gray-600">Goals met</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-yellow-100 rounded-full"></div>
                  <span className="text-gray-600">Partial</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Feed Content */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Create Post Button */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
        <button
          onClick={() => setShowCreatePost(true)}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          <PenTool className="w-5 h-5" />
          <span>Create a new post</span>
        </button>
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
        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post.id} className="border border-gray-200 rounded-lg">
              {/* Post Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  {post.user.profile_picture ? (
                    <img
                      src={post.user.profile_picture}
                      alt={`${post.user.first_name} ${post.user.last_name}`}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                      {post.user.first_name?.charAt(0) || post.user.username?.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-gray-900">
                      {post.user.first_name} {post.user.last_name}
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
                  <h4 className="font-semibold text-gray-800 mb-2">Meal Breakdown</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Calories:</span>
                      <span className="ml-2 font-medium">{post.meal_data.calories}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Protein:</span>
                      <span className="ml-2 font-medium">{post.meal_data.protein}g</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Carbs:</span>
                      <span className="ml-2 font-medium">{post.meal_data.carbs}g</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Fat:</span>
                      <span className="ml-2 font-medium">{post.meal_data.fat}g</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Post Actions */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center space-x-2 transition-colors ${
                        post.is_liked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                      }`}
                    >
                      <Heart className={`w-6 h-6 ${post.is_liked ? 'fill-current' : ''}`} />
                      {!post.hide_like_count || post.user.id === user?.id ? (
                        <span className="text-sm">{post.likes_count}</span>
                      ) : (
                        <span className="text-sm">•</span>
                      )}
                    </button>
                    {post.allow_comments !== false && (
                      <button 
                        onClick={() => handleToggleComments(post.id)}
                        className="flex items-center space-x-2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <MessageCircle className="w-6 h-6" />
                        <span className="text-sm">{post.comments_count}</span>
                      </button>
                    )}
                    <button className="text-gray-400 hover:text-gray-600 transition-colors">
                      <Share className="w-6 h-6" />
                    </button>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600 transition-colors">
                    <Bookmark className="w-6 h-6" />
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
      )}

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
    </div>
  );
};

export default Feed;






