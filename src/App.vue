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
import { useEditor } from '@tiptap/vue-3'
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

// Components
import TitleBar from './components/TitleBar.vue'
import Toolbar from './components/Toolbar.vue'
import MarkdownEditor from './components/MarkdownEditor.vue'
import PreviewPane from './components/PreviewPane.vue'
import WysiwygEditor from './components/WysiwygEditor.vue'
import StatusBar from './components/StatusBar.vue'
import OutlinePanel from './components/OutlinePanel.vue'

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
const markdownEditorRef = ref(null)
const isUpdatingFromTiptap = ref(false)
const isUpdatingFromMarkdown = ref(false)

// UI texts
const toolbarTitles = computed(() => ({
    h1: t('toolbar.h1'),
    h2: t('toolbar.h2'),
    h3: t('toolbar.h3'),
    h4: t('toolbar.h4'),
    bold: t('toolbar.bold'),
    italic: t('toolbar.italic'),
    underline: t('toolbar.underline'),
    strike: t('toolbar.strike'),
    code: t('toolbar.code'),
    codeBlock: t('toolbar.codeBlock'),
    bulletList: t('toolbar.bulletList'),
    orderedList: t('toolbar.numberedList'),
    taskList: t('toolbar.taskList'),
    blockquote: t('toolbar.blockquote'),
    link: t('toolbar.link'),
    image: t('toolbar.image'),
    hr: t('toolbar.hr'),
    table: t('toolbar.table'),
}))

const statusText = computed(() => ({
    markdown: t('status.markdown'),
    encoding: t('status.encoding'),
    lines: t('stats.lines'),
    words: t('stats.words'),
    viewRaw: t('toolbar.viewRaw'),
    viewSplit: t('toolbar.viewSplit'),
    viewPreview: t('toolbar.viewPreview'),
}))

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
// Render preview HTML with block range wrappers to map cursor indices
const renderedMarkdown = computed(() => {
    try {
        const md = markdownContent.value || ''
        const tokens = marked.lexer(md)
        let offset = 0
        const parts = []
        for (const token of tokens) {
            const start = offset
            const raw = token.raw || ''
            offset += raw.length
            const html = marked.parser([token])
            parts.push(`<div class="md-block" data-start="${start}" data-end="${offset}">${html}</div>`)
        }
        return parts.join('')
    } catch (err) {
        return `<p class="text-red-500">${t('alerts.renderError')}</p>`
    }
})

// Outline items from markdown headings
const outlineItems = computed(() => {
    try {
        const md = markdownContent.value || ''
        const tokens = marked.lexer(md)
        let offset = 0
        const items = []
        for (const token of tokens) {
            const start = offset
            const raw = token.raw || ''
            offset += raw.length
            if (token.type === 'heading') {
                items.push({ title: token.text || '', level: token.depth || 1, index: start })
            }
        }
        return items
    } catch (_) {
        return []
    }
})

// Tiptap Editor
const tiptapEditor = useEditor({
    extensions: [
        StarterKit.configure({
            codeBlock: false, // Usiamo CodeBlockLowlight
            link: false,      // We include Link explicitly below
            underline: false, // We include Underline explicitly below
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
    // Initialize with plain HTML without range wrappers
    content: marked(markdownContent.value),
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
const previewPaneRef = ref(null)

function handleCursor(index) {
    if (viewMode.value === 'split' && previewPaneRef.value && typeof index === 'number') {
        previewPaneRef.value.highlightByIndex(index)
    }
}

function handleOutlineSelect(index) {
    if (typeof index !== 'number') return
    if (viewMode.value === 'preview') {
        // Switch to split to show preview alongside editor for jumping
        viewMode.value = 'split'
    }
    if (previewPaneRef.value) {
        previewPaneRef.value.highlightByIndex(index)
    }
    if (markdownEditorRef.value) {
        markdownEditorRef.value.jumpToIndex(index)
    }
}

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

// Toolbar actions routing
function handleToolbarAction(action) {
    if (activeEditor.value === 'tiptap' && tiptapEditor.value) {
        const chain = tiptapEditor.value.chain().focus()
        switch (action) {
            case 'bold': chain.toggleBold().run(); break
            case 'italic': chain.toggleItalic().run(); break
            case 'underline': chain.toggleUnderline().run(); break
            case 'strike': chain.toggleStrike().run(); break
            case 'code': chain.toggleCode().run(); break
            case 'codeBlock': chain.toggleCodeBlock().run(); break
            case 'blockquote': chain.toggleBlockquote().run(); break
            case 'h1': chain.toggleHeading({ level: 1 }).run(); break
            case 'h2': chain.toggleHeading({ level: 2 }).run(); break
            case 'h3': chain.toggleHeading({ level: 3 }).run(); break
            case 'h4': chain.toggleHeading({ level: 4 }).run(); break
            case 'bulletList': chain.toggleBulletList().run(); break
            case 'orderedList': chain.toggleOrderedList().run(); break
            case 'taskList': chain.toggleTaskList().run(); break
            case 'hr': chain.setHorizontalRule().run(); break
            case 'table': chain.insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); break
            case 'link': {
                const url = prompt(t('prompt.enterUrl'), 'https://')
                if (url) chain.setLink({ href: url }).run()
                break
            }
            case 'image': {
                const url = prompt(t('prompt.enterImageUrl'), 'https://')
                if (url) chain.setImage({ src: url }).run()
                break
            }
        }
    } else {
        if (!markdownEditorRef.value) return
        switch (action) {
            case 'bold': markdownEditorRef.value.formatBold(); break
            case 'italic': markdownEditorRef.value.formatItalic(); break
            case 'underline': markdownEditorRef.value.formatUnderline(); break
            case 'strike': markdownEditorRef.value.formatStrikethrough(); break
            case 'code': markdownEditorRef.value.formatCode(); break
            case 'codeBlock': markdownEditorRef.value.formatCodeBlock(); break
            case 'blockquote': markdownEditorRef.value.formatBlockquote(); break
            case 'h1': markdownEditorRef.value.formatH1(); break
            case 'h2': markdownEditorRef.value.formatH2(); break
            case 'h3': markdownEditorRef.value.formatH3(); break
            case 'h4': markdownEditorRef.value.formatH4(); break
            case 'bulletList': markdownEditorRef.value.formatBulletList(); break
            case 'orderedList': markdownEditorRef.value.formatNumberedList(); break
            case 'taskList': markdownEditorRef.value.formatTaskList(); break
            case 'hr': markdownEditorRef.value.formatHorizontalRule(); break
            case 'table': markdownEditorRef.value.formatTable(); break
            case 'link': {
                const url = prompt(t('prompt.enterUrl'), 'https://')
                markdownEditorRef.value.applyLink(url)
                break
            }
            case 'image': {
                const url = prompt(t('prompt.enterImageUrl'), 'https://')
                markdownEditorRef.value.applyImage(url)
                break
            }
        }
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

        // Handle file opened via file association (double-click, right-click → Open with)
        window.electronAPI.onOpenFile((data) => {
            if (data && data.content !== undefined) {
                markdownContent.value = data.content
                currentFilePath.value = data.filePath
                isModified.value = false

                if (tiptapEditor.value) {
                    isUpdatingFromMarkdown.value = true
                    const html = marked(data.content)
                    tiptapEditor.value.commands.setContent(html, false)
                    isUpdatingFromMarkdown.value = false
                }
            }
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
        handleToolbarAction('bold')
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault()
        handleToolbarAction('italic')
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault()
        handleToolbarAction('underline')
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
        <TitleBar :currentFilePath="currentFilePath" :isModified="isModified" :untitledLabel="t('file.untitled')" />
        <Toolbar :titles="toolbarTitles" @action="handleToolbarAction" />
        <div class="flex-1 flex overflow-hidden">
            <OutlinePanel :items="outlineItems" :title="t('preview.title')" @select="handleOutlineSelect" />
            <div class="flex-1 flex overflow-hidden">
                <MarkdownEditor v-show="viewMode === 'split' || viewMode === 'raw'"
                    :class="viewMode === 'split' ? 'w-1/2' : 'w-full'"
                    ref="markdownEditorRef" v-model="markdownContent" :placeholder="t('editor.placeholder')" @cursor="handleCursor" />
                <PreviewPane ref="previewPaneRef" v-show="viewMode === 'split'" :html="renderedMarkdown" :title="t('preview.title')"
                    :readonlyLabel="t('preview.readonly')" />
                <WysiwygEditor v-show="viewMode === 'preview'" :editor="tiptapEditor" />
            </div>
        </div>
        <StatusBar :markdownContent="markdownContent" :viewMode="viewMode" :locale="locale.value" :languages="languages"
            :showLangMenu="showLangMenu" :text="statusText" @update:viewMode="mode => viewMode = mode"
            @toggleLangMenu="showLangMenu = !showLangMenu" @selectLanguage="setLanguage" />
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

/* Toolbar styles moved to Toolbar component; tiptap wrapper styles moved to WysiwygEditor component */
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
