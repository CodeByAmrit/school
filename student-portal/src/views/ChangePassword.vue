<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Change Your Password
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          For your security, you must change your password on first login.
        </p>
      </div>
      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div class="rounded-md shadow-sm -space-y-px">
          <div>
            <label for="new-password" class="sr-only">New Password</label>
            <input 
              id="new-password" 
              name="new-password" 
              type="password" 
              v-model="newPassword" 
              required 
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" 
              placeholder="New Password" 
            />
          </div>
          <div>
            <label for="confirm-password" class="sr-only">Confirm Password</label>
            <input 
              id="confirm-password" 
              name="confirm-password" 
              type="password" 
              v-model="confirmPassword" 
              required 
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" 
              placeholder="Confirm New Password" 
            />
          </div>
        </div>

        <div v-if="error" class="text-red-500 text-sm text-center">
            {{ error }}
        </div>

        <div>
          <button 
            type="submit" 
            :disabled="loading"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <span v-if="loading">Processing...</span>
            <span v-else>Update Password</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth';
import api from '../services/api';

const router = useRouter();
const authStore = useAuthStore();
const newPassword = ref('');
const confirmPassword = ref('');
const error = ref('');
const loading = ref(false);

const handleSubmit = async () => {
    error.value = '';
    if (newPassword.value.length < 6) {
        error.value = 'Password must be at least 6 characters.';
        return;
    }
    if (newPassword.value !== confirmPassword.value) {
        error.value = 'Passwords do not match.';
        return;
    }

    loading.value = true;
    try {
        await api.post('/change-password', { newPassword: newPassword.value });
        alert('Password changed successfully! Please login again with your new password.');
        authStore.logout();
        router.push('/login');
    } catch (err) {
        error.value = err.response?.data?.message || 'Failed to update password.';
    } finally {
        loading.value = false;
    }
};
</script>
