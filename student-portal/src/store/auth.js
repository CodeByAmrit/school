import { defineStore } from 'pinia';
import api from '../services/api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('student_token') || null,
    user: JSON.parse(localStorage.getItem('student_user')) || null,
    loading: false,
    error: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
  },

  actions: {
    async login(email, password) {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.post('/login', { email, password });
        const { token, user, forceChangePassword } = response.data;

        this.token = token;
        localStorage.setItem('student_token', token);
        
        // If user object is provided, use it. Else fetch.
        if (user) {
             this.user = user;
             localStorage.setItem('student_user', JSON.stringify(this.user));
        } else {
             await this.fetchUser();
        }
        
        return { success: true, forceChangePassword };
      } catch (err) {
        this.error = err.response?.data?.message || 'Login failed';
        return { success: false };
      } finally {
        this.loading = false;
      }
    },

    async fetchUser() {
      try {
        const response = await api.get('/me');
        this.user = response.data;
        localStorage.setItem('student_user', JSON.stringify(this.user));
      } catch (err) {
        console.error('Failed to fetch user', err);
        // If 401, interceptor handles it
      }
    },

    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('student_token');
      localStorage.removeItem('student_user');
      // Ideally call backend logout too
      // api.post('/logout').catch(() => {});
      // Redirect handled by router or component
    }
  }
});
