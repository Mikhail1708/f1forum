// src/stores/authStore.js
import { defineStore } from 'pinia';
import { authAPI } from '../services/api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('auth_token') || null,
    isAuthenticated: !!localStorage.getItem('auth_token'),
  }),

  actions: {
    async register(userData) {
      try {
        const response = await authAPI.register(userData);
        this.setAuth(response.data);
        return response;
      } catch (error) {
        throw error.response.data;
      }
    },

    async login(credentials) {
      try {
        const response = await authAPI.login(credentials);
        this.setAuth(response.data);
        return response;
      } catch (error) {
        throw error.response.data;
      }
    },

    async getProfile() {
      try {
        const response = await authAPI.getProfile();
        this.user = response.data.user;
        return response;
      } catch (error) {
        this.logout();
        throw error;
      }
    },

    setAuth(authData) {
      this.token = authData.token;
      this.user = authData.user;
      this.isAuthenticated = true;
      localStorage.setItem('auth_token', authData.token);
    },

    logout() {
      this.user = null;
      this.token = null;
      this.isAuthenticated = false;
      localStorage.removeItem('auth_token');
    },
  },
});