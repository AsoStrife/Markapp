<script setup>
const props = defineProps({
  currentFilePath: { type: String, default: null },
  isModified: { type: Boolean, default: false },
  untitledLabel: { type: String, default: 'Untitled' },
})
</script>

<template>
  <div class="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
    <div class="flex items-center space-x-2">
      <span class="text-xl font-bold text-blue-400"></span>
      <span v-if="props.currentFilePath" class="text-sm text-gray-400 ml-4">
        {{ props.currentFilePath }}
      </span>
      <span v-else class="text-sm text-gray-400 ml-4">
        {{ props.untitledLabel }}
      </span>
      <span v-if="props.isModified" class="text-yellow-400 text-sm ml-2">●</span>
    </div>
  </div>
</template>
