// frontend/services/api.js
import axios from 'axios';
import { useAuthStore } from '../stores/auth';

// Создаем экземпляр axios с базовыми настройками
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000,
});

// Interceptor для запросов
api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore();
    const token = authStore.token;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    config.headers['Content-Type'] = 'application/json';
    
    console.log('🚀 API Request:', config.method?.toUpperCase(), config.url);
    console.log('📦 Headers:', config.headers);
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor для ответов
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      status: error.response?.status,
      message: error.message,
      code: error.code,
      url: error.config?.url
    });
    
    if (error.response?.status === 401) {
      const authStore = useAuthStore();
      console.log('🔒 Auth error, logging out...');
      authStore.logout();
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;