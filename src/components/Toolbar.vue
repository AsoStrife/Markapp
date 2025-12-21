<script setup>
const props = defineProps({
  titles: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['action'])

function trigger(act) {
  emit('action', act)
}
</script>

<template>
  <div class="flex items-center px-2 py-1.5 bg-gray-800 border-b border-gray-700 gap-2 flex-wrap">
    <!-- Headers -->
    <div class="flex items-center gap-1 border-r border-gray-600 pr-3 mr-2">
      <button @click="trigger('h1')" class="toolbar-btn" :title="props.titles.h1">H1</button>
      <button @click="trigger('h2')" class="toolbar-btn" :title="props.titles.h2">H2</button>
      <button @click="trigger('h3')" class="toolbar-btn" :title="props.titles.h3">H3</button>
      <button @click="trigger('h4')" class="toolbar-btn" :title="props.titles.h4">H4</button>
    </div>

    <!-- Text formatting -->
    <div class="flex items-center gap-1 border-r border-gray-600 pr-3 mr-2">
      <button @click="trigger('bold')" class="toolbar-btn font-bold" :title="props.titles.bold">B</button>
      <button @click="trigger('italic')" class="toolbar-btn italic" :title="props.titles.italic">I</button>
      <button @click="trigger('underline')" class="toolbar-btn underline" :title="props.titles.underline">U</button>
      <button @click="trigger('strike')" class="toolbar-btn line-through" :title="props.titles.strike">S</button>
    </div>

    <!-- Code -->
    <div class="flex items-center gap-1 border-r border-gray-600 pr-3 mr-2">
      <button @click="trigger('code')" class="toolbar-btn font-mono text-xs" :title="props.titles.code">&lt;/&gt;</button>
      <button @click="trigger('codeBlock')" class="toolbar-btn font-mono text-xs" :title="props.titles.codeBlock">{ }</button>
    </div>

    <!-- Lists -->
    <div class="flex items-center gap-1 border-r border-gray-600 pr-3 mr-2">
      <button @click="trigger('bulletList')" class="toolbar-btn" :title="props.titles.bulletList">UL</button>
      <button @click="trigger('orderedList')" class="toolbar-btn" :title="props.titles.orderedList">OL</button>
      <button @click="trigger('taskList')" class="toolbar-btn" :title="props.titles.taskList">[ ]</button>
    </div>

    <!-- Other elements -->
    <div class="flex items-center gap-1 border-r border-gray-600 pr-3 mr-2">
      <button @click="trigger('blockquote')" class="toolbar-btn" :title="props.titles.blockquote">""</button>
      <button @click="trigger('link')" class="toolbar-btn" :title="props.titles.link">Link</button>
      <button @click="trigger('image')" class="toolbar-btn" :title="props.titles.image">Img</button>
    </div>

    <!-- Extras -->
    <div class="flex items-center gap-1">
      <button @click="trigger('hr')" class="toolbar-btn" :title="props.titles.hr">HR</button>
      <button @click="trigger('table')" class="toolbar-btn" :title="props.titles.table">Table</button>
    </div>
  </div>
</template>

<style scoped>
.toolbar-btn {
  @apply px-3 py-1.5 text-sm font-medium bg-gray-700 hover:bg-gray-600 active:bg-blue-600 rounded transition-all min-w-[36px] text-center shadow-sm hover:shadow-md border border-gray-600 hover:border-gray-500;
}
.toolbar-btn:active { @apply transform scale-95; }
</style>
