<template>
  <div class="bg-white overflow-hidden shadow rounded-lg border border-gray-100">
    <div v-if="$slots.header" class="px-4 py-5 sm:px-6 border-b border-gray-100">
        <slot name="header"></slot>
    </div>
    <div class="px-4 py-5 sm:p-6">
      <slot></slot>
    </div>
    <div v-if="$slots.footer" class="px-4 py-4 sm:px-6 border-t border-gray-100 bg-gray-50">
        <slot name="footer"></slot>
    </div>
  </div>
</template>
