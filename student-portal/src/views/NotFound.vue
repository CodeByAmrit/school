<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 text-center">
      <h2 class="mt-6 text-3xl font-extrabold text-gray-900">
        404 - Page Not Found
      </h2>
      <p class="mt-2 text-sm text-gray-600">
        The page you are looking for does not exist.
      </p>
      <div class="mt-5">
        <router-link to="/dashboard" class="text-indigo-600 hover:text-indigo-500 font-medium">
          Go back to Dashboard
        </router-link>
      </div>
    </div>
  </div>
</template>
