// frontend/stores/auth.js
import { defineStore } from 'pinia';
import api from '../services/api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: false,
  }),
    getters: {
    isAdmin: (state) => state.user?.role === 'admin',
    isModerator: (state) => state.user?.role === 'moderator' || state.user?.role === 'admin',
    isModeratorOnly: (state) => state.user?.role === 'moderator',
  },

  actions: {
    async login(credentials) {
      try {
        const response = await api.post('/auth/login', credentials);
        
        if (response.data.success) {
          this.token = response.data.token;
          this.user = response.data.user;
          this.isAuthenticated = true;
          
          localStorage.setItem('token', this.token);
          
          // Добавляем токен в заголовки по умолчанию
          api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
          
          return { success: true };
        }
      } catch (error) {
        console.error('Login error:', error);
        return { 
          success: false, 
          error: error.response?.data?.error || 'Login failed' 
        };
      }
    },

    async checkAuth() {
      if (!this.token) return false;
      
      try {
        // Добавляем токен в заголовки перед проверкой
        api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
        
        const response = await api.get('/auth/me');
        
        if (response.data.success) {
          this.user = response.data.user;
          this.isAuthenticated = true;
          return true;
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        this.logout();
        return false;
      }
    },

    logout() {
      this.user = null;
      this.token = null;
      this.isAuthenticated = false;
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    }
  }
  
});
