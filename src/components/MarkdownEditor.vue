<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
    modelValue: { type: String, required: true },
    placeholder: { type: String, default: '' },
    width: { type: Number, default: null }, // Larghezza dinamica in pixel (null = usa flex)
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
    try { textarea.setSelectionRange(index, index) } catch (_) { }
    emit('cursor', index)
}

function selectRange(start, end, shouldFocus = false) {
    const textarea = textareaRef.value
    if (!textarea) return
    if (shouldFocus) textarea.focus()
    try {
        textarea.setSelectionRange(start, end)
        // Scroll to selection
        textarea.scrollTop = Math.max(0, textarea.scrollHeight * (start / content.value.length) - textarea.clientHeight / 2)
    } catch (_) { }
    emit('cursor', start)
}

function replaceSelection(start, end, newText) {
    const textarea = textareaRef.value
    if (!textarea) return
    const newContent = content.value.substring(0, start) + newText + content.value.substring(end)
    update(newContent)
    setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + newText.length, start + newText.length)
    }, 0)
}

function getCursorPosition() {
    const textarea = textareaRef.value
    if (!textarea) return 0
    return textarea.selectionStart
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
    selectRange,
    replaceSelection,
    getCursorPosition,
})
</script>

<template>
    <div class="flex-col" :class="props.width ? 'flex' : 'flex flex-1'" :style="{ width: props.width ? `${props.width}px` : undefined, flexShrink: props.width ? 0 : undefined, borderRight: props.width ? '1px solid var(--editor-header-border)' : 'none' }">
        <div class="px-4 py-2 flex items-center justify-between" style="background-color: var(--editor-header-bg); border-bottom: 1px solid var(--editor-header-border);">
            <span class="text-sm font-medium" style="color: var(--editor-header-text);">Editor Markdown</span>
            <span class="text-xs" style="color: var(--editor-header-label);">{{ content.length }} caratteri</span>
        </div>
        <textarea ref="textareaRef" :value="content" @input="update($event.target.value)" @click="emitCursor"
            @mouseup="emitCursor" @keyup="emitCursor"
            class="markdown-editor-textarea"
            :placeholder="props.placeholder" spellcheck="false"></textarea>
    </div>
</template>
