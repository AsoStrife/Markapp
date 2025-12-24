<script setup>
const props = defineProps({
  currentFilePath: { type: String, default: null },
  isModified: { type: Boolean, default: false },
  untitledLabel: { type: String, default: 'Untitled' },
})
</script>

<template>
  <div class="flex items-center justify-between px-4 py-2" style="background-color: var(--titlebar-bg); border-bottom: 1px solid var(--titlebar-border);">
    <div class="flex items-center space-x-2">
      <span class="text-xl font-bold" style="color: var(--titlebar-text-primary);"></span>
      <span v-if="props.currentFilePath" class="text-sm ml-4" style="color: var(--titlebar-text);">
        {{ props.currentFilePath }}
      </span>
      <span v-else class="text-sm ml-4" style="color: var(--titlebar-text);">
        {{ props.untitledLabel }}
      </span>
      <span v-if="props.isModified" class="text-sm ml-2" style="color: var(--titlebar-modified);">●</span>
    </div>
  </div>
</template>
