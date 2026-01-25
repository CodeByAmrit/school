<template>
  <div>
    <h1 class="text-2xl font-semibold text-gray-900">Dashboard</h1>
    
    <div v-if="loading" class="mt-4">
        <Spinner />
    </div>

    <div v-else class="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <!-- Welcome Card -->
        <Card class="col-span-1 sm:col-span-2 lg:col-span-3">
            <template #header>
                <h3 class="text-lg leading-6 font-medium text-gray-900">Welcome back, {{ user?.name }}!</h3>
            </template>
            <p class="text-gray-500">
                You are currently in specific class {{ user?.class }} ({{ user?.session }}).
            </p>
        </Card>

        <!-- Result Summary -->
        <Card>
            <template #header>
                 <h3 class="text-lg leading-6 font-medium text-gray-900">Academic Performance</h3>
            </template>
             <div class="flex items-center justify-center py-4">
                 <div class="text-center">
                     <span class="text-4xl font-bold text-indigo-600">{{ recentPercentage }}%</span>
                     <p class="text-sm text-gray-500 mt-1">Overall Percentage</p>
                 </div>
             </div>
             <template #footer>
                 <router-link to="/results" class="text-sm font-medium text-indigo-600 hover:text-indigo-500">View Full Results &rarr;</router-link>
             </template>
        </Card>

        <!-- Notifications Summary -->
        <Card>
             <template #header>
                 <h3 class="text-lg leading-6 font-medium text-gray-900">Recent Notifications</h3>
            </template>
            <ul class="divide-y divide-gray-200">
                 <li v-for="notif in recentNotifications" :key="notif.id" class="py-2">
                     <p class="text-sm text-gray-600">{{ notif.message }}</p>
                 </li>
                 <li v-if="recentNotifications.length === 0" class="py-2">
                     <p class="text-sm text-gray-400">No new notifications.</p>
                 </li>
            </ul>
        </Card>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue';
import { useAuthStore } from '../store/auth';
import { useStudentStore } from '../store/student';
import { storeToRefs } from 'pinia';
import Card from '../components/ui/Card.vue';
import Spinner from '../components/ui/Spinner.vue';

const authStore = useAuthStore();
const studentStore = useStudentStore();

const { user } = storeToRefs(authStore);
const { results, notifications, loading } = storeToRefs(studentStore);

// Computed properties for summary
const recentPercentage = computed(() => {
    // Logic to calculate percentage from results
    // For now, return placeholder or assume logic
    if (results.value && results.value.overall_percentage) {
        return results.value.overall_percentage;
    }
    return 0; 
});

const recentNotifications = computed(() => {
    return notifications.value.slice(0, 3);
});

onMounted(async () => {
    // Determine if we need to fetch data
    if (!results.value) await studentStore.fetchResults();
    if (notifications.value.length === 0) await studentStore.fetchNotifications();
});
</script>
