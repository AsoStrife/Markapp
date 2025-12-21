<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocalStorage } from '@vueuse/core'
// Import welcome markdown (Italian)
import welcomeIt from './assets/defaults/md/it.md?raw'
import welcomeEn from './assets/defaults/md/en.md?raw'
import { marked } from 'marked'
import hljs from 'highlight.js'
import TurndownService from 'turndown'

// Tiptap imports
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Placeholder from '@tiptap/extension-placeholder'
import { common, createLowlight } from 'lowlight'

// Configurazione lowlight per syntax highlighting
const lowlight = createLowlight(common)

// Configurazione di marked con syntax highlighting
marked.setOptions({
    gfm: true,
    breaks: true,
    highlight: function (code, lang) {
        if (lang && hljs.getLanguage(lang)) {
            try {
                return hljs.highlight(code, { language: lang }).value
            } catch (err) {
                // Ignore highlight errors
            }
        }
        return hljs.highlightAuto(code).value
    }
})

// i18n
const { t, locale } = useI18n()

// Persisted locale via localStorage using vueuse
const storedLocale = useLocalStorage('markapp.locale', '')

// Language selector state
const showLangMenu = ref(false)
const languages = [
    { code: 'it', label: 'Italiano' },
    { code: 'en', label: 'English' }
]

// Determine initial language synchronously (stored -> system -> fallback)
const available = languages.map(l => l.code)
const sysLang = (navigator.language || navigator.userLanguage || 'en').split('-')[0]
const initialLang = storedLocale.value || (available.includes(sysLang) ? sysLang : 'en')
locale.value = initialLang
storedLocale.value = initialLang
// If running in Electron, inform main process of the selected locale so the native menu uses it
if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.setAppLocale) {
    try {
        window.electronAPI.setAppLocale(initialLang)
    } catch (err) {
        // ignore
    }
}

function setLanguage(code) {
    locale.value = code
    storedLocale.value = code
    showLangMenu.value = false
    if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.setAppLocale) {
        try {
            window.electronAPI.setAppLocale(code)
        } catch (err) {
            // ignore
        }
    }
}

// State
const markdownContent = ref(initialLang === 'it' ? welcomeIt : welcomeEn)

const currentFilePath = ref(null)
const isModified = ref(false)
const viewMode = ref('split') // 'split', 'raw', 'preview'
const editorRef = ref(null)
const isUpdatingFromTiptap = ref(false)
const isUpdatingFromMarkdown = ref(false)

// Configurazione Turndown per HTML→Markdown
const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
    emDelimiter: '*',
    strongDelimiter: '**'
})

// Regole personalizzate per turndown
turndownService.addRule('strikethrough', {
    filter: ['del', 's', 'strike'],
    replacement: (content) => `~~${content}~~`
})

turndownService.addRule('underline', {
    filter: ['u'],
    replacement: (content) => `<u>${content}</u>`
})

turndownService.addRule('taskList', {
    filter: (node) => {
        return node.type === 'checkbox' ||
            (node.nodeName === 'INPUT' && node.getAttribute('type') === 'checkbox')
    },
    replacement: (content, node) => {
        return node.checked ? '[x] ' : '[ ] '
    }
})

// Computed per determinare l'editor attivo in base alla modalità
const activeEditor = computed(() => {
    if (viewMode.value === 'raw') return 'markdown'
    if (viewMode.value === 'preview') return 'tiptap'
    return 'markdown' // in split, formattazione su markdown
})

// Computed per il rendering del markdown (per split view)
const renderedMarkdown = computed(() => {
    try {
        return marked(markdownContent.value)
    } catch (err) {
        return `<p class="text-red-500">${t('alerts.renderError')}</p>`
    }
})

// Tiptap Editor
const tiptapEditor = useEditor({
    extensions: [
        StarterKit.configure({
            codeBlock: false, // Usiamo CodeBlockLowlight
        }),
        Underline,
        Link.configure({
            openOnClick: false,
            HTMLAttributes: {
                class: 'text-blue-600 underline',
            },
        }),
        Image.configure({
            inline: true,
        }),
        TaskList,
        TaskItem.configure({
            nested: true,
        }),
        Table.configure({
            resizable: true,
        }),
        TableRow,
        TableHeader,
        TableCell,
        CodeBlockLowlight.configure({
            lowlight,
        }),
        Placeholder.configure({
            placeholder: t('editor.placeholder'),
        }),
    ],
    content: renderedMarkdown.value,
    editorProps: {
        attributes: {
            class: 'prose prose-lg max-w-none focus:outline-none min-h-full p-6',
        },
    },
    onUpdate: ({ editor }) => {
        if (isUpdatingFromMarkdown.value) return

        isUpdatingFromTiptap.value = true
        const html = editor.getHTML()
        const markdown = turndownService.turndown(html)
        markdownContent.value = markdown
        isModified.value = true
        isUpdatingFromTiptap.value = false
    },
})

// Watch per sincronizzare markdown → Tiptap
watch(markdownContent, (newValue) => {
    isModified.value = true

    if (!isUpdatingFromTiptap.value && tiptapEditor.value && viewMode.value !== 'preview') {
        isUpdatingFromMarkdown.value = true
        const html = marked(newValue)
        tiptapEditor.value.commands.setContent(html, false)
        isUpdatingFromMarkdown.value = false
    }
})

// Watch per aggiornare Tiptap quando si cambia modalità
watch(viewMode, (newMode) => {
    if (newMode === 'preview' && tiptapEditor.value) {
        isUpdatingFromMarkdown.value = true
        const html = marked(markdownContent.value)
        tiptapEditor.value.commands.setContent(html, false)
        isUpdatingFromMarkdown.value = false
    }
})

// Funzioni per la formattazione MARKDOWN EDITOR
function getSelection() {
    const textarea = editorRef.value
    if (!textarea) return { start: 0, end: 0, text: '' }

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = markdownContent.value.substring(start, end)

    return { start, end, text }
}

function insertText(before, after = '', defaultText = '') {
    const textarea = editorRef.value
    if (!textarea) return

    const { start, end, text } = getSelection()
    const selectedText = text || defaultText

    const newText =
        markdownContent.value.substring(0, start) +
        before + selectedText + after +
        markdownContent.value.substring(end)

    markdownContent.value = newText

    setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(
            start + before.length,
            start + before.length + selectedText.length
        )
    }, 0)
}

function insertAtLineStart(prefix) {
    const textarea = editorRef.value
    if (!textarea) return

    const { start } = getSelection()
    const content = markdownContent.value

    let lineStart = content.lastIndexOf('\n', start - 1) + 1

    const newText =
        content.substring(0, lineStart) +
        prefix +
        content.substring(lineStart)

    markdownContent.value = newText

    setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + prefix.length, start + prefix.length)
    }, 0)
}

// Formattazione - supporta entrambi gli editor
function formatBold() {
    if (activeEditor.value === 'tiptap' && tiptapEditor.value) {
        tiptapEditor.value.chain().focus().toggleBold().run()
    } else {
        insertText('**', '**', 'testo grassetto')
    }
}

function formatItalic() {
    if (activeEditor.value === 'tiptap' && tiptapEditor.value) {
        tiptapEditor.value.chain().focus().toggleItalic().run()
    } else {
        insertText('*', '*', 'testo corsivo')
    }
}

function formatUnderline() {
    if (activeEditor.value === 'tiptap' && tiptapEditor.value) {
        tiptapEditor.value.chain().focus().toggleUnderline().run()
    } else {
        insertText('<u>', '</u>', 'testo sottolineato')
    }
}

function formatStrikethrough() {
    if (activeEditor.value === 'tiptap' && tiptapEditor.value) {
        tiptapEditor.value.chain().focus().toggleStrike().run()
    } else {
        insertText('~~', '~~', 'testo barrato')
    }
}

function formatCode() {
    if (activeEditor.value === 'tiptap' && tiptapEditor.value) {
        tiptapEditor.value.chain().focus().toggleCode().run()
    } else {
        insertText('`', '`', 'codice')
    }
}

function formatCodeBlock() {
    if (activeEditor.value === 'tiptap' && tiptapEditor.value) {
        tiptapEditor.value.chain().focus().toggleCodeBlock().run()
    } else {
        insertText('\n```\n', '\n```\n', 'codice')
    }
}

function formatLink() {
    if (activeEditor.value === 'tiptap' && tiptapEditor.value) {
        const url = prompt(t('prompt.enterUrl'), 'https://')
        if (url) {
            tiptapEditor.value.chain().focus().setLink({ href: url }).run()
        }
    } else {
        const { text } = getSelection()
        if (text) {
            insertText('[', '](url)', '')
        } else {
            insertText('[testo link](', ')', 'url')
        }
    }
}

function formatImage() {
    if (activeEditor.value === 'tiptap' && tiptapEditor.value) {
        const url = prompt(t('prompt.enterImageUrl'), 'https://')
        if (url) {
            tiptapEditor.value.chain().focus().setImage({ src: url }).run()
        }
    } else {
        insertText('![alt text](', ')', 'url-immagine')
    }
}

function formatBlockquote() {
    if (activeEditor.value === 'tiptap' && tiptapEditor.value) {
        tiptapEditor.value.chain().focus().toggleBlockquote().run()
    } else {
        insertAtLineStart('> ')
    }
}

function formatH1() {
    if (activeEditor.value === 'tiptap' && tiptapEditor.value) {
        tiptapEditor.value.chain().focus().toggleHeading({ level: 1 }).run()
    } else {
        insertAtLineStart('# ')
    }
}

function formatH2() {
    if (activeEditor.value === 'tiptap' && tiptapEditor.value) {
        tiptapEditor.value.chain().focus().toggleHeading({ level: 2 }).run()
    } else {
        insertAtLineStart('## ')
    }
}

function formatH3() {
    if (activeEditor.value === 'tiptap' && tiptapEditor.value) {
        tiptapEditor.value.chain().focus().toggleHeading({ level: 3 }).run()
    } else {
        insertAtLineStart('### ')
    }
}

function formatH4() {
    if (activeEditor.value === 'tiptap' && tiptapEditor.value) {
        tiptapEditor.value.chain().focus().toggleHeading({ level: 4 }).run()
    } else {
        insertAtLineStart('#### ')
    }
}

function formatBulletList() {
    if (activeEditor.value === 'tiptap' && tiptapEditor.value) {
        tiptapEditor.value.chain().focus().toggleBulletList().run()
    } else {
        insertAtLineStart('- ')
    }
}

function formatNumberedList() {
    if (activeEditor.value === 'tiptap' && tiptapEditor.value) {
        tiptapEditor.value.chain().focus().toggleOrderedList().run()
    } else {
        insertAtLineStart('1. ')
    }
}

function formatTaskList() {
    if (activeEditor.value === 'tiptap' && tiptapEditor.value) {
        tiptapEditor.value.chain().focus().toggleTaskList().run()
    } else {
        insertAtLineStart('- [ ] ')
    }
}

function formatHorizontalRule() {
    if (activeEditor.value === 'tiptap' && tiptapEditor.value) {
        tiptapEditor.value.chain().focus().setHorizontalRule().run()
    } else {
        insertText('\n---\n', '', '')
    }
}

function formatTable() {
    if (activeEditor.value === 'tiptap' && tiptapEditor.value) {
        tiptapEditor.value.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
    } else {
        const tableTemplate = `
| Colonna 1 | Colonna 2 | Colonna 3 |
|-----------|-----------|-----------|
| Cella 1   | Cella 2   | Cella 3   |
| Cella 4   | Cella 5   | Cella 6   |
`
        insertText(tableTemplate, '', '')
    }
}

// Funzioni per le operazioni sui file
async function handleSave() {
    if (!window.electronAPI) {
        alert(t('alerts.noElectron'))
        return
    }

    const filePath = await window.electronAPI.getCurrentFilePath()

    if (filePath) {
        const result = await window.electronAPI.saveFile(filePath, markdownContent.value)
        if (result.success) {
            isModified.value = false
            currentFilePath.value = result.filePath
        } else {
            alert(t('alerts.saveError', { error: result.error }))
        }
    } else {
        handleSaveAs()
    }
}

async function handleSaveAs() {
    if (!window.electronAPI) {
        alert(t('alerts.noElectron'))
        return
    }

    const result = await window.electronAPI.saveFileDialog(markdownContent.value)
    if (result.success) {
        isModified.value = false
        currentFilePath.value = result.filePath
    } else if (result.error) {
        alert(t('alerts.saveError', { error: result.error }))
    }
}

async function handleOpen() {
    if (!window.electronAPI) {
        alert(t('alerts.noElectron'))
        return
    }

    const result = await window.electronAPI.openFileDialog()
    if (result.success) {
        markdownContent.value = result.content
        currentFilePath.value = result.filePath
        isModified.value = false

        // Aggiorna anche Tiptap
        if (tiptapEditor.value) {
            isUpdatingFromMarkdown.value = true
            const html = marked(result.content)
            tiptapEditor.value.commands.setContent(html, false)
            isUpdatingFromMarkdown.value = false
        }
    } else if (result.error) {
        alert(t('alerts.openError', { error: result.error }))
    }
}

function handleNew() {
    const lang = locale.value || 'en'
    const newContent = lang === 'it' ? welcomeIt : welcomeEn
    markdownContent.value = newContent
    currentFilePath.value = null
    isModified.value = false

    // Aggiorna anche Tiptap
    if (tiptapEditor.value) {
        isUpdatingFromMarkdown.value = true
        const html = marked(newContent)
        tiptapEditor.value.commands.setContent(html, false)
        isUpdatingFromMarkdown.value = false
    }
}

// Gestione eventi da menu Electron
onMounted(() => {
    if (window.electronAPI) {
        // Try to get the app locale from main process and reconcile
        if (window.electronAPI.getAppLocale) {
            window.electronAPI.getAppLocale().then((mainLocale) => {
                if (mainLocale && mainLocale !== locale.value) {
                    locale.value = mainLocale
                    storedLocale.value = mainLocale
                    // update welcome content to match
                    markdownContent.value = mainLocale === 'it' ? welcomeIt : welcomeEn
                }
            }).catch(() => { /* ignore */ })
        }
        window.electronAPI.onFileNew(() => {
            handleNew()
        })

        window.electronAPI.onFileOpen(() => {
            handleOpen()
        })

        window.electronAPI.onFileOpened((data) => {
            markdownContent.value = data.content
            currentFilePath.value = data.filePath
            isModified.value = false

            if (tiptapEditor.value) {
                isUpdatingFromMarkdown.value = true
                const html = marked(data.content)
                tiptapEditor.value.commands.setContent(html, false)
                isUpdatingFromMarkdown.value = false
            }
        })

        window.electronAPI.onFileSave(() => {
            handleSave()
        })

        window.electronAPI.onFileSaveAs(() => {
            handleSaveAs()
        })
    }
})

// Gestione shortcut tastiera
function handleKeyDown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (e.shiftKey) {
            handleSaveAs()
        } else {
            handleSave()
        }
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault()
        handleOpen()
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        handleNew()
    }
    // Shortcut per formattazione
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault()
        formatBold()
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault()
        formatItalic()
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault()
        formatUnderline()
    }
}

onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
    if (tiptapEditor.value) {
        tiptapEditor.value.destroy()
    }
})
</script>

<template>
    <div class="h-screen flex flex-col bg-gray-900 text-gray-100">
        <!-- Title bar with file info -->
        <div class="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
            <div class="flex items-center space-x-2">
                <!-- <span class="text-xl font-bold text-blue-400">{{ t('app.title') }}</span> -->
                <span class="text-xl font-bold text-blue-400"></span>
                <span v-if="currentFilePath" class="text-sm text-gray-400 ml-4">
                    {{ currentFilePath }}
                </span>
                <span v-else class="text-sm text-gray-400 ml-4">
                    {{ t('file.untitled') }}
                </span>
                <span v-if="isModified" class="text-yellow-400 text-sm ml-2">●</span>
            </div>
        </div>

        <!-- Formatting Toolbar -->
        <div class="flex items-center px-2 py-1.5 bg-gray-800 border-b border-gray-700 gap-2 flex-wrap">
            <!-- Headers -->
            <div class="flex items-center gap-1 border-r border-gray-600 pr-3 mr-2">
                <button @click="formatH1" class="toolbar-btn" :title="t('toolbar.h1')">H1</button>
                <button @click="formatH2" class="toolbar-btn" :title="t('toolbar.h2')">H2</button>
                <button @click="formatH3" class="toolbar-btn" :title="t('toolbar.h3')">H3</button>
                <button @click="formatH4" class="toolbar-btn" :title="t('toolbar.h4')">H4</button>
            </div>

            <!-- Text formatting -->
            <div class="flex items-center gap-1 border-r border-gray-600 pr-3 mr-2">
                <button @click="formatBold" class="toolbar-btn font-bold" :title="t('toolbar.bold')">B</button>
                <button @click="formatItalic" class="toolbar-btn italic" :title="t('toolbar.italic')">I</button>
                <button @click="formatUnderline" class="toolbar-btn underline"
                    :title="t('toolbar.underline')">U</button>
                <button @click="formatStrikethrough" class="toolbar-btn line-through"
                    :title="t('toolbar.strike')">S</button>
            </div>

            <!-- Code -->
            <div class="flex items-center gap-1 border-r border-gray-600 pr-3 mr-2">
                <button @click="formatCode" class="toolbar-btn font-mono text-xs"
                    :title="t('toolbar.code')">&lt;/&gt;</button>
                <button @click="formatCodeBlock" class="toolbar-btn font-mono text-xs" :title="t('toolbar.codeBlock')">{
                    }</button>
            </div>

            <!-- Lists -->
            <div class="flex items-center gap-1 border-r border-gray-600 pr-3 mr-2">
                <button @click="formatBulletList" class="toolbar-btn" :title="t('toolbar.bulletList')">UL</button>
                <button @click="formatNumberedList" class="toolbar-btn" :title="t('toolbar.numberedList')">OL</button>
                <button @click="formatTaskList" class="toolbar-btn" :title="t('toolbar.taskList')">[ ]</button>
            </div>

            <!-- Other elements -->
            <div class="flex items-center gap-1 border-r border-gray-600 pr-3 mr-2">
                <button @click="formatBlockquote" class="toolbar-btn" :title="t('toolbar.blockquote')">""</button>
                <button @click="formatLink" class="toolbar-btn" :title="t('toolbar.link')">Link</button>
                <button @click="formatImage" class="toolbar-btn" :title="t('toolbar.image')">Img</button>
            </div>

            <!-- Extras -->
            <div class="flex items-center gap-1">
                <button @click="formatHorizontalRule" class="toolbar-btn" :title="t('toolbar.hr')">HR</button>
                <button @click="formatTable" class="toolbar-btn" :title="t('toolbar.table')">Table</button>
            </div>
        </div>

        <!-- Main content area -->
        <div class="flex-1 flex overflow-hidden">
            <!-- Editor panel (raw markdown) - Visibile in split e raw -->
            <div v-show="viewMode === 'split' || viewMode === 'raw'" :class="viewMode === 'split' ? 'w-1/2' : 'w-full'"
                class="flex flex-col border-r border-gray-700 transition-all duration-300">
                <div class="px-4 py-2 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
                    <span class="text-sm font-medium text-gray-300">Editor Markdown</span>
                    <span class="text-xs text-gray-500">{{ markdownContent.length }} caratteri</span>
                </div>
                <textarea ref="editorRef" v-model="markdownContent"
                    class="flex-1 w-full p-4 bg-gray-900 text-gray-100 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                    :placeholder="t('editor.placeholder')" spellcheck="false"></textarea>
            </div>

            <!-- Preview panel - Solo lettura in split -->
            <div v-show="viewMode === 'split'" class="w-1/2 flex flex-col transition-all duration-300">
                <div class="px-4 py-2 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
                    <span class="text-sm font-medium text-gray-300">{{ t('preview.title') }}</span>
                    <span class="text-xs text-gray-500">{{ t('preview.readonly') }}</span>
                </div>
                <div class="flex-1 p-6 overflow-auto bg-white prose prose-lg max-w-none" v-html="renderedMarkdown">
                </div>
            </div>

            <!-- WYSIWYG panel - Tiptap Editor -->
            <div v-show="viewMode === 'preview'" class="w-full flex flex-col transition-all duration-300">
                <div class="px-4 py-2 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
                    <span class="text-sm font-medium text-gray-300">Editor WYSIWYG</span>
                    <span class="text-xs text-green-400">Modifica visuale</span>
                </div>
                <div class="flex-1 overflow-auto bg-white tiptap-wrapper">
                    <EditorContent :editor="tiptapEditor" class="h-full" />
                </div>
            </div>
        </div>

        <!-- Status bar -->
        <div
            class="flex items-center justify-between px-4 py-1.5 bg-gray-800 border-t border-gray-700 text-xs text-gray-400">
            <div class="flex items-center space-x-4">
                <span>{{ t('status.markdown') }}</span>
                <span>{{ t('status.encoding') }}</span>
            </div>

            <!-- View mode controls -->
            <div class="flex items-center space-x-1">
                <button @click="viewMode = 'raw'" class="p-1.5 rounded transition-colors hover:bg-gray-700"
                    :class="viewMode === 'raw' ? 'text-blue-400' : 'text-gray-400'" :title="t('toolbar.viewRaw')">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                </button>

                <button @click="viewMode = 'split'" class="p-1.5 rounded transition-colors hover:bg-gray-700"
                    :class="viewMode === 'split' ? 'text-blue-400' : 'text-gray-400'" :title="t('toolbar.viewSplit')">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M9 4H5a2 2 0 00-2 2v14a2 2 0 002 2h4m0-18v18m0-18l10 0a2 2 0 012 2v14a2 2 0 01-2 2h-10" />
                    </svg>
                </button>

                <button @click="viewMode = 'preview'" class="p-1.5 rounded transition-colors hover:bg-gray-700"
                    :class="viewMode === 'preview' ? 'text-blue-400' : 'text-gray-400'"
                    :title="t('toolbar.viewPreview')">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                </button>
            </div>

            <!-- Language selector moved to the right (see stats block) -->

            <div class="flex items-center space-x-4">
                <span>{{ markdownContent.split('\n').length }} {{ t('stats.lines') }}</span>
                <span>{{markdownContent.split(/\s+/).filter(w => w).length}} {{ t('stats.words') }}</span>

                <div class="relative">
                    <button @click="showLangMenu = !showLangMenu"
                        class="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-700"
                        :title="t('toolbar.viewPreview')">
                        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 2a10 10 0 100 20 10 10 0 000-20z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M2 12h20M12 2c3.5 3.5 3.5 17 0 20M12 2C8.5 5.5 8.5 18.5 12 22" />
                        </svg>
                        <span class="text-xs text-gray-300">{{ locale }}</span>
                    </button>

                    <div v-show="showLangMenu"
                        class="absolute right-0 bottom-full mb-2 w-40 bg-gray-800 border border-gray-700 rounded shadow-lg z-50">
                        <ul>
                            <li v-for="lang in languages" :key="lang.code">
                                <button @click="setLanguage(lang.code)"
                                    class="w-full text-left px-3 py-2 hover:bg-gray-700">
                                    {{ lang.label }}
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Stili per l'editor */
textarea {
    tab-size: 2;
    line-height: 1.6;
}

textarea::-webkit-scrollbar {
    width: 10px;
}

textarea::-webkit-scrollbar-track {
    background: #1f2937;
}

textarea::-webkit-scrollbar-thumb {
    background: #4b5563;
    border-radius: 5px;
}

textarea::-webkit-scrollbar-thumb:hover {
    background: #6b7280;
}

/* Toolbar button styles */
.toolbar-btn {
    @apply px-3 py-1.5 text-sm font-medium bg-gray-700 hover:bg-gray-600 active:bg-blue-600 rounded transition-all min-w-[36px] text-center shadow-sm hover:shadow-md border border-gray-600 hover:border-gray-500;
}

.toolbar-btn:active {
    @apply transform scale-95;
}

/* Tiptap wrapper */
.tiptap-wrapper {
    cursor: text;
}

.tiptap-wrapper::-webkit-scrollbar {
    width: 10px;
}

.tiptap-wrapper::-webkit-scrollbar-track {
    background: #f1f5f9;
}

.tiptap-wrapper::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 5px;
}

.tiptap-wrapper::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}
</style>

<style>
/* Stili globali per Tiptap */
.ProseMirror {
    min-height: 100%;
    padding: 1.5rem;
    outline: none;
}

.ProseMirror p.is-editor-empty:first-child::before {
    color: #adb5bd;
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
}

.ProseMirror h1 {
    font-size: 2em;
    font-weight: bold;
    margin-top: 1em;
    margin-bottom: 0.5em;
}

.ProseMirror h2 {
    font-size: 1.5em;
    font-weight: bold;
    margin-top: 1em;
    margin-bottom: 0.5em;
}

.ProseMirror h3 {
    font-size: 1.25em;
    font-weight: bold;
    margin-top: 1em;
    margin-bottom: 0.5em;
}

.ProseMirror h4 {
    font-size: 1em;
    font-weight: bold;
    margin-top: 1em;
    margin-bottom: 0.5em;
}

.ProseMirror ul,
.ProseMirror ol {
    padding-left: 1.5em;
    margin: 0.5em 0;
}

.ProseMirror ul {
    list-style-type: disc;
}

.ProseMirror ol {
    list-style-type: decimal;
}

.ProseMirror ul[data-type="taskList"] {
    list-style: none;
    padding-left: 0;
}

.ProseMirror ul[data-type="taskList"] li {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
}

.ProseMirror ul[data-type="taskList"] li label {
    display: flex;
    align-items: center;
}

.ProseMirror ul[data-type="taskList"] li input[type="checkbox"] {
    cursor: pointer;
    margin-right: 0.5rem;
}

.ProseMirror blockquote {
    border-left: 4px solid #e5e7eb;
    padding-left: 1rem;
    margin: 1rem 0;
    color: #6b7280;
    font-style: italic;
}

.ProseMirror code {
    background-color: #f3f4f6;
    padding: 0.2em 0.4em;
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.9em;
}

.ProseMirror pre {
    background-color: #1f2937;
    color: #e5e7eb;
    padding: 1rem;
    border-radius: 8px;
    overflow-x: auto;
    margin: 1rem 0;
}

.ProseMirror pre code {
    background: none;
    padding: 0;
    color: inherit;
}

.ProseMirror img {
    max-width: 100%;
    height: auto;
}

.ProseMirror hr {
    border: none;
    border-top: 2px solid #e5e7eb;
    margin: 2rem 0;
}

.ProseMirror table {
    border-collapse: collapse;
    width: 100%;
    margin: 1rem 0;
}

.ProseMirror th,
.ProseMirror td {
    border: 1px solid #e5e7eb;
    padding: 0.5rem 1rem;
    text-align: left;
}

.ProseMirror th {
    background-color: #f9fafb;
    font-weight: bold;
}

.ProseMirror a {
    color: #3b82f6;
    text-decoration: underline;
}

.ProseMirror p {
    margin: 0.5em 0;
}

/* Syntax highlighting per code blocks */
.ProseMirror pre .hljs-comment,
.ProseMirror pre .hljs-quote {
    color: #6a737d;
}

.ProseMirror pre .hljs-variable,
.ProseMirror pre .hljs-template-variable,
.ProseMirror pre .hljs-tag,
.ProseMirror pre .hljs-name,
.ProseMirror pre .hljs-selector-id,
.ProseMirror pre .hljs-selector-class,
.ProseMirror pre .hljs-regexp,
.ProseMirror pre .hljs-deletion {
    color: #e06c75;
}

.ProseMirror pre .hljs-number,
.ProseMirror pre .hljs-built_in,
.ProseMirror pre .hljs-literal,
.ProseMirror pre .hljs-type,
.ProseMirror pre .hljs-params,
.ProseMirror pre .hljs-meta,
.ProseMirror pre .hljs-link {
    color: #d19a66;
}

.ProseMirror pre .hljs-attribute {
    color: #e6c07b;
}

.ProseMirror pre .hljs-string,
.ProseMirror pre .hljs-symbol,
.ProseMirror pre .hljs-bullet,
.ProseMirror pre .hljs-addition {
    color: #98c379;
}

.ProseMirror pre .hljs-title,
.ProseMirror pre .hljs-section {
    color: #61afef;
}

.ProseMirror pre .hljs-keyword,
.ProseMirror pre .hljs-selector-tag {
    color: #c678dd;
}
</style>
