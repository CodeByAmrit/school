<template>
  <div>
    <h1 class="text-2xl font-semibold text-gray-900">Documents</h1>

    <div v-if="loading.files" class="mt-4">
      <Spinner />
    </div>

    <Card v-else class="mt-6">
       <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Name</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Upload Date</th>
              <th scope="col" class="relative px-6 py-3">
                <span class="sr-only">Download</span>
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="file in files" :key="file.id">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                 <div class="flex items-center">
                    <component :is="getFileIcon(file.type)" class="h-5 w-5 text-gray-400 mr-3" />
                    {{ file.file_name }}
                 </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ file.type }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatDate(file.upload_date) }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <a :href="`/api/student/files/${file.id}`" target="_blank" class="text-indigo-600 hover:text-indigo-900">Download</a>
              </td>
            </tr>
            <tr v-if="files.length === 0">
                <td colspan="4" class="px-6 py-4 text-center text-sm text-gray-500">No documents found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useStudentStore } from '../store/student';
import { storeToRefs } from 'pinia';
import Card from '../components/ui/Card.vue';
import Spinner from '../components/ui/Spinner.vue';
import { FileText, Image, File } from 'lucide-vue-next';

const studentStore = useStudentStore();
const { files, loading } = storeToRefs(studentStore);

onMounted(() => {
    studentStore.fetchFiles();
});

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
};

const getFileIcon = (type) => {
    const t = type.toLowerCase();
    if (t.includes('pdf') || t.includes('doc')) return FileText;
    if (t.includes('jpg') || t.includes('png')) return Image;
    return File;
};
</script>
