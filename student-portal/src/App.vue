<template>
  <div v-if="showLayout" class="h-screen flex overflow-hidden bg-gray-100">
    <AppSidebar :mobile-open="mobileOpen" @close-mobile="mobileOpen = false" />
    
    <div class="flex flex-col w-0 flex-1 overflow-hidden">
      <AppHeader @open-mobile="mobileOpen = true" />
      
      <main class="flex-1 relative overflow-y-auto focus:outline-none">
        <div class="py-6">
           <div class="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
             <router-view></router-view>
           </div>
        </div>
      </main>
    </div>
  </div>
  <template v-else>
     <router-view></router-view>
  </template>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import AppSidebar from './components/layout/AppSidebar.vue';
import AppHeader from './components/layout/AppHeader.vue';

const route = useRoute();
const mobileOpen = ref(false);

const showLayout = computed(() => {
  return route.meta.requiresAuth;
});
</script>
