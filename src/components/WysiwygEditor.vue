<script setup>
import { EditorContent } from '@tiptap/vue-3'

const props = defineProps({ editor: { type: Object, default: null } })
</script>

<template>
  <div class="w-full flex flex-col transition-all duration-300">
    <div class="px-4 py-2 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
      <span class="text-sm font-medium text-gray-300">Editor WYSIWYG</span>
      <span class="text-xs text-green-400">Modifica visuale</span>
    </div>
    <div class="flex-1 overflow-auto bg-white tiptap-wrapper">
      <EditorContent :editor="props.editor" class="h-full" />
    </div>
  </div>
</template>

<style scoped>
.tiptap-wrapper { cursor: text; }
.tiptap-wrapper::-webkit-scrollbar { width: 10px; }
.tiptap-wrapper::-webkit-scrollbar-track { background: #f1f5f9; }
.tiptap-wrapper::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 5px; }
.tiptap-wrapper::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
</style>
