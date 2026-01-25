<template>
  <div class="space-y-6">
    <!-- Header with Gradient -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold bg-gradient-to-r from-[#63b3ed] to-[#3182ce] bg-clip-text text-transparent">
          My Profile
        </h1>
        <p class="mt-2 text-sm text-gray-500">
          View and manage your personal information
        </p>
      </div>
      
      <div class="flex items-center space-x-4">
        <!-- Edit Profile Button -->
        <button
          @click="editProfile"
          class="group relative flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-xl bg-gradient-to-br from-[#63b3ed] to-[#3182ce] hover:from-[#3182ce] hover:to-[#63b3ed] transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] transform"
        >
          <i class="fas fa-edit text-sm"></i>
          <span>Edit Profile</span>
        </button>
        
        <!-- Download Profile Button -->
        <button
          @click="downloadProfile"
          class="group relative flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 rounded-xl border border-blue-200 bg-white hover:bg-blue-50 transition-all duration-300 shadow-sm hover:shadow-md"
        >
          <i class="fas fa-download text-sm"></i>
          <span>Download</span>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="studentStore.loading.profile" class="mt-8">
      <div class="flex flex-col items-center justify-center py-12">
        <div class="relative">
          <div class="w-20 h-20 rounded-full bg-gradient-to-r from-blue-100 to-blue-50 border-4 border-blue-50 animate-pulse"></div>
          <div class="absolute inset-0 flex items-center justify-center">
            <i class="fas fa-spinner fa-spin text-blue-500 text-2xl"></i>
          </div>
        </div>
        <p class="mt-4 text-gray-500">Loading profile information...</p>
      </div>
    </div>

    <!-- Profile Content -->
    <div v-else-if="profile" class="space-y-6">
      <!-- Profile Card -->
      <div class="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
        <!-- Profile Header with Gradient -->
        <div class="relative">
          <!-- Background Gradient -->
          <div class="absolute inset-0 bg-gradient-to-r from-blue-50 via-white to-blue-50"></div>
          
          <div class="relative px-8 py-6 flex flex-col md:flex-row md:items-center gap-6">
            <!-- Profile Photo -->
            <div class="relative group">
              <div class="relative w-32 h-32 rounded-2xl overflow-hidden border-4 border-white shadow-xl">
                <div v-if="!profile.photo" class="w-full h-full bg-gradient-to-br from-[#63b3ed] to-[#3182ce] flex items-center justify-center">
                  <span class="text-white text-4xl font-bold">
                    {{ getInitials(profile.name) }}
                  </span>
                </div>
                <img
                  v-else
                  :src="'data:image/jpeg;base64,' + profile.photo"
                  alt="Student Photo"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              
              <!-- Online Status Badge -->
              <div class="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-green-500 border-4 border-white shadow-lg"></div>
              
              <!-- Upload Overlay -->
              <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300 flex items-center justify-center">
                <button class="p-2 rounded-full bg-white/80 hover:bg-white transition-colors duration-300">
                  <i class="fas fa-camera text-blue-600 text-lg"></i>
                </button>
              </div>
            </div>

            <!-- Basic Info -->
            <div class="flex-1">
              <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <h2 class="text-2xl font-bold text-gray-900">{{ profile.name }}</h2>
                  <div class="flex items-center gap-4 mt-2">
                    <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium">
                      <i class="fas fa-graduation-cap text-sm"></i>
                      Student
                    </span>
                    <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-medium">
                      <i class="fas fa-check-circle text-sm"></i>
                      Active
                    </span>
                  </div>
                  
                  <div class="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                        <i class="fas fa-id-card text-blue-600"></i>
                      </div>
                      <div>
                        <p class="text-sm text-gray-500">Roll Number</p>
                        <p class="font-medium text-gray-900">{{ profile.student_id }}</p>
                      </div>
                    </div>
                    
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                        <i class="fas fa-school text-purple-600"></i>
                      </div>
                      <div>
                        <p class="text-sm text-gray-500">Class</p>
                        <p class="font-medium text-gray-900">{{ profile.class }}</p>
                      </div>
                    </div>
                    
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                        <i class="fas fa-calendar-alt text-green-600"></i>
                      </div>
                      <div>
                        <p class="text-sm text-gray-500">Session</p>
                        <p class="font-medium text-gray-900">{{ profile.session }}</p>
                      </div>
                    </div>
                    
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                        <i class="fas fa-envelope text-orange-600"></i>
                      </div>
                      <div>
                        <p class="text-sm text-gray-500">Email</p>
                        <p class="font-medium text-gray-900 truncate">{{ profile.email }}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- QR Code Badge -->
                <div class="hidden lg:block">
                  <div class="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-white border border-blue-200">
                    <div class="text-center">
                      <div class="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                        <i class="fas fa-qrcode text-gray-400 text-3xl"></i>
                      </div>
                      <p class="text-xs text-gray-500">Student ID QR Code</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Detailed Information -->
        <div class="px-8 pb-8">
          <!-- Tab Navigation -->
          <div class="mt-6 border-b border-blue-100">
            <div class="flex space-x-8">
              <button
                v-for="tab in tabs"
                :key="tab.id"
                @click="activeTab = tab.id"
                :class="[
                  'pb-4 text-sm font-medium border-b-2 transition-colors duration-300',
                  activeTab === tab.id
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                ]"
              >
                <i :class="[tab.icon, 'mr-2']"></i>
                {{ tab.name }}
              </button>
            </div>
          </div>

          <!-- Tab Content -->
          <div class="mt-8">
            <!-- Personal Details Tab -->
            <div v-if="activeTab === 'personal'" class="space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Contact Information -->
                <div class="bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 border border-blue-100">
                  <div class="flex items-center gap-3 mb-6">
                    <div class="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                      <i class="fas fa-phone-alt text-blue-600"></i>
                    </div>
                    <div>
                      <h3 class="text-lg font-semibold text-gray-900">Contact Information</h3>
                      <p class="text-sm text-gray-500">How to reach you</p>
                    </div>
                  </div>
                  
                  <div class="space-y-4">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-lg bg-white border border-blue-100 flex items-center justify-center">
                        <i class="fas fa-phone text-blue-500"></i>
                      </div>
                      <div>
                        <p class="text-sm text-gray-500">Phone Number</p>
                        <p class="font-medium text-gray-900">{{ profile.contact_info || 'Not provided' }}</p>
                      </div>
                    </div>
                    
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-lg bg-white border border-blue-100 flex items-center justify-center">
                        <i class="fas fa-map-marker-alt text-blue-500"></i>
                      </div>
                      <div>
                        <p class="text-sm text-gray-500">Address</p>
                        <p class="font-medium text-gray-900">{{ profile.address || 'Not provided' }}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Family Information -->
                <div class="bg-gradient-to-br from-purple-50 to-white rounded-xl p-6 border border-purple-100">
                  <div class="flex items-center gap-3 mb-6">
                    <div class="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                      <i class="fas fa-users text-purple-600"></i>
                    </div>
                    <div>
                      <h3 class="text-lg font-semibold text-gray-900">Family Information</h3>
                      <p class="text-sm text-gray-500">Parents and guardians</p>
                    </div>
                  </div>
                  
                  <div class="space-y-4">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-lg bg-white border border-purple-100 flex items-center justify-center">
                        <i class="fas fa-male text-purple-500"></i>
                      </div>
                      <div>
                        <p class="text-sm text-gray-500">Father's Name</p>
                        <p class="font-medium text-gray-900">{{ profile.father_name || 'Not provided' }}</p>
                      </div>
                    </div>
                    
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-lg bg-white border border-purple-100 flex items-center justify-center">
                        <i class="fas fa-female text-purple-500"></i>
                      </div>
                      <div>
                        <p class="text-sm text-gray-500">Mother's Name</p>
                        <p class="font-medium text-gray-900">{{ profile.mother_name || 'Not provided' }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Additional Information -->
              <div class="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-100">
                <div class="flex items-center gap-3 mb-6">
                  <div class="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                    <i class="fas fa-info-circle text-gray-600"></i>
                  </div>
                  <div>
                    <h3 class="text-lg font-semibold text-gray-900">Additional Information</h3>
                    <p class="text-sm text-gray-500">Other relevant details</p>
                  </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div class="space-y-2">
                    <p class="text-sm text-gray-500">Date of Birth</p>
                    <p class="font-medium text-gray-900">{{ profile.dob || 'Not provided' }}</p>
                  </div>
                  
                  <div class="space-y-2">
                    <p class="text-sm text-gray-500">Blood Group</p>
                    <p class="font-medium text-gray-900">{{ profile.blood_group || 'Not provided' }}</p>
                  </div>
                  
                  <div class="space-y-2">
                    <p class="text-sm text-gray-500">Emergency Contact</p>
                    <p class="font-medium text-gray-900">{{ profile.emergency_contact || 'Not provided' }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Academic Details Tab -->
            <div v-else-if="activeTab === 'academic'" class="space-y-6">
              <!-- Academic Stats -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 border border-blue-100">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-sm text-gray-500">CGPA</p>
                      <p class="text-3xl font-bold text-gray-900">3.8</p>
                    </div>
                    <div class="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
                      <i class="fas fa-star text-blue-600 text-xl"></i>
                    </div>
                  </div>
                  <div class="mt-4 flex items-center gap-2">
                    <div class="flex-1 h-2 bg-blue-100 rounded-full overflow-hidden">
                      <div class="h-full bg-gradient-to-r from-[#63b3ed] to-[#3182ce] rounded-full" style="width: 90%"></div>
                    </div>
                    <span class="text-sm font-medium text-blue-600">90%</span>
                  </div>
                </div>
                
                <div class="bg-gradient-to-br from-green-50 to-white rounded-xl p-6 border border-green-100">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-sm text-gray-500">Attendance</p>
                      <p class="text-3xl font-bold text-gray-900">94%</p>
                    </div>
                    <div class="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                      <i class="fas fa-calendar-check text-green-600 text-xl"></i>
                    </div>
                  </div>
                  <div class="mt-4 flex items-center gap-2">
                    <div class="flex-1 h-2 bg-green-100 rounded-full overflow-hidden">
                      <div class="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full" style="width: 94%"></div>
                    </div>
                    <span class="text-sm font-medium text-green-600">94%</span>
                  </div>
                </div>
                
                <div class="bg-gradient-to-br from-purple-50 to-white rounded-xl p-6 border border-purple-100">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-sm text-gray-500">Completed</p>
                      <p class="text-3xl font-bold text-gray-900">8/12</p>
                    </div>
                    <div class="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center">
                      <i class="fas fa-book text-purple-600 text-xl"></i>
                    </div>
                  </div>
                  <div class="mt-4 flex items-center gap-2">
                    <div class="flex-1 h-2 bg-purple-100 rounded-full overflow-hidden">
                      <div class="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full" style="width: 67%"></div>
                    </div>
                    <span class="text-sm font-medium text-purple-600">67%</span>
                  </div>
                </div>
              </div>
              
              <!-- Current Subjects -->
              <div class="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Current Subjects</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div 
                    v-for="subject in subjects"
                    :key="subject.id"
                    class="group p-4 rounded-lg border border-gray-200 hover:border-blue-200 hover:bg-blue-50 transition-all duration-300 cursor-pointer"
                  >
                    <div class="flex items-center justify-between mb-2">
                      <span class="font-medium text-gray-900">{{ subject.name }}</span>
                      <span class="text-sm font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                        {{ subject.code }}
                      </span>
                    </div>
                    <div class="flex items-center gap-2">
                      <div class="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          class="h-full bg-gradient-to-r from-[#63b3ed] to-[#3182ce] rounded-full transition-all duration-500"
                          :style="{ width: subject.progress + '%' }"
                        ></div>
                      </div>
                      <span class="text-sm font-medium text-gray-700">{{ subject.progress }}%</span>
                    </div>
                    <div class="mt-2 flex items-center justify-between text-sm text-gray-500">
                      <span>Instructor: {{ subject.teacher }}</span>
                      <span>Grade: {{ subject.grade }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Documents Tab -->
            <div v-else-if="activeTab === 'documents'" class="space-y-6">
              <!-- Upload Area -->
              <div class="border-2 border-dashed border-blue-200 rounded-2xl p-8 text-center hover:border-blue-300 hover:bg-blue-50 transition-all duration-300">
                <div class="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <i class="fas fa-cloud-upload-alt text-blue-600 text-2xl"></i>
                </div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">Upload Documents</h3>
                <p class="text-gray-500 mb-4">Drag & drop files here or click to browse</p>
                <button class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#63b3ed] to-[#3182ce] text-white rounded-lg hover:opacity-90 transition-opacity duration-300">
                  <i class="fas fa-plus"></i>
                  Add Document
                </button>
                <p class="mt-3 text-xs text-gray-400">Supports: PDF, JPG, PNG up to 10MB</p>
              </div>
              
              <!-- Document List -->
              <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                  <h3 class="text-lg font-semibold text-gray-900">My Documents</h3>
                </div>
                <div class="divide-y divide-gray-200">
                  <div 
                    v-for="doc in documents"
                    :key="doc.id"
                    class="px-6 py-4 hover:bg-blue-50 transition-colors duration-300"
                  >
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-3">
                        <div :class="['w-12 h-12 rounded-lg flex items-center justify-center', getDocColor(doc.type)]">
                          <i :class="['text-xl', getDocIcon(doc.type)]"></i>
                        </div>
                        <div>
                          <p class="font-medium text-gray-900">{{ doc.name }}</p>
                          <div class="flex items-center gap-3 text-sm text-gray-500">
                            <span>{{ doc.type }}</span>
                            <span>•</span>
                            <span>{{ doc.size }}</span>
                            <span>•</span>
                            <span>Uploaded {{ doc.date }}</span>
                          </div>
                        </div>
                      </div>
                      <div class="flex items-center gap-2">
                        <button class="p-2 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors duration-300">
                          <i class="fas fa-eye"></i>
                        </button>
                        <button class="p-2 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors duration-300">
                          <i class="fas fa-download"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else class="text-center py-12">
      <div class="w-20 h-20 rounded-full bg-gradient-to-r from-red-100 to-red-50 border-4 border-red-50 flex items-center justify-center mx-auto">
        <i class="fas fa-exclamation-triangle text-red-500 text-2xl"></i>
      </div>
      <h3 class="mt-4 text-lg font-medium text-gray-900">Profile not found</h3>
      <p class="mt-2 text-gray-500">Unable to load your profile information.</p>
      <button
        @click="studentStore.fetchProfile()"
        class="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#63b3ed] to-[#3182ce] text-white rounded-lg hover:opacity-90 transition-opacity duration-300"
      >
        <i class="fas fa-redo"></i>
        Try Again
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStudentStore } from '../store/student'
import { storeToRefs } from 'pinia'

const studentStore = useStudentStore()
const { profile, results, files } = storeToRefs(studentStore)

// State
const activeTab = ref('personal')

// Sample data for tabs
const tabs = ref([
  { id: 'personal', name: 'Personal Details', icon: 'fas fa-user' },
  { id: 'academic', name: 'Academic Records', icon: 'fas fa-graduation-cap' },
  { id: 'documents', name: 'Documents', icon: 'fas fa-folder' },
])

// Computed Data derived from store
const subjects = computed(() => {
  // Assuming results is an array of terms, take the latest one or flatten
  // This structure depends on the API response. Adapting to generic list for now.
  if (!results.value) return []
  
  // If results is an array of terms, getting the last term's subjects
  const latestTerm = Array.isArray(results.value) ? results.value[results.value.length - 1] : results.value
  
  if (!latestTerm || !latestTerm.subjects) return []

  return latestTerm.subjects.map(sub => ({
    id: sub.subject_id || sub.code || Math.random(),
    name: sub.subject_name || sub.name,
    code: sub.subject_code || sub.code || '',
    progress: sub.obtained_marks ? Math.round((sub.obtained_marks / sub.total_marks) * 100) : 0,
    teacher: sub.teacher_name || 'TBA',
    grade: sub.grade || calculateGrade(sub.obtained_marks, sub.total_marks)
  }))
})

const documents = computed(() => {
  if (!files.value) return []
  return files.value.map(doc => ({
    id: doc.id || Math.random(),
    name: doc.file_name || doc.name,
    type: determineFileType(doc.file_name || doc.name),
    size: formatFileSize(doc.file_size),
    date: formatTimeAgo(doc.upload_date || doc.created_at)
  }))
})

// Methods
const getInitials = (name) => {
  if (!name) return '?'
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
}

const calculateGrade = (marks, total) => {
    if (!marks || !total) return 'N/A'
    const percentage = (marks / total) * 100
    if (percentage >= 90) return 'A+'
    if (percentage >= 80) return 'A'
    if (percentage >= 70) return 'B+'
    if (percentage >= 60) return 'B'
    if (percentage >= 50) return 'C+'
    if (percentage >= 40) return 'C'
    return 'F'
}

const determineFileType = (filename) => {
    if (!filename) return 'File'
    const ext = filename.split('.').pop().toLowerCase()
    if (['pdf'].includes(ext)) return 'PDF'
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return 'Image'
    if (['doc', 'docx'].includes(ext)) return 'Word'
    if (['xls', 'xlsx'].includes(ext)) return 'Excel'
    return 'File'
}

const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown'
    const k = 1024
    if (bytes < k) return bytes + ' B'
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + ['B', 'KB', 'MB', 'GB'][i]
}

const formatTimeAgo = (date) => {
  if (!date) return ''
  const now = new Date()
  const diffMs = now - new Date(date)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffDays < 1) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return new Date(date).toLocaleDateString()
}

onMounted(() => {
    studentStore.fetchProfile()
    studentStore.fetchResults()
    studentStore.fetchFiles()
})

const editProfile = () => {
  // Implement edit profile functionality
  console.log('Edit profile clicked')
}

const downloadProfile = () => {
  // Implement download profile functionality
  console.log('Download profile clicked')
}

const getDocIcon = (type) => {
  const icons = {
    'PDF': 'fas fa-file-pdf text-red-500',
    'Image': 'fas fa-file-image text-green-500',
    'Word': 'fas fa-file-word text-blue-500',
    'Excel': 'fas fa-file-excel text-green-600',
    'default': 'fas fa-file text-gray-500'
  }
  return icons[type] || icons.default
}

const getDocColor = (type) => {
  const colors = {
    'PDF': 'bg-red-50 border border-red-100',
    'Image': 'bg-green-50 border border-green-100',
    'Word': 'bg-blue-50 border border-blue-100',
    'Excel': 'bg-green-50 border border-green-100',
    'default': 'bg-gray-50 border border-gray-100'
  }
  return colors[type] || colors.default
}
</script>

<style scoped>
/* Smooth transitions */
* {
  transition: all 0.3s ease;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(to bottom, #63b3ed, #3182ce);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(to bottom, #3182ce, #2c5282);
}

/* Gradient border animation */
.border-gradient {
  border: 2px solid transparent;
  background: linear-gradient(white, white) padding-box,
              linear-gradient(45deg, #63b3ed, #3182ce) border-box;
}
</style>