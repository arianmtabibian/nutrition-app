import axios from 'axios';

// Create axios instance with timeout for better performance
export const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://nutrition-back-jtf3.onrender.com',
  timeout: 30000, // 30 second timeout for post creation with images
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token - Use consistent auth system
api.interceptors.request.use(
  (config) => {
    // Try to get token from the new auth system first, fallback to old system
    let token = localStorage.getItem('token');
    
    // Check if we have the newer auth data format
    const authDataStr = localStorage.getItem('nutritrack_auth_data');
    if (authDataStr) {
      try {
        const authData = JSON.parse(authDataStr);
        if (authData.token) {
          token = authData.token;
        }
      } catch (error) {
        console.warn('Failed to parse auth data:', error);
      }
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors - More intelligent handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect to login on actual authentication failures, not network issues
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log('🔐 Authentication failed, clearing auth data and redirecting to login');
      
      // Add a small delay to prevent race conditions with multiple API calls
      setTimeout(() => {
        // Clear all auth data using both systems
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('domain');
        localStorage.removeItem('nutritrack_auth_data');
        
        // Use React Router navigation instead of hard redirect to prevent 404s
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
          // Dispatch a custom event that the AuthContext can handle
          window.dispatchEvent(new CustomEvent('auth-logout'));
        }
      }, 100); // Small delay to prevent race conditions
    } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      // Network timeout - let AuthContext handle auth decisions, just log here
      console.warn('🌐 Network timeout detected, letting AuthContext handle auth state');
    } else if (error.response?.status >= 500) {
      // Server errors shouldn't cause logout
      console.warn('🌐 Server error, keeping user logged in');
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: (email: string, password: string) => 
    api.post('/api/auth/login', { email, password }),
  register: (email: string, password: string, first_name: string, last_name: string, username: string) => 
    api.post('/api/auth/register', { email, password, first_name, last_name, username }),
};

export const profileAPI = {
  get: () => api.get('/api/profile'),
  update: (data: any) => api.put('/api/profile', data),
  calculateCalories: (data: any) => api.post('/api/profile/calculate-calories', data),
};

export const mealsAPI = {
  add: (data: any) => api.post('/api/meals', data),
  getByDate: (date: string) => api.get(`/api/meals/${date}`),
  getByRange: (startDate: string, endDate: string) => 
    api.get(`/api/meals/range/${startDate}/${endDate}`),
  update: (id: number, data: any) => api.put(`/api/meals/${id}`, data),
  delete: (id: number) => api.delete(`/api/meals/${id}`),
  recalculateDailyNutrition: (startDate: string, endDate: string) => 
    api.post('/api/meals/recalculate-daily-nutrition', { startDate, endDate }),
};

export const diaryAPI = {
  getMonth: (year: number, month: number) => 
    api.get(`/api/diary/${year}/${month}`),
  getDate: (date: string) => api.get(`/api/diary/date/${date}`),
  getWeek: (startDate: string) => api.get(`/api/diary/week/${startDate}`),
  getMonthSummary: (year: number, month: number) => 
    api.get(`/api/diary/month/${year}/${month}/summary`),
};

export const favoritesAPI = {
  getAll: () => api.get('/api/favorites'),
  create: (data: any) => api.post('/api/favorites', data),
  createFromMeal: (mealId: number, customName?: string) => 
    api.post('/api/favorites/from-meal', { mealId, customName }),
  update: (id: number, data: any) => api.put(`/api/favorites/${id}`, data),
  delete: (id: number) => api.delete(`/api/favorites/${id}`),
};

export const socialAPI = {
  // Posts
  createPost: (formData: FormData) => {
    return api.post('/api/social/posts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 45000, // Extra long timeout for post creation
    });
  },
  getUserPosts: (userId: number) => api.get(`/api/social/posts/${userId}`),
  getFeed: () => api.get('/api/social/feed'),
  likePost: (postId: number) => api.post(`/api/social/posts/${postId}/like`),
  bookmarkPost: (postId: number) => api.post(`/api/social/posts/${postId}/favorite`),
  
  // Profile
  getProfile: (userId: number) => api.get(`/api/social/profile/${userId}`),
  getLikedPosts: (userId: number) => api.get(`/api/social/profile/${userId}/liked-posts`),
  getBookmarkedPosts: (userId: number) => api.get(`/api/social/profile/${userId}/favorited-posts`),
  
  // Comments
  getComments: (postId: number) => api.get(`/api/social/posts/${postId}/comments`),
  addComment: (postId: number, content: string) => 
    api.post(`/api/social/posts/${postId}/comments`, { content }),
  
  // Search
  search: (query: string) => api.get(`/api/social/search?q=${encodeURIComponent(query)}`),
  
  // Follow/Unfollow
  followUser: (userId: number) => api.post(`/api/social/follow/${userId}`),
};
