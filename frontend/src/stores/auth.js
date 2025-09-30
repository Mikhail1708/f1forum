import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null
  }),

  getters: {
    getUser: (state) => state.user,
    isLoggedIn: (state) => state.isAuthenticated,
  },

  actions: {
    async initialize() {
      const token = localStorage.getItem('authToken');
      if (token) {
        this.isAuthenticated = true;
        try {
          const userData = localStorage.getItem('user');
          if (userData) {
            this.user = JSON.parse(userData);
          }
        } catch (error) {
          console.error('Error initializing auth:', error);
          this.logout();
        }
      }
    },

    async login(credentials) {
      this.loading = true;
      this.error = null;
      try {
        console.log('Login attempt:', credentials);
        
        // Заглушка для демо
        this.user = {
          username: credentials.email.split('@')[0],
          email: credentials.email
        };
        this.isAuthenticated = true;
        
        localStorage.setItem('authToken', 'demo-token');
        localStorage.setItem('user', JSON.stringify(this.user));
        
        return { success: true };
      } catch (error) {
        this.error = error.message || 'Login failed';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async register(userData) {
      this.loading = true;
      this.error = null;
      try {
        console.log('Register attempt:', userData);
        return { success: true };
      } catch (error) {
        this.error = error.message || 'Registration failed';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async getProfile() {
      return this.user;
    },

    logout() {
      this.user = null;
      this.isAuthenticated = false;
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    }
  }
});