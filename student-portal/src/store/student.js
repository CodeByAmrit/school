import { defineStore } from 'pinia';
import api from '../services/api';

export const useStudentStore = defineStore('student', {
  state: () => ({
    profile: null,
    results: null,
    files: [],
    settings: null,
    notifications: [],
    loading: {
      profile: false,
      results: false,
      files: false,
      settings: false,
      notifications: false,
    },
    error: null,
  }),

  actions: {
    async fetchProfile() {
      this.loading.profile = true;
      try {
        const response = await api.get('/profile');
        this.profile = response.data;
      } catch (err) {
        this.error = 'Failed to fetch profile';
        console.error(err);
      } finally {
        this.loading.profile = false;
      }
    },

    async fetchResults() {
      this.loading.results = true;
      try {
        const response = await api.get('/result');
        this.results = response.data;
      } catch (err) {
        this.error = 'Failed to fetch results';
        console.error(err);
      } finally {
        this.loading.results = false;
      }
    },

    async fetchFiles() {
      this.loading.files = true;
      try {
        const response = await api.get('/files');
        this.files = response.data;
      } catch (err) {
        this.error = 'Failed to fetch files';
        console.error(err);
      } finally {
        this.loading.files = false;
      }
    },

    async fetchSettings() {
      this.loading.settings = true;
      try {
        const response = await api.get('/settings');
        this.settings = response.data;
      } catch (err) {
        this.error = 'Failed to fetch settings';
        console.error(err);
      } finally {
        this.loading.settings = false;
      }
    },

    async updateSettings(newSettings) {
      this.loading.settings = true;
      try {
        const response = await api.put('/settings', newSettings);
        this.settings = response.data;
        return true;
      } catch (err) {
        this.error = 'Failed to update settings';
        console.error(err);
        return false;
      } finally {
        this.loading.settings = false;
      }
    },
    
    async fetchNotifications() {
      this.loading.notifications = true;
      try {
        const response = await api.get('/notifications');
        this.notifications = response.data;
      } catch (err) {
        this.error = 'Failed to fetch notifications';
        console.error(err);
      } finally {
        this.loading.notifications = false;
      }
    },

    async markNotificationRead(id) {
       try {
         await api.put(`/notifications/${id}/read`);
         // Optimistically update local state or refetch
         const notif = this.notifications.find(n => n.id === id);
         if (notif) notif.read = true;
       } catch (err) {
         console.error(err);
       }
    }
  }
});
