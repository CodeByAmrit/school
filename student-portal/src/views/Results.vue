<template>
  <div>
    <h1 class="text-2xl font-semibold text-gray-900">Academic Results</h1>

    <div v-if="loading.results" class="mt-4">
      <Spinner />
    </div>

    <!-- Error State -->
    <div v-else-if="!results && !loading.results" class="mt-4 p-4 text-center text-gray-500">
      No results found.
    </div>

    <div v-else class="mt-6 space-y-8">
      <!-- Term-wise Analysis (Placeholder for Chart) -->
      <!-- <Card> <canvas id="performanceChart"></canvas> </Card> -->

       <Card v-for="(termData, termName) in groupedResults" :key="termName">
          <template #header>
             <div class="flex justify-between items-center">
                <h3 class="text-lg leading-6 font-medium text-gray-900">{{ termName }}</h3>
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                  {{ termData.percentage }}%
                </span>
             </div>
          </template>
          
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marks Obtained</th>
                   <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Marks</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="subject in termData.subjects" :key="subject.subject_name">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ subject.subject_name }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ subject.marks_obtained }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ subject.max_marks }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ subject.grade }}</td>
                </tr>
              </tbody>
            </table>
          </div>
       </Card>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue';
import { useStudentStore } from '../store/student';
import { storeToRefs } from 'pinia';
import Card from '../components/ui/Card.vue';
import Spinner from '../components/ui/Spinner.vue';

const studentStore = useStudentStore();
const { results, loading } = storeToRefs(studentStore);

onMounted(() => {
    studentStore.fetchResults();
});

// Helper to group results if the API returns flat list or specific structure
// Assuming API returns object like { term1: { subjects: [], percentage: 90 }, term2: ... }
// OR consistent with Readme: "Marks per subject per term" implies a list.
// We'll assume a flexible computed property to handle adaptation.
const groupedResults = computed(() => {
    if (!results.value) return {};
    // If results is already the structure we want, return it.
    // If it's the raw response from student_readme "JSON object containing... marks per subject per term"
    // We might need to transform it. For now, let's assume the component will handle the structure 
    // returned by the backend (which we don't fully see the sample of beyond description).
    // Let's assume results.value IS the object with terms as keys or iterable.
    
    // Simplification: returns results.value directly if structure matches, or adapt.
    return results.value.terms || results.value; 
});
</script>
