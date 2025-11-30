// frontend/stores/profile.js - ИСПРАВЛЕННАЯ ВЕРСИЯ
import { defineStore } from 'pinia';
import api from '../services/api';

export const useProfileStore = defineStore('profile', {
  state: () => ({
    userProfile: null,
    userTopics: [],
    userComments: [],
    userWarnings: [],
    notifications: [],
    unreadNotificationsCount: 0,
    loading: false,
    topicsLoading: false,
    commentsLoading: false,
    warningsLoading: false
  }),

  getters: {
    getUserStats: (state) => state.userProfile?.stats || {},
    hasUnreadNotifications: (state) => state.unreadNotificationsCount > 0,
    topicsCount: (state) => state.userTopics.length,
    commentsCount: (state) => state.userComments.length,
    warningsCount: (state) => state.userWarnings.length
  },

  actions: {
    async fetchUserProfile() {
      try {
        this.loading = true;
        const response = await api.get('/profile');
        this.userProfile = response.data.data;
        console.log('📊 User profile loaded:', this.userProfile);
        return response.data;
      } catch (error) {
        console.error('Fetch profile error:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchUserTopics(limit = 20, offset = 0) {
      try {
        this.topicsLoading = true;
        const response = await api.get(`/profile/topics?limit=${limit}&offset=${offset}`);
        this.userTopics = response.data.data || [];
        console.log('📝 User topics loaded:', this.userTopics.length);
        return response.data;
      } catch (error) {
        console.error('Fetch user topics error:', error);
        this.userTopics = [];
        throw error;
      } finally {
        this.topicsLoading = false;
      }
    },

    async fetchUserComments(limit = 20, offset = 0) {
      try {
        this.commentsLoading = true;
        const response = await api.get(`/profile/comments?limit=${limit}&offset=${offset}`);
        this.userComments = response.data.data || [];
        console.log('💬 User comments loaded:', this.userComments.length);
        return response.data;
      } catch (error) {
        console.error('Fetch user comments error:', error);
        this.userComments = [];
        throw error;
      } finally {
        this.commentsLoading = false;
      }
    },

    async fetchUserWarnings() {
      try {
        this.warningsLoading = true;
        const response = await api.get('/profile/warnings');
        this.userWarnings = response.data.data || [];
        console.log('⚠️ User warnings loaded:', this.userWarnings.length);
        return response.data;
      } catch (error) {
        console.error('Fetch user warnings error:', error);
        this.userWarnings = [];
        throw error;
      } finally {
        this.warningsLoading = false;
      }
    },

    async fetchNotifications(limit = 20, offset = 0) {
      try {
        const response = await api.get(`/profile/notifications?limit=${limit}&offset=${offset}`);
        this.notifications = response.data.data.notifications || [];
        this.unreadNotificationsCount = response.data.data.unreadCount || 0;
        return response.data;
      } catch (error) {
        console.error('Fetch notifications error:', error);
        throw error;
      }
    },

    async markNotificationAsRead(notificationId) {
      try {
        await api.patch(`/profile/notifications/${notificationId}/read`);
        
        // Обновляем локальное состояние
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
          notification.is_read = true;
          notification.read_at = new Date().toISOString();
          this.unreadNotificationsCount = Math.max(0, this.unreadNotificationsCount - 1);
        }
      } catch (error) {
        console.error('Mark notification as read error:', error);
        throw error;
      }
    },

    async markAllNotificationsAsRead() {
      try {
        await api.patch('/profile/notifications/read-all');
        
        // Обновляем локальное состояние
        this.notifications.forEach(notification => {
          if (!notification.is_read) {
            notification.is_read = true;
            notification.read_at = new Date().toISOString();
          }
        });
        this.unreadNotificationsCount = 0;
      } catch (error) {
        console.error('Mark all notifications as read error:', error);
        throw error;
      }
    },

    async changePassword(passwordData) {
      try {
        const response = await api.post('/profile/change-password', passwordData);
        return response.data;
      } catch (error) {
        console.error('Change password error:', error);
        throw error;
      }
    },

    async updateProfile(profileData) {
      try {
        const response = await api.put('/profile', profileData);
        if (this.userProfile) {
          this.userProfile.user = { ...this.userProfile.user, ...response.data.data };
        }
        return response.data;
      } catch (error) {
        console.error('Update profile error:', error);
        throw error;
      }
    },

    async verifyEmail() {
      try {
        const response = await api.post('/profile/verify-email');
        // Обновляем профиль чтобы показать подтвержденный email
        await this.fetchUserProfile();
        return response.data;
      } catch (error) {
        console.error('Verify email error:', error);
        throw error;
      }
    },

    clearProfile() {
      this.userProfile = null;
      this.userTopics = [];
      this.userComments = [];
      this.userWarnings = [];
      this.notifications = [];
      this.unreadNotificationsCount = 0;
    }
  }
});