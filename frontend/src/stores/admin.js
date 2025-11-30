// frontend/stores/admin.js
import { defineStore } from 'pinia';
import api from '../services/api';

export const useAdminStore = defineStore('admin', {
  state: () => ({
    users: [],
    userStats: null,
    loading: false,
    usersLoading: false,
    currentPage: 1,
    totalPages: 1,
    searchQuery: '',
    adminStats: null
  }),

  getters: {
    totalUsers: (state) => state.userStats?.total_users || 0,
    adminCount: (state) => state.userStats?.admin_count || 0,
    moderatorCount: (state) => state.userStats?.moderator_count || 0,
    bannedCount: (state) => state.userStats?.banned_count || 0
  },

  actions: {
    // Загрузка пользователей для админки
    async fetchUsers(page = 1, limit = 20, search = '') {
      try {
        this.usersLoading = true;
        console.log('🚀 API Request: GET /admin/users');
        
        const response = await api.get(`/admin/users?page=${page}&limit=${limit}&search=${search}`);
        
        this.users = response.data.users || [];
        this.currentPage = response.data.pagination?.page || 1;
        this.totalPages = Math.ceil((response.data.pagination?.total || 0) / limit);
        this.searchQuery = search;

        console.log('✅ Admin users loaded:', this.users.length);
        return response.data;
      } catch (error) {
        console.error('❌ Fetch admin users error:', error);
        this.users = [];
        throw error;
      } finally {
        this.usersLoading = false;
      }
    },

    // Статистика пользователей
    async fetchUserStats() {
      try {
        console.log('🚀 API Request: GET /admin/users/stats');
        const response = await api.get('/admin/users/stats');
        this.userStats = response.data.stats;
        console.log('✅ User stats loaded:', this.userStats);
        return response.data;
      } catch (error) {
        console.error('❌ Fetch user stats error:', error);
        throw error;
      }
    },

    // Общая статистика админки
    async fetchAdminStats() {
      try {
        console.log('🚀 API Request: GET /admin/stats');
        const response = await api.get('/admin/stats');
        this.adminStats = response.data.stats;
        console.log('✅ Admin stats loaded:', this.adminStats);
        return response.data;
      } catch (error) {
        console.error('❌ Fetch admin stats error:', error);
        throw error;
      }
    },

    // Обновление роли пользователя
    async updateUserRole(userId, role) {
      try {
        console.log(`🚀 API Request: PUT /admin/users/${userId}/role`);
        const response = await api.put(`/admin/users/${userId}/role`, { role });
        
        // Обновляем локальное состояние
        const user = this.users.find(u => u.id === userId);
        if (user) {
          user.role = role;
        }
        
        console.log('✅ User role updated');
        return response.data;
      } catch (error) {
        console.error('❌ Update user role error:', error);
        throw error;
      }
    },

    // Обновление статуса пользователя
    async updateUserStatus(userId, status) {
      try {
        console.log(`🚀 API Request: PUT /admin/users/${userId}/status`);
        const response = await api.put(`/admin/users/${userId}/status`, { status });
        
        // Обновляем локальное состояние
        const user = this.users.find(u => u.id === userId);
        if (user) {
          user.status = status;
        }
        
        console.log('✅ User status updated');
        return response.data;
      } catch (error) {
        console.error('❌ Update user status error:', error);
        throw error;
      }
    },

    // Удаление пользователя
    async deleteUser(userId) {
      try {
        console.log(`🚀 API Request: DELETE /admin/users/${userId}`);
        const response = await api.delete(`/admin/users/${userId}`);
        
        // Удаляем из локального состояния
        this.users = this.users.filter(u => u.id !== userId);
        
        console.log('✅ User deleted');
        return response.data;
      } catch (error) {
        console.error('❌ Delete user error:', error);
        throw error;
      }
    },

    // Поиск пользователей
    async searchUsers(query) {
      try {
        console.log(`🚀 API Request: GET /admin/users/search?query=${query}`);
        const response = await api.get(`/admin/users/search?query=${encodeURIComponent(query)}`);
        return response.data.users;
      } catch (error) {
        console.error('❌ Search users error:', error);
        throw error;
      }
    },

    // Очистка данных
    clearUsers() {
      this.users = [];
      this.userStats = null;
      this.currentPage = 1;
      this.totalPages = 1;
      this.searchQuery = '';
    }
  }
});