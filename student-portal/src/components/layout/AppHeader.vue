<template>
  <header class="bg-white shadow z-10 sticky top-0">
    <div class="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex px-2 lg:px-0">
          <div class="flex-shrink-0 flex items-center md:hidden">
              <!-- Mobile menu button -->
             <button type="button" class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500" @click="$emit('open-mobile')">
              <span class="sr-only">Open main menu</span>
               <Menu class="block h-6 w-6" aria-hidden="true" />
            </button>
          </div>
           <!-- Optional: Breadcrumbs or Title could go here -->
        </div>
        <div class="flex items-center ml-4 lg:ml-6">
            <!-- User Status -->
            <div class="flex items-center">
                 <span class="text-sm font-medium text-gray-700 mr-4">{{ user?.name || 'Student' }}</span>
                 <button
                    @click="handleLogout"
                    class="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none"
                    title="Logout"
                 >
                    <LogOut class="h-6 w-6" />
                 </button>
            </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { Menu, LogOut } from 'lucide-vue-next';
import { useAuthStore } from '../../store/auth';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';

defineEmits(['open-mobile']);

const authStore = useAuthStore();
const { user } = storeToRefs(authStore);
const router = useRouter();

const handleLogout = () => {
    authStore.logout();
    router.push('/login');
};
</script>
