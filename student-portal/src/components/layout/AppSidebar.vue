<template>
  <!-- Desktop Sidebar -->
  <aside
    id="student-sidebar"
    class="fixed top-0 left-0 z-40 w-64 h-screen transition-transform -translate-x-full sm:translate-x-0 bg-gradient-to-b from-blue-50 to-white border-r border-blue-100"
    aria-label="Student Sidebar"
  >
    <!-- Logo Section -->
    <div
      class="px-4 py-6 flex justify-center items-center border-b border-blue-100 bg-white"
    >
      <a href="/" class="flex items-center">
        <span
          class="self-center text-xl font-bold bg-gradient-to-r from-[#63b3ed] to-[#3182ce] bg-clip-text text-transparent whitespace-nowrap"
          >Student Tracker</span
        >
      </a>
    </div>

    <div
      class="h-full px-3 pb-4 overflow-y-auto bg-gradient-to-t from-blue-50 to-white"
    >
      <!-- Main Navigation -->
      <ul class="space-y-1 font-medium mt-6">
        <li v-for="item in navigation" :key="item.name">
          <router-link
            :to="item.href"
            :class="[
              'group relative flex items-center p-4 rounded-xl transition-all duration-300',
              item.current
                ? 'bg-gradient-to-r from-blue-50 to-white text-blue-600'
                : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-white hover:text-blue-600'
            ]"
            @click="closeMobileMenu"
          >
            <!-- Active Indicator -->
            <div
              :class="[
                'absolute left-0 w-1 h-6 bg-[#3182ce] rounded-r-full transition-opacity duration-300',
                item.current ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              ]"
            ></div>

            <!-- Icon Container -->
            <div
              :class="[
                'w-10 h-10 rounded-xl border border-blue-200 flex items-center justify-center mr-3 transition-all duration-300',
                item.current
                  ? 'bg-gradient-to-br from-blue-200 to-blue-100'
                  : 'bg-gradient-to-br from-blue-100 to-white group-hover:bg-gradient-to-br group-hover:from-blue-200 group-hover:to-blue-100'
              ]"
            >
              <i :class="[item.icon, 'text-blue-600 text-sm']"></i>
            </div>

            <span class="font-medium">{{ item.name }}</span>

            <!-- Hover/Active Indicator -->
            <i
              :class="[
                'fas fa-chevron-right text-blue-400 ml-auto text-xs transition-all duration-300',
                item.current
                  ? 'opacity-100 translate-x-1'
                  : 'opacity-0 group-hover:opacity-100 group-hover:translate-x-1'
              ]"
            ></i>
          </router-link>
        </li>

        <!-- Divider with Label -->
        <li class="pt-6 pb-2">
          <div class="px-4">
            <div class="flex items-center">
              <div
                class="flex-1 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent"
              ></div>
              <span
                class="px-3 text-xs font-medium text-blue-500 bg-blue-50 rounded-full"
                >STUDENT</span
              >
              <div
                class="flex-1 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent"
              ></div>
            </div>
          </div>
        </li>

        <!-- Additional Features for Students -->
        <li>
          <a
            href="/certificates"
            class="group relative flex items-center p-4 text-gray-700 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-white hover:text-blue-600 transition-all duration-300"
            @click="closeMobileMenu"
          >
            <!-- Active Indicator -->
            <div
              class="absolute left-0 w-1 h-6 bg-[#3182ce] rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            ></div>

            <!-- Icon Container -->
            <div
              class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-white border border-blue-200 flex items-center justify-center mr-3 group-hover:bg-gradient-to-br group-hover:from-blue-200 group-hover:to-blue-100 transition-all duration-300"
            >
              <i class="fas fa-award text-blue-600 text-sm"></i>
            </div>

            <span class="font-medium">Certificates</span>

            <!-- Hover Indicator -->
            <i
              class="fas fa-chevron-right text-blue-400 ml-auto text-xs opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300"
            ></i>
          </a>
        </li>

        <li>
          <a
            href="/timetable"
            class="group relative flex items-center p-4 text-gray-700 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-white hover:text-blue-600 transition-all duration-300"
            @click="closeMobileMenu"
          >
            <!-- Active Indicator -->
            <div
              class="absolute left-0 w-1 h-6 bg-[#3182ce] rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            ></div>

            <!-- Icon Container -->
            <div
              class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-white border border-blue-200 flex items-center justify-center mr-3 group-hover:bg-gradient-to-br group-hover:from-blue-200 group-hover:to-blue-100 transition-all duration-300"
            >
              <i class="fas fa-calendar-alt text-blue-600 text-sm"></i>
            </div>

            <span class="font-medium">Timetable</span>

            <!-- Hover Indicator -->
            <i
              class="fas fa-chevron-right text-blue-400 ml-auto text-xs opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300"
            ></i>
          </a>
        </li>
      </ul>

      <!-- User Profile Section -->
      <div
        class="absolute bottom-0 left-0 right-0 p-4 border-t border-blue-100 bg-white"
      >
        <div class="flex items-center">
          <!-- Avatar -->
          <div
            class="w-10 h-10 rounded-xl bg-gradient-to-br from-[#63b3ed] to-[#3182ce] flex items-center justify-center mr-3"
          >
            <span class="text-white font-bold text-sm">
              {{ userInitials }}
            </span>
          </div>

          <!-- User Info -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">
              {{ userName }}
            </p>
            <p class="text-xs text-blue-600 font-medium truncate">Student</p>
          </div>

          <!-- Dropdown Button -->
          <button
            id="studentMenuButton"
            type="button"
            class="p-2 rounded-lg hover:bg-blue-50 transition-colors duration-300"
            @click="toggleUserMenu"
            aria-haspopup="true"
            :aria-expanded="userMenuOpen"
          >
            <i
              :class="[
                'fas text-blue-400 text-xs transition-transform duration-300',
                userMenuOpen ? 'fa-chevron-up' : 'fa-chevron-down'
              ]"
            ></i>
          </button>
        </div>

        <!-- Dropdown Menu -->
        <div
          v-if="userMenuOpen"
          id="student-menu"
          class="mt-3 space-y-1 animate-fadeIn"
          role="menu"
          aria-label="Student menu"
        >
          <router-link
            to="/profile"
            class="flex items-center px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-blue-50 transition-colors duration-300"
            role="menuitem"
            @click="closeMenus"
          >
            <i class="fas fa-user-circle text-blue-500 mr-2 text-sm"></i>
            Profile
          </router-link>

          <router-link
            to="/settings"
            class="flex items-center px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-blue-50 transition-colors duration-300"
            role="menuitem"
            @click="closeMenus"
          >
            <i class="fas fa-cog text-blue-500 mr-2 text-sm"></i>
            Settings
          </router-link>

          <div class="border-t border-blue-100 pt-1">
            <a
              href="/logout"
              class="flex items-center px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 transition-colors duration-300"
              role="menuitem"
              @click="closeMenus"
            >
              <i class="fas fa-sign-out-alt mr-2 text-sm"></i>
              Logout
            </a>
          </div>
        </div>
      </div>
    </div>
  </aside>

  <!-- Mobile Menu Overlay -->
  <div
    v-if="mobileOpen"
    class="fixed inset-0 z-30 bg-gray-600 bg-opacity-75 transition-opacity duration-300 md:hidden"
    @click="$emit('close-mobile')"
  ></div>

  <!-- Mobile Sidebar -->
  <div
    v-if="mobileOpen"
    class="fixed inset-0 z-40 flex md:hidden"
    role="dialog"
    aria-modal="true"
  >
    <div
      class="relative flex-1 flex flex-col max-w-xs w-full h-full bg-gradient-to-b from-blue-50 to-white transform transition-transform duration-300 ease-in-out"
      :class="mobileOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <!-- Close Button -->
      <div class="absolute top-4 right-4">
        <button
          type="button"
          class="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors duration-300 shadow-lg"
          @click="$emit('close-mobile')"
        >
          <span class="sr-only">Close sidebar</span>
          <i class="fas fa-times text-blue-600 text-lg"></i>
        </button>
      </div>

      <!-- Logo Section (Mobile) -->
      <div
        class="px-6 py-6 flex justify-center items-center border-b border-blue-100 bg-white"
      >
        <span
          class="self-center text-xl font-bold bg-gradient-to-r from-[#63b3ed] to-[#3182ce] bg-clip-text text-transparent whitespace-nowrap"
          >StudentPortal</span
        >
      </div>

      <!-- Mobile Navigation -->
      <div class="flex-1 overflow-y-auto py-6 px-4">
        <ul class="space-y-1">
          <li v-for="item in navigation" :key="item.name">
            <router-link
              :to="item.href"
              :class="[
                'group relative flex items-center p-4 rounded-xl transition-all duration-300',
                item.current
                  ? 'bg-gradient-to-r from-blue-50 to-white text-blue-600'
                  : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-white hover:text-blue-600'
              ]"
              @click="$emit('close-mobile')"
            >
              <!-- Icon Container -->
              <div
                :class="[
                  'w-10 h-10 rounded-xl border border-blue-200 flex items-center justify-center mr-3',
                  item.current
                    ? 'bg-gradient-to-br from-blue-200 to-blue-100'
                    : 'bg-gradient-to-br from-blue-100 to-white'
                ]"
              >
                <i :class="[item.icon, 'text-blue-600 text-sm']"></i>
              </div>

              <span class="font-medium">{{ item.name }}</span>

              <!-- Active Indicator -->
              <div
                v-if="item.current"
                class="absolute left-0 w-1 h-6 bg-[#3182ce] rounded-r-full"
              ></div>
            </router-link>
          </li>
        </ul>

        <!-- Mobile User Info -->
        <div class="mt-8 pt-6 border-t border-blue-100">
          <div class="flex items-center px-2">
            <div
              class="w-10 h-10 rounded-xl bg-gradient-to-br from-[#63b3ed] to-[#3182ce] flex items-center justify-center mr-3"
            >
              <span class="text-white font-bold text-sm">{{ userInitials }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">
                {{ userName }}
              </p>
              <p class="text-xs text-blue-600 font-medium truncate">Student</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../store/auth'
import { storeToRefs } from 'pinia'

defineProps({
  mobileOpen: Boolean
})

const emit = defineEmits(['close-mobile'])

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const userMenuOpen = ref(false)

// User data
const userName = computed(() => user.value?.name || 'Student')
const userInitials = computed(() => {
  const name = userName.value || 'Student'
  const names = name.split(' ')
  return names.map(n => n[0]).join('').toUpperCase().substring(0, 2)
})

const navigation = computed(() => {
  const currentPath = route.path
  return [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: 'fas fa-chart-pie',
      current: currentPath === '/dashboard' || currentPath === '/' 
    },
    { 
      name: 'Profile', 
      href: '/profile', 
      icon: 'fas fa-user',
      current: currentPath === '/profile' 
    },
    { 
      name: 'Results', 
      href: '/results', 
      icon: 'fas fa-graduation-cap',
      current: currentPath === '/results' 
    },
    { 
      name: 'Documents', 
      href: '/documents', 
      icon: 'fas fa-folder-open',
      current: currentPath === '/documents' 
    },
    { 
      name: 'Settings', 
      href: '/settings', 
      icon: 'fas fa-cog',
      current: currentPath === '/settings' 
    }
  ]
})

const toggleUserMenu = () => {
  userMenuOpen.value = !userMenuOpen.value
}

const closeMenus = () => {
  userMenuOpen.value = false
  // Close mobile menu if open
  emit('close-mobile')
}

const closeMobileMenu = () => {
  // If on mobile view, close the sidebar when clicking a link
  if (window.innerWidth < 768) {
    emit('close-mobile')
  }
}

// Close dropdown when clicking outside
const handleClickOutside = (event) => {
  const menuButton = document.getElementById('studentMenuButton')
  const menu = document.getElementById('student-menu')
  
  if (menuButton && !menuButton.contains(event.target) && 
      menu && !menu.contains(event.target)) {
    userMenuOpen.value = false
  }
}

const handleLogout = () => {
  closeMenus()
  authStore.logout()
  router.push('/login')
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
/* Custom scrollbar for sidebar */
#student-sidebar::-webkit-scrollbar {
  width: 4px;
}

#student-sidebar::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 2px;
}

#student-sidebar::-webkit-scrollbar-thumb {
  background: linear-gradient(to bottom, #63b3ed, #3182ce);
  border-radius: 2px;
}

#student-sidebar::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(to bottom, #3182ce, #2c5282);
}

/* Smooth transitions */
#student-sidebar * {
  transition: all 0.3s ease;
}

/* Animation for dropdown */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.2s ease-out;
}
</style>