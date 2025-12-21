<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  html: { type: String, default: '' },
  title: { type: String, default: 'Preview' },
  readonlyLabel: { type: String, default: 'Read only' },
})
</script>

<template>
  <div class="w-1/2 flex flex-col transition-all duration-300">
    <div class="px-4 py-2 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
      <span class="text-sm font-medium text-gray-300">{{ props.title }}</span>
      <span class="text-xs text-gray-500">{{ props.readonlyLabel }}</span>
    </div>
    <div class="flex-1 p-6 overflow-auto bg-white prose prose-lg max-w-none" v-html="props.html"></div>
  </div>
</template>
