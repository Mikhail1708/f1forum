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
    isAdmin: (state) => {
      console.log('🔍 Checking admin role:', state.user?.role);
      return state.user?.role === 'admin';
    },
    isModerator: (state) => {
      const isMod = state.user?.role === 'moderator' || state.user?.role === 'admin';
      console.log('🔍 Checking moderator role:', state.user?.role, 'result:', isMod);
      return isMod;
    },
    isModeratorOnly: (state) => state.user?.role === 'moderator',
  },

  actions: {
    async login(credentials) {
      try {
        console.log('🔐 Attempting login with:', credentials.email);
        const response = await api.post('/auth/login', credentials);
        
        if (response.data.success) {
          this.token = response.data.token;
          this.user = response.data.user;
          this.isAuthenticated = true;
          
          localStorage.setItem('token', this.token);
          localStorage.setItem('user', JSON.stringify(this.user));
          
          // Добавляем токен в заголовки по умолчанию
          api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
          
          console.log('✅ Login successful, user:', this.user);
          return { success: true };
        }
      } catch (error) {
        console.error('❌ Login error:', error);
        return { 
          success: false, 
          error: error.response?.data?.error || 'Login failed' 
        };
      }
    },

    async checkAuth() {
      if (!this.token) {
        console.log('❌ No token for auth check');
        return false;
      }
      
      try {
        console.log('🔄 Checking authentication...');
        // Добавляем токен в заголовки перед проверкой
        api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
        
        const response = await api.get('/auth/me');
        
        if (response.data.success) {
          this.user = response.data.user;
          this.isAuthenticated = true;
          console.log('✅ Auth check successful, user:', this.user);
          return true;
        }
      } catch (error) {
        console.error('❌ Auth check failed:', error);
        this.logout();
        return false;
      }
    },

    logout() {
      console.log('🚪 Logging out...');
      this.user = null;
      this.token = null;
      this.isAuthenticated = false;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
    }
  }
});