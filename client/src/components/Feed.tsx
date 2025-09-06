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
      setMonthData({ days: [] });
    }
  }, [currentDate]);

  const loadSidebarData = useCallback(async () => {
    if (!user) return;
    
    setSidebarLoading(true);
    try {
      // Load profile data
      const profileResponse = await fetch('/api/profile/me', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('nutritrack_auth_data')}`
        }
      });
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setProfileData(profileData);
      }

      // Load today's nutrition
      const today = new Date().toISOString().split('T')[0];
      const nutritionResponse = await fetch(`/api/meals/date/${today}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('nutritrack_auth_data')}`
        }
      });
      
      if (nutritionResponse.ok) {
        const nutritionData = await nutritionResponse.json();
        setTodayNutrition(nutritionData);
      }

      // Load month data for calendar
      await loadMonthData();
      
    } catch (error) {
      console.error('Error loading sidebar data:', error);
    } finally {
      setSidebarLoading(false);
    }
  }, [user, loadMonthData]);

  const loadPosts = async () => {
    try {
      const response = await fetch('/api/social/feed', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('nutritrack_auth_data')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: number) => {
    try {
      const response = await fetch(`/api/social/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('nutritrack_auth_data')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPosts(posts.map(post => 
          post.id === postId 
            ? { ...post, is_liked: data.is_liked, likes_count: data.likes_count }
            : post
        ));
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleBookmark = async (postId: number) => {
    try {
      const response = await fetch(`/api/social/posts/${postId}/bookmark`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('nutritrack_auth_data')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPosts(posts.map(post => 
          post.id === postId 
            ? { ...post, is_bookmarked: data.is_bookmarked }
            : post
        ));
      }
    } catch (error) {
      console.error('Error bookmarking post:', error);
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
          const response = await fetch(`/api/social/posts/${postId}/comments`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('nutritrack_auth_data')}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setComments(prev => ({ ...prev, [postId]: data }));
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
      }
    }
  };

  const handleAddComment = async (postId: number) => {
    const content = newComments[postId]?.trim();
    if (!content) return;

    try {
      const response = await fetch(`/api/social/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('nutritrack_auth_data')}`
        },
        body: JSON.stringify({ content })
      });

      if (response.ok) {
        const newComment = await response.json();
        setComments(prev => ({
          ...prev,
          [postId]: [...(prev[postId] || []), newComment]
        }));
        setNewComments(prev => ({ ...prev, [postId]: '' }));
        
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

  const handleCreatePost = async () => {
    if (!newPost.content.trim() && !newPost.imageFile) return;

    const formData = new FormData();
    formData.append('content', newPost.content);
    if (newPost.imageFile) {
      formData.append('image', newPost.imageFile);
    }
    if (newPost.mealData) {
      formData.append('meal_data', JSON.stringify(newPost.mealData));
    }
    formData.append('allow_comments', newPost.allowComments.toString());
    formData.append('hide_like_count', newPost.hideLikeCount.toString());

    try {
      const response = await fetch('/api/social/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('nutritrack_auth_data')}`
        },
        body: formData
      });

      if (response.ok) {
        const newPostData = await response.json();
        setPosts([newPostData, ...posts]);
        setNewPost({
          content: '',
          imageFile: null,
          mealData: null,
          allowComments: true,
          hideLikeCount: false
        });
        setShowCreatePost(false);
      }
    } catch (error) {
      console.error('Error creating post:', error);
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
      const response = await fetch(`/api/social/users/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('nutritrack_auth_data')}`
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
      const response = await fetch(`/api/social/users/${userId}/follow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('nutritrack_auth_data')}`
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
      loadPosts();
      loadSidebarData();
    }
  }, [user, loadSidebarData]);

  useEffect(() => {
    loadMonthData();
  }, [loadMonthData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-white">
        
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
                    <div className="text-xl font-bold text-blue-600">12</div>
                    <div className="text-xs text-gray-500">Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">48</div>
                    <div className="text-xs text-gray-500">Following</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-purple-600">124</div>
                    <div className="text-xs text-gray-500">Followers</div>
                  </div>
                </div>
                
                <button 
                  onClick={() => setShowFollowSearch(true)}
                  className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-md"
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
                      className="bg-blue-500 h-2.5 rounded-full transition-all duration-300" 
                      style={{ 
                        width: `${Math.min(100, ((todayNutrition.totalCalories || 0) / (todayNutrition.calorieGoal || 2000)) * 100)}%` 
                      }}
                    ></div>
                  </div>
                  
                  {/* Macros */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center bg-green-50 rounded-xl p-3">
                      <div className="text-green-600 font-semibold text-base">{todayNutrition.totalProtein || 0}g</div>
                      <div className="text-gray-500 text-xs">Protein</div>
                    </div>
                    <div className="text-center bg-yellow-50 rounded-xl p-3">
                      <div className="text-yellow-600 font-semibold text-base">{todayNutrition.totalCarbs || 0}g</div>
                      <div className="text-gray-500 text-xs">Carbs</div>
                    </div>
                    <div className="text-center bg-red-50 rounded-xl p-3">
                      <div className="text-red-600 font-semibold text-base">{todayNutrition.totalFat || 0}g</div>
                      <div className="text-gray-500 text-xs">Fat</div>
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
                        ${isCurrentDay ? 'bg-blue-500 text-white shadow-md' : ''}
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
            {/* Create Post Button */}
            <button
              onClick={() => setShowCreatePost(true)}
              className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl hover:bg-blue-700 transition-colors shadow-lg group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold">
                  {user?.first_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                </div>
                <span className="text-base font-medium">What's on your plate today?</span>
                <Plus className="w-5 h-5 ml-auto group-hover:rotate-90 transition-transform" />
              </div>
            </button>

            {/* Posts */}
            <div className="space-y-6">
              {posts.map(post => (
                <div key={post.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                  {/* Post Header */}
                  <div className="flex items-center justify-between p-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold shadow-md">
                        {post.user.first_name?.charAt(0) || post.user.username?.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{post.user.first_name} {post.user.last_name}</div>
                        <div className="text-sm text-gray-500">{formatPostDate(post.created_at)}</div>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Post Content */}
                  {post.content && (
                    <div className="px-6 pb-4">
                      <p className="text-gray-900 leading-relaxed">{post.content}</p>
                    </div>
                  )}

                  {/* Post Image */}
                  {post.image_url && (
                    <div className="relative overflow-hidden">
                      <img 
                        src={post.image_url} 
                        alt="Post" 
                        className="w-full object-cover max-h-80"
                      />
                    </div>
                  )}

                  {/* Meal Data */}
                  {post.meal_data && (
                    <div className="mx-6 my-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <div className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        Meal Information
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        <div className="text-center bg-white rounded-lg p-3">
                          <div className="font-semibold text-blue-600 text-base">{post.meal_data.calories || 0}</div>
                          <div className="text-gray-500 text-xs">Calories</div>
                        </div>
                        <div className="text-center bg-white rounded-lg p-3">
                          <div className="font-semibold text-green-600 text-base">{post.meal_data.protein || 0}g</div>
                          <div className="text-gray-500 text-xs">Protein</div>
                        </div>
                        <div className="text-center bg-white rounded-lg p-3">
                          <div className="font-semibold text-yellow-600 text-base">{post.meal_data.carbs || 0}g</div>
                          <div className="text-gray-500 text-xs">Carbs</div>
                        </div>
                        <div className="text-center bg-white rounded-lg p-3">
                          <div className="font-semibold text-red-600 text-base">{post.meal_data.fat || 0}g</div>
                          <div className="text-gray-500 text-xs">Fat</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Post Actions */}
                  <div className="px-6 py-4 border-t border-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6">
                        <button
                          onClick={() => handleLike(post.id)}
                          className={`flex items-center space-x-2 transition-colors ${
                            post.is_liked 
                              ? 'text-red-500' 
                              : 'text-gray-500 hover:text-red-500'
                          }`}
                        >
                          <Heart className={`w-5 h-5 ${post.is_liked ? 'fill-current' : ''}`} />
                          <span className="text-sm font-medium">{post.likes_count}</span>
                        </button>
                        <button
                          onClick={() => toggleComments(post.id)}
                          className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors"
                        >
                          <MessageCircle className="w-5 h-5" />
                          <span className="text-sm font-medium">{post.comments_count}</span>
                        </button>
                        <button className="text-gray-500 hover:text-green-500 transition-colors">
                          <Share className="w-5 h-5" />
                        </button>
                      </div>
                      <button
                        onClick={() => handleBookmark(post.id)}
                        className={`transition-colors ${
                          post.is_bookmarked 
                            ? 'text-blue-500' 
                            : 'text-gray-500 hover:text-blue-500'
                        }`}
                      >
                        <Bookmark className={`w-5 h-5 ${post.is_bookmarked ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Comments Section */}
                  {expandedComments.has(post.id) && (
                    <div className="px-6 py-4 border-t border-gray-50 bg-gray-50">
                      {/* Add Comment */}
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold">
                          {user?.first_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 flex items-center space-x-3">
                          <input
                            type="text"
                            placeholder="Add a comment..."
                            value={newComments[post.id] || ''}
                            onChange={(e) => setNewComments(prev => ({...prev, [post.id]: e.target.value}))}
                            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                          />
                          <button
                            onClick={() => handleAddComment(post.id)}
                            disabled={!newComments[post.id]?.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                          >
                            Post
                          </button>
                        </div>
                      </div>

                      {/* Comments List */}
                      <div className="space-y-3">
                        {comments[post.id]?.map(comment => (
                          <div key={comment.id} className="flex items-start space-x-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold">
                              {comment.user.first_name?.charAt(0) || comment.user.username?.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <div className="bg-white rounded-xl p-3 shadow-sm">
                                <div className="font-semibold text-sm text-gray-900 mb-1">{comment.user.first_name} {comment.user.last_name}</div>
                                <div className="text-gray-700">{comment.content}</div>
                              </div>
                              <div className="text-xs text-gray-500 mt-2 ml-3">{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</div>
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
              
              <button className="w-full mt-6 bg-indigo-600 text-white py-2.5 px-4 rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-md">
                Create Group
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">Create Post</h2>
              <button
                onClick={() => setShowCreatePost(false)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                  {user?.first_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                </div>
                <div className="flex-1">
                  <textarea
                    placeholder="What's on your mind?"
                    value={newPost.content}
                    onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={4}
                  />
                </div>
              </div>

              {newPost.imageFile && (
                <div className="relative">
                  <img
                    src={URL.createObjectURL(newPost.imageFile)}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-xl"
                  />
                  <button
                    onClick={() => setNewPost(prev => ({ ...prev, imageFile: null }))}
                    className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 cursor-pointer transition-colors">
                    <Image className="w-5 h-5" />
                    <span className="text-sm font-medium">Photo</span>
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
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreatePost}
                    disabled={!newPost.content.trim() && !newPost.imageFile}
                    className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    Post
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
                          {user.first_name?.charAt(0) || user.username?.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{user.first_name} {user.last_name}</div>
                          <div className="text-sm text-gray-500">@{user.username}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleFollow(user.id)}
                        className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                          user.is_following
                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
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