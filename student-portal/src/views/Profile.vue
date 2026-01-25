<template>
  <div>
    <h1 class="text-2xl font-semibold text-gray-900">My Profile</h1>
    
    <div v-if="studentStore.loading.profile" class="mt-4">
        <Spinner />
    </div>

    <div v-else-if="profile" class="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
      <div class="px-4 py-5 sm:px-6 flex items-center justify-between">
        <div>
           <h3 class="text-lg leading-6 font-medium text-gray-900">Student Information</h3>
           <p class="mt-1 max-w-2xl text-sm text-gray-500">Personal details and application.</p>
        </div>
        <div v-if="profile.photo" class="flex-shrink-0">
             <img class="h-16 w-16 rounded-full" :src="'data:image/jpeg;base64,' + profile.photo" alt="Student Photo" />
        </div>
      </div>
      <div class="border-t border-gray-200">
        <dl>
          <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-500">Full name</dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{{ profile.name }}</dd>
          </div>
          <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-500">Roll Number</dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{{ profile.student_id }}</dd>
          </div>
          <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-500">Class & Session</dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{{ profile.class }} ({{ profile.session }})</dd>
          </div>
          <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-500">Email address</dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{{ profile.email }}</dd>
          </div>
           <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-500">Parents</dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                Father: {{ profile.father_name }} <br/>
                Mother: {{ profile.mother_name }}
            </dd>
          </div>
           <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-500">Contact</dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{{ profile.contact_info }}</dd>
          </div>
          <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-500">Address</dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{{ profile.address }}</dd>
          </div>
        </dl>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useStudentStore } from '../store/student';
import { storeToRefs } from 'pinia';
import Spinner from '../components/ui/Spinner.vue';

const studentStore = useStudentStore();
const { profile } = storeToRefs(studentStore);

onMounted(() => {
    studentStore.fetchProfile();
});
</script>
