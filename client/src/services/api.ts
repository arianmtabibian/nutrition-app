import axios from 'axios';

// Create axios instance
export const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
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
};

export const diaryAPI = {
  getMonth: (year: number, month: number) => 
    api.get(`/api/diary/${year}/${month}`),
  getDate: (date: string) => api.get(`/api/diary/date/${date}`),
  getWeek: (startDate: string) => api.get(`/api/diary/week/${startDate}`),
  getMonthSummary: (year: number, month: number) => 
    api.get(`/api/diary/month/${year}/${month}/summary`),
};
