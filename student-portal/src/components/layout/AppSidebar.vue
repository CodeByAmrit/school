<template>
  <aside class="hidden md:flex md:w-64 md:flex-col fixed inset-y-0 z-10 bg-white border-r border-gray-200">
    <div class="flex items-center justify-center h-16 border-b border-gray-200 px-4">
      <h1 class="text-xl font-bold text-indigo-600">Student Portal</h1>
    </div>
    <div class="flex-1 flex flex-col overflow-y-auto pt-5 pb-4">
      <nav class="mt-5 flex-1 px-2 space-y-1">
        <router-link
          v-for="item in navigation"
          :key="item.name"
          :to="item.href"
          :class="[
            item.current ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
            'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
          ]"
        >
          <component :is="item.icon" :class="[item.current ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500', 'mr-3 flex-shrink-0 h-6 w-6']" aria-hidden="true" />
          {{ item.name }}
        </router-link>
      </nav>
    </div>
    <div class="flex-shrink-0 flex border-t border-gray-200 p-4">
      <div class="flex items-center">
         <div class="ml-3">
          <p class="text-xs font-medium text-gray-500 group-hover:text-gray-700">
             School Name &copy; 2026
          </p>
        </div>
      </div>
    </div>
  </aside>

  <!-- Mobile menu -->
  <div v-if="mobileOpen" class="relative z-40 md:hidden" role="dialog" aria-modal="true">
      <div class="fixed inset-0 bg-gray-600 bg-opacity-75"></div>
      <div class="fixed inset-0 flex z-40">
        <div class="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div class="absolute top-0 right-0 -mr-12 pt-2">
                <button type="button" class="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white" @click="$emit('close-mobile')">
                    <span class="sr-only">Close sidebar</span>
                    <!-- X icon -->
                    <svg class="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
             <div class="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                <div class="flex-shrink-0 flex items-center px-4">
                   <h1 class="text-xl font-bold text-indigo-600">Student Portal</h1>
                </div>
                <nav class="mt-5 px-2 space-y-1">
                   <router-link
                    v-for="item in navigation"
                    :key="item.name"
                    :to="item.href"
                     @click="$emit('close-mobile')"
                    :class="[
                        item.current ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                        'group flex items-center px-2 py-2 text-base font-medium rounded-md'
                    ]"
                    >
                    <component :is="item.icon" :class="[item.current ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500', 'mr-4 flex-shrink-0 h-6 w-6']" aria-hidden="true" />
                    {{ item.name }}
                    </router-link>
                </nav>
             </div>
        </div>
      </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { LayoutDashboard, User, GraduationCap, FileText, Settings } from 'lucide-vue-next';

defineProps({
    mobileOpen: Boolean
});

defineEmits(['close-mobile']);

const route = useRoute();

const navigation = computed(() => {
    const currentPath = route.path;
    return [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, current: currentPath === '/dashboard' },
        { name: 'Profile', href: '/profile', icon: User, current: currentPath === '/profile' },
        { name: 'Results', href: '/results', icon: GraduationCap, current: currentPath === '/results' },
        { name: 'Documents', href: '/documents', icon: FileText, current: currentPath === '/documents' },
        { name: 'Settings', href: '/settings', icon: Settings, current: currentPath === '/settings' },
    ];
});
</script>
