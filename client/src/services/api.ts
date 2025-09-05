import axios from 'axios';

// Create axios instance with timeout for better performance
export const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://nutrition-back-jtf3.onrender.com',
  timeout: 25000, // 25 second timeout - more forgiving for slower connections
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
      
      // Clear all auth data using both systems
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('domain');
      localStorage.removeItem('nutritrack_auth_data');
      
      // Only redirect if we're not already on the login page
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      // Network timeout - don't log out, just let the error propagate
      console.warn('🌐 Network timeout, keeping user logged in');
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
