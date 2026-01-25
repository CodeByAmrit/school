<template>
  <nav
    class="fixed top-0 inset-x-0 bg-white sm:ml-64 z-40 border-b border-blue-100 shadow-sm"
  >
    <div class="px-4 py-3">
      <div class="flex items-center justify-between">
        <!-- Left Section -->
        <div class="flex items-center space-x-4">
          <!-- Mobile Menu Button -->
          <button
            type="button"
            class="inline-flex items-center p-2 text-gray-500 rounded-lg sm:hidden hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors duration-300"
            @click="$emit('open-mobile')"
            aria-controls="student-sidebar"
          >
            <span class="sr-only">Open sidebar</span>
            <svg
              class="w-6 h-6"
              aria-hidden="true"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                clip-rule="evenodd"
                fill-rule="evenodd"
                d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"
              ></path>
            </svg>
          </button>

          <!-- School Information -->
          <div class="flex items-center space-x-4">
            <!-- School Logo -->
            <div v-if="schoolLogo" class="hidden md:block">
              <img
                :src="schoolLogo"
                class="h-10 w-10 rounded-xl border-2 border-blue-100 object-cover shadow-sm"
                :alt="schoolName"
              />
            </div>
            <div>
              <a href="/dashboard" class="flex flex-col">
                <span class="text-sm font-medium text-gray-500">Welcome to</span>
                <span
                  class="text-xl font-bold bg-gradient-to-r from-[#63b3ed] to-[#3182ce] bg-clip-text text-transparent"
                >
                  {{ schoolName.toUpperCase() }}
                </span>
              </a>
            </div>
          </div>
        </div>

        <!-- Right Section: User Controls -->
        <div class="flex items-center space-x-4">
          <!-- Search Bar -->
          <div class="hidden md:block relative">
            <div
              class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"
            >
              <svg
                class="w-4 h-4 text-blue-400"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 20 20"
              >
                <path
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                />
              </svg>
            </div>
            <input
              type="text"
              id="search-navbar"
              v-model="searchQuery"
              @input="handleSearch"
              class="block w-64 pl-10 pr-4 py-2 text-sm text-gray-700 border border-blue-200 rounded-xl bg-blue-50 focus:ring-2 focus:ring-blue-300 focus:border-blue-300 focus:outline-none transition-all duration-300"
              placeholder="Search results, documents..."
            />
          </div>

          <!-- Theme Toggle -->
          <button
            type="button"
            class="p-2.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all duration-300"
            @click="toggleTheme"
          >
            <svg
              v-if="theme === 'dark'"
              id="theme-toggle-light-icon"
              class="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                clip-rule="evenodd"
              ></path>
            </svg>
            <svg
              v-else
              id="theme-toggle-dark-icon"
              class="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"
              ></path>
            </svg>
          </button>

          <!-- Notifications -->
          <div class="relative">
            <button
              type="button"
              class="relative p-2.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all duration-300"
              @click="toggleNotifications"
              aria-expanded="notificationsOpen"
            >
              <svg
                class="w-5 h-5"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  d="M12.133 10.632v-1.8A5.406 5.406 0 0 0 7.979 3.57.946.946 0 0 0 8 3.464V1.1a1 1 0 0 0-2 0v2.364a.946.946 0 0 0 .021.106 5.406 5.406 0 0 0-4.154 5.262v1.8C1.867 13.018 0 13.614 0 14.807 0 15.4 0 16 .538 16h12.924C14 16 14 15.4 14 14.807c0-1.193-1.867-1.789-1.867-4.175ZM3.823 17a3.453 3.453 0 0 0 6.354 0H3.823Z"
                />
              </svg>

              <!-- Notification Badge -->
              <span
                v-if="unreadNotifications > 0"
                class="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-[#63b3ed] to-[#3182ce] text-xs font-bold text-white shadow-md"
              >
                {{ unreadNotifications > 9 ? '9+' : unreadNotifications }}
              </span>
            </button>

            <!-- Notification Dropdown -->
            <div
              v-if="notificationsOpen"
              class="z-50 absolute right-0 mt-2 w-80 bg-white divide-y divide-blue-100 rounded-xl shadow-lg border border-blue-100 animate-fadeIn"
              aria-labelledby="dropdownNotificationButton"
            >
              <div
                class="px-4 py-3 bg-gradient-to-r from-blue-50 to-white border-b border-blue-100"
              >
                <h3 class="font-bold text-gray-900">Notifications</h3>
                <span
                  v-if="unreadNotifications > 0"
                  class="text-xs text-blue-600 font-medium"
                  >{{ unreadNotifications }} unread</span
                >
              </div>

              <div class="max-h-96 overflow-y-auto">
                <div v-if="notifications.length > 0">
                  <a
                    v-for="notification in notifications"
                    :key="notification.id"
                    :href="notification.link || '#'"
                    class="flex px-4 py-3 hover:bg-blue-50 border-b border-blue-50 last:border-b-0 transition-colors duration-300"
                    @click="markAsRead(notification.id)"
                  >
                    <div class="shrink-0 mr-3">
                      <div
                        class="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-200 flex items-center justify-center"
                      >
                        <i
                          :class="[
                            'text-blue-600 text-sm',
                            getNotificationIcon(notification.type)
                          ]"
                        ></i>
                      </div>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm text-gray-900 font-medium mb-1">
                        {{ notification.title }}
                      </p>
                      <p class="text-xs text-gray-600 truncate">
                        {{ notification.message }}
                      </p>
                      <p class="text-xs text-blue-500 mt-1">
                        {{ formatTimeAgo(notification.createdAt) }}
                      </p>
                    </div>
                    <div v-if="!notification.read" class="shrink-0 ml-2">
                      <span class="w-2 h-2 rounded-full bg-blue-500"></span>
                    </div>
                  </a>
                </div>
                <div v-else class="px-4 py-6 text-center">
                  <div
                    class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3"
                  >
                    <i class="fas fa-bell text-blue-400"></i>
                  </div>
                  <p class="text-gray-600 text-sm">No notifications yet</p>
                  <p class="text-gray-500 text-xs mt-1">
                    We'll notify you when something important happens
                  </p>
                </div>
              </div>

              <div
                class="bg-gradient-to-r from-blue-50 to-white border-t border-blue-100"
              >
                <a
                  href="/notifications"
                  class="block py-3 text-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-300"
                >
                  <div class="inline-flex items-center">
                    <svg
                      class="w-4 h-4 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path
                        fill-rule="evenodd"
                        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    View all notifications
                  </div>
                </a>
              </div>
            </div>
          </div>

          <!-- User Profile Dropdown -->
          <div class="relative">
            <button
              type="button"
              class="flex items-center space-x-3 p-1.5 hover:bg-blue-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all duration-300"
              @click="toggleUserDropdown"
              aria-expanded="userDropdownOpen"
            >
              <div class="text-right hidden md:block">
                <p class="text-sm font-medium text-gray-900">
                  {{ userName }}
                </p>
                <p class="text-xs text-blue-600 font-medium">Student</p>
              </div>

              <div class="relative">
                <div
                  class="w-10 h-10 rounded-xl bg-gradient-to-br from-[#63b3ed] to-[#3182ce] flex items-center justify-center border-2 border-white shadow-md"
                >
                  <span
                    v-if="!userAvatar"
                    class="text-white font-bold text-sm"
                  >
                    {{ userInitials }}
                  </span>
                  <img
                    v-else
                    class="w-full h-full rounded-xl object-cover"
                    :src="userAvatar"
                    :alt="userName"
                  />
                </div>
                <div
                  class="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"
                ></div>
              </div>

              <i
                :class="[
                  'fas text-blue-400 text-xs transition-transform duration-300',
                  userDropdownOpen ? 'fa-chevron-up' : 'fa-chevron-down'
                ]"
              ></i>
            </button>

            <!-- User Dropdown Menu -->
            <div
              v-if="userDropdownOpen"
              class="z-50 absolute right-0 mt-2 w-56 bg-white divide-y divide-blue-100 rounded-xl shadow-lg border border-blue-100 animate-fadeIn"
            >
              <div class="px-4 py-3 bg-gradient-to-r from-blue-50 to-white">
                <p class="text-sm font-medium text-gray-900">
                  {{ userName }}
                </p>
                <p class="text-xs text-gray-600 truncate">{{ userEmail }}</p>
                <p class="text-xs text-blue-600 font-medium mt-1">
                  {{ schoolName }}
                </p>
              </div>

              <ul class="py-2" role="none">
                <li>
                  <router-link
                    to="/dashboard"
                    class="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-300"
                    @click="closeAllDropdowns"
                  >
                    <i class="fas fa-chart-pie text-blue-500 w-4 mr-3"></i>
                    Dashboard
                  </router-link>
                </li>
                <li>
                  <router-link
                    to="/profile"
                    class="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-300"
                    @click="closeAllDropdowns"
                  >
                    <i class="fas fa-user-circle text-blue-500 w-4 mr-3"></i>
                    My Profile
                  </router-link>
                </li>
                <li>
                  <router-link
                    to="/settings"
                    class="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-300"
                    @click="closeAllDropdowns"
                  >
                    <i class="fas fa-cog text-blue-500 w-4 mr-3"></i>
                    Settings
                  </router-link>
                </li>
                <li>
                  <a
                    href="/change-password"
                    class="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-300"
                    @click="closeAllDropdowns"
                  >
                    <i class="fas fa-key text-blue-500 w-4 mr-3"></i>
                    Change Password
                  </a>
                </li>
              </ul>

              <div class="py-2 border-t border-blue-100">
                <a
                  href="#"
                  class="flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors duration-300"
                  @click.prevent="handleLogout"
                >
                  <i class="fas fa-sign-out-alt w-4 mr-3"></i>
                  Sign out
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '../../store/auth'
import { useStudentStore } from '../../store/student'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'

defineEmits(['open-mobile'])

const authStore = useAuthStore()
const studentStore = useStudentStore()
const { user } = storeToRefs(authStore)
const { notifications } = storeToRefs(studentStore)
const router = useRouter()

// UI State
const notificationsOpen = ref(false)
const userDropdownOpen = ref(false)
const searchQuery = ref('')
const theme = ref('light')

// User Data
const userName = computed(() => user.value?.name || 'Student')
const userEmail = computed(() => user.value?.email || 'student@school.com')
const userAvatar = computed(() => user.value?.avatar || null)
const userInitials = computed(() => {
  const name = userName.value || 'Student'
  const names = name.split(' ')
  return names.map(n => n[0]).join('').toUpperCase().substring(0, 2)
})

// School Data
const schoolName = computed(() => user.value?.school_name || 'Student Portal')
const schoolLogo = computed(() => user.value?.school_logo || null)

// Notifications Data
const unreadNotifications = computed(() => {
  return notifications.value.filter(n => !n.read).length
})

// Methods
const toggleNotifications = () => {
  notificationsOpen.value = !notificationsOpen.value
  userDropdownOpen.value = false
}

const toggleUserDropdown = () => {
  userDropdownOpen.value = !userDropdownOpen.value
  notificationsOpen.value = false
}

const closeAllDropdowns = () => {
  notificationsOpen.value = false
  userDropdownOpen.value = false
}

const handleSearch = () => {
  // Implement search functionality
  console.log('Searching for:', searchQuery.value)
}

const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  document.documentElement.classList.toggle('dark')
  localStorage.setItem('theme', theme.value)
}

const getNotificationIcon = (type) => {
  const icons = {
    result: 'fas fa-graduation-cap',
    assignment: 'fas fa-tasks',
    certificate: 'fas fa-award',
    announcement: 'fas fa-bullhorn',
    default: 'fas fa-bell'
  }
  return icons[type] || icons.default
}

const formatTimeAgo = (date) => {
  if (!date) return ''
  const now = new Date()
  const diffMs = now - new Date(date)
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return new Date(date).toLocaleDateString()
}

const markAsRead = async (id) => {
  await studentStore.markNotificationRead(id)
}

const handleLogout = () => {
  closeAllDropdowns()
  authStore.logout()
  router.push('/login')
}

// Close dropdowns when clicking outside
const handleClickOutside = (event) => {
  if (!event.target.closest('.relative')) {
    closeAllDropdowns()
  }
}

// Initialize theme from localStorage
onMounted(() => {
  const savedTheme = localStorage.getItem('theme') || 'light'
  theme.value = savedTheme
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark')
  }

  document.addEventListener('click', handleClickOutside)
  
  // Fetch specific data
  studentStore.fetchNotifications()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
/* Custom scrollbar for notification dropdown */
.max-h-96::-webkit-scrollbar {
  width: 6px;
}

.max-h-96::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.max-h-96::-webkit-scrollbar-thumb {
  background: linear-gradient(to bottom, #63b3ed, #3182ce);
  border-radius: 3px;
}

/* Smooth transitions */
nav * {
  transition: all 0.3s ease;
}

/* Dropdown animations */
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

/* Dark mode support */
.dark nav {
  @apply bg-gray-900 border-gray-700;
}

.dark .bg-white {
  @apply bg-gray-800;
}

.dark .text-gray-700 {
  @apply text-gray-300;
}

.dark .text-gray-900 {
  @apply text-gray-100;
}

.dark .border-blue-100 {
  @apply border-gray-700;
}

.dark .hover\:bg-blue-50:hover {
  @apply hover:bg-gray-700;
}
</style>