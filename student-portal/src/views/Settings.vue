<template>
  <div>
    <h1 class="text-2xl font-semibold text-gray-900">Settings</h1>

    <div v-if="loading.settings" class="mt-4">
      <Spinner />
    </div>

    <Card v-else class="mt-6">
        <template #header>
            <h3 class="text-lg leading-6 font-medium text-gray-900">Preferences</h3>
        </template>
        
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <div>
                     <h4 class="text-sm font-medium text-gray-900">Dark Mode</h4>
                     <p class="text-sm text-gray-500">Enable dark mode for the interface (Not fully implemented)</p>
                </div>
                 <!-- Simple Toggle using Button for now -->
                 <button 
                    @click="toggleTheme"
                    :class="[settings?.theme === 'dark' ? 'bg-indigo-600' : 'bg-gray-200', 'relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500']" 
                >
                    <span class="sr-only">Use setting</span>
                    <span 
                        aria-hidden="true" 
                        :class="[settings?.theme === 'dark' ? 'translate-x-5' : 'translate-x-0', 'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200']" 
                    ></span>
                </button>
            </div>

             <div class="flex items-center justify-between">
                <div>
                     <h4 class="text-sm font-medium text-gray-900">Email Notifications</h4>
                     <p class="text-sm text-gray-500">Receive email alerts for new results and documents</p>
                </div>
                 <button 
                    @click="toggleNotifications"
                    :class="[settings?.notifications_enabled ? 'bg-indigo-600' : 'bg-gray-200', 'relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500']" 
                >
                    <span class="sr-only">Use setting</span>
                    <span 
                        aria-hidden="true" 
                        :class="[settings?.notifications_enabled ? 'translate-x-5' : 'translate-x-0', 'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200']" 
                    ></span>
                </button>
            </div>
            
             <div class="flex justify-end mt-4">
                 <Button :loading="saving" @click="saveSettings">Save Changes</Button>
            </div>
        </div>
    </Card>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useStudentStore } from '../store/student';
import { storeToRefs } from 'pinia';
import Card from '../components/ui/Card.vue';
import Button from '../components/ui/Button.vue';
import Spinner from '../components/ui/Spinner.vue';

const studentStore = useStudentStore();
const { settings, loading } = storeToRefs(studentStore);
const saving = ref(false);

onMounted(async () => {
    if (!settings.value) await studentStore.fetchSettings();
    // Initialize default if null
    if (!settings.value) {
        studentStore.settings = { theme: 'light', notifications_enabled: true };
    }
});

const toggleTheme = () => {
    studentStore.settings.theme = studentStore.settings.theme === 'dark' ? 'light' : 'dark';
};

const toggleNotifications = () => {
    studentStore.settings.notifications_enabled = !studentStore.settings.notifications_enabled;
};

const saveSettings = async () => {
    saving.value = true;
    await studentStore.updateSettings(studentStore.settings);
    saving.value = false;
};
</script>
