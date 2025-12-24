<script setup>
import { EditorContent } from '@tiptap/vue-3'

const props = defineProps({ editor: { type: Object, default: null } })
</script>

<template>
  <div class="w-full flex flex-col transition-all duration-300">
    <div class="px-4 py-2 flex items-center justify-between" style="background-color: var(--wysiwyg-header-bg); border-bottom: 1px solid var(--wysiwyg-header-border);">
      <span class="text-sm font-medium" style="color: var(--wysiwyg-header-text);">Editor WYSIWYG</span>
      <span class="text-xs" style="color: var(--wysiwyg-header-label);">Modifica visuale</span>
    </div>
    <div class="flex-1 overflow-auto tiptap-wrapper" style="background-color: var(--wysiwyg-bg);">
      <EditorContent :editor="props.editor" class="h-full" />
    </div>
  </div>
</template>
