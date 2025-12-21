<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: String, required: true },
  placeholder: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'cursor'])

const content = ref(props.modelValue)
const textareaRef = ref(null)

watch(() => props.modelValue, (v) => { content.value = v })

function update(v) { content.value = v; emit('update:modelValue', v) }
function emitCursor() {
  const textarea = textareaRef.value
  if (!textarea) return
  emit('cursor', textarea.selectionStart)
}

function getSelection() {
  const textarea = textareaRef.value
  if (!textarea) return { start: 0, end: 0, text: '' }
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const text = content.value.substring(start, end)
  return { start, end, text }
}

function insertText(before, after = '', defaultText = '') {
  const textarea = textareaRef.value
  if (!textarea) return
  const { start, end, text } = getSelection()
  const selectedText = text || defaultText
  const newText = content.value.substring(0, start) + before + selectedText + after + content.value.substring(end)
  update(newText)
  setTimeout(() => {
    textarea.focus()
    textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length)
  }, 0)
}

function insertAtLineStart(prefix) {
  const textarea = textareaRef.value
  if (!textarea) return
  const { start } = getSelection()
  const value = content.value
  const lineStart = value.lastIndexOf('\n', start - 1) + 1
  const newText = value.substring(0, lineStart) + prefix + value.substring(lineStart)
  update(newText)
  setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start + prefix.length, start + prefix.length) }, 0)
}

// Formatting methods exposed to parent
function formatBold() { insertText('**', '**', 'testo grassetto') }
function formatItalic() { insertText('*', '*', 'testo corsivo') }
function formatUnderline() { insertText('<u>', '</u>', 'testo sottolineato') }
function formatStrikethrough() { insertText('~~', '~~', 'testo barrato') }
function formatCode() { insertText('`', '`', 'codice') }
function formatCodeBlock() { insertText('\n```\n', '\n```\n', 'codice') }
function formatBlockquote() { insertAtLineStart('> ') }
function formatH1() { insertAtLineStart('# ') }
function formatH2() { insertAtLineStart('## ') }
function formatH3() { insertAtLineStart('### ') }
function formatH4() { insertAtLineStart('#### ') }
function formatBulletList() { insertAtLineStart('- ') }
function formatNumberedList() { insertAtLineStart('1. ') }
function formatTaskList() { insertAtLineStart('- [ ] ') }
function formatHorizontalRule() { insertText('\n---\n', '', '') }
function formatTable() {
  const tableTemplate = `\n| Colonna 1 | Colonna 2 | Colonna 3 |\n|-----------|-----------|-----------|\n| Cella 1   | Cella 2   | Cella 3   |\n| Cella 4   | Cella 5   | Cella 6   |\n`
  insertText(tableTemplate, '', '')
}
function applyLink(url) {
  const { text } = getSelection()
  if (text) { insertText('[', `](${url || 'url'})`, '') }
  else { insertText('[testo link](', ')', url || 'https://') }
}
function applyImage(url) { insertText('![alt text](', ')', url || 'https://') }

function jumpToIndex(index) {
  const textarea = textareaRef.value
  if (!textarea || typeof index !== 'number') return
  textarea.focus()
  try { textarea.setSelectionRange(index, index) } catch (_) {}
  emit('cursor', index)
}

defineExpose({
  formatBold,
  formatItalic,
  formatUnderline,
  formatStrikethrough,
  formatCode,
  formatCodeBlock,
  formatBlockquote,
  formatH1,
  formatH2,
  formatH3,
  formatH4,
  formatBulletList,
  formatNumberedList,
  formatTaskList,
  formatHorizontalRule,
  formatTable,
  applyLink,
  applyImage,
  jumpToIndex,
})
</script>

<template>
  <div class="flex flex-col border-r border-gray-700 transition-all duration-300">
    <div class="px-4 py-2 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
      <span class="text-sm font-medium text-gray-300">Editor Markdown</span>
      <span class="text-xs text-gray-500">{{ content.length }} caratteri</span>
    </div>
    <textarea ref="textareaRef" :value="content" @input="update($event.target.value)" @click="emitCursor" @mouseup="emitCursor" @keyup="emitCursor"
      class="flex-1 w-full p-4 bg-gray-900 text-gray-100 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
      :placeholder="props.placeholder" spellcheck="false"></textarea>
  </div>
</template>

<style scoped>
textarea { tab-size: 2; line-height: 1.6; }
textarea::-webkit-scrollbar { width: 10px; }
textarea::-webkit-scrollbar-track { background: #1f2937; }
textarea::-webkit-scrollbar-thumb { background: #4b5563; border-radius: 5px; }
textarea::-webkit-scrollbar-thumb:hover { background: #6b7280; }
</style>
