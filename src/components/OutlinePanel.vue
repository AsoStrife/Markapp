<script setup>
const props = defineProps({
  items: { type: Array, default: () => [] }, // [{ title, level, index }]
  title: { type: String, default: 'Outline' },
})
const emit = defineEmits(['select'])
function selectItem(idx) { emit('select', idx) }
</script>

<template>
  <div class="w-64 bg-gray-850 border-r border-gray-700 h-full flex flex-col">
    <div class="px-3 py-2 bg-gray-800 border-b border-gray-700 text-sm font-semibold text-gray-200">
      {{ props.title }}
    </div>
    <div class="flex-1 overflow-auto py-2">
      <ul class="space-y-0.5">
        <li v-for="(it, i) in props.items" :key="i">
          <button class="w-full text-left px-3 py-1.5 hover:bg-gray-700 rounded transition-colors text-gray-200"
            :style="{ paddingLeft: `${(it.level - 1) * 12 + 12}px` }" @click="selectItem(it.index)" :title="it.title">
            <span class="text-xs text-gray-400">H{{ it.level }}</span>
            <span class="ml-2 truncate">{{ it.title }}</span>
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.bg-gray-850 { background-color: #1f2837; }
</style>
