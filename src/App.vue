<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocalStorage } from '@vueuse/core'
import { useTheme } from './composables/useTheme'
import { useResizable } from './composables/useResizable'
import { useShortcuts } from './composables/useShortcuts'
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
import ConfirmCloseDialog from './components/ConfirmCloseDialog.vue'
import SearchReplaceDialog from './components/SearchReplaceDialog.vue'
import ResizeHandle from './components/ResizeHandle.vue'
import SettingsDialog from './components/SettingsDialog.vue'

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

// Theme management
const { currentTheme, toggleTheme, initTheme } = useTheme()

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
const isLoadingFile = ref(false)
const showOutline = ref(true)
const restoreSessionEnabled = useLocalStorage('markapp.restoreSession', true)
const sessionState = useLocalStorage('markapp.session', { filePath: null, cursor: 0 })
const lastCursorIndex = ref(0)
const showCloseDialog = ref(false)
const showSearchDialog = ref(false)
const searchDialogMode = ref('search') // 'search' or 'replace'

// Resizable columns
// Outline panel con larghezza fissa tra 150-600px
const { width: outlineWidth, startResize: startOutlineResize } = useResizable('markapp.outlineWidth', 256, 150, () => 600)

// Editor in split view: calcola il max width dinamicamente per evitare spazio vuoto
// Il max width è lo spazio disponibile meno lo spazio minimo per il preview (300px)
const getEditorMaxWidth = () => {
    if (typeof window === 'undefined') return 2000
    const availableSpace = window.innerWidth - (showOutline.value ? outlineWidth.value : 0) - 4 // -4 per i resize handles
    return Math.max(300, availableSpace - 300) // Lascia almeno 300px per il preview
}

const defaultEditorWidth = typeof window !== 'undefined' ? Math.floor((window.innerWidth - 256) / 2) : 600
const { width: editorWidth, startResize: startEditorResize } = useResizable('markapp.editorWidth', defaultEditorWidth, 300, getEditorMaxWidth)

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
    outline: t('outline.title'),
    settings: t('settings.menu'),
    restoreSession: t('settings.restoreSession'),
    themeDark: t('settings.themeDark'),
    themeLight: t('settings.themeLight'),
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
    if (typeof index === 'number') {
        lastCursorIndex.value = index
        if (restoreSessionEnabled.value) {
            sessionState.value = {
                filePath: currentFilePath.value || null,
                cursor: index,
            }
        }
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
    // Non impostare isModified se stiamo caricando un file
    if (!isLoadingFile.value) {
        isModified.value = true
    }

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

// Watch per comunicare lo stato delle modifiche a Electron
watch(isModified, (newValue) => {
    if (window.electronAPI && window.electronAPI.setModifiedState) {
        window.electronAPI.setModifiedState(newValue)
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
        return false
    }

    const filePath = await window.electronAPI.getCurrentFilePath()

    if (filePath) {
        const result = await window.electronAPI.saveFile(filePath, markdownContent.value)
        if (result.success) {
            isModified.value = false
            currentFilePath.value = result.filePath
            return true
        } else {
            alert(t('alerts.saveError', { error: result.error }))
            return false
        }
    } else {
        return await handleSaveAs()
    }
}

async function handleSaveAs() {
    if (!window.electronAPI) {
        alert(t('alerts.noElectron'))
        return false
    }

    const result = await window.electronAPI.saveFileDialog(markdownContent.value)
    if (result.success) {
        isModified.value = false
        currentFilePath.value = result.filePath
        return true
    } else if (result.error) {
        alert(t('alerts.saveError', { error: result.error }))
        return false
    }
    return false // User cancelled
}

async function handleOpen() {
    if (!window.electronAPI) {
        alert(t('alerts.noElectron'))
        return
    }

    const result = await window.electronAPI.openFileDialog()
    if (result.success) {
        isLoadingFile.value = true
        markdownContent.value = result.content
        currentFilePath.value = result.filePath

        if (restoreSessionEnabled.value) {
            sessionState.value = {
                filePath: result.filePath,
                cursor: lastCursorIndex.value || 0,
            }
        }

        // Aggiorna anche Tiptap
        if (tiptapEditor.value) {
            isUpdatingFromMarkdown.value = true
            const html = marked(result.content)
            tiptapEditor.value.commands.setContent(html, false)
            isUpdatingFromMarkdown.value = false
        }

        // Imposta isModified a false dopo tutti gli aggiornamenti
        await nextTick()
        isModified.value = false
        isLoadingFile.value = false
    } else if (result.error) {
        alert(t('alerts.openError', { error: result.error }))
    }
}

async function handleNew() {
    const lang = locale.value || 'en'
    const newContent = lang === 'it' ? welcomeIt : welcomeEn
    isLoadingFile.value = true
    markdownContent.value = newContent
    currentFilePath.value = null

    if (restoreSessionEnabled.value) {
        sessionState.value = { filePath: null, cursor: 0 }
    }

    // Aggiorna anche Tiptap
    if (tiptapEditor.value) {
        isUpdatingFromMarkdown.value = true
        const html = marked(newContent)
        tiptapEditor.value.commands.setContent(html, false)
        isUpdatingFromMarkdown.value = false
    }

    // Imposta isModified a false dopo tutti gli aggiornamenti
    await nextTick()
    isModified.value = false
    isLoadingFile.value = false
}

async function handleBeforeClose() {
    if (!isModified.value) {
        // No unsaved changes, allow close
        if (window.electronAPI && window.electronAPI.confirmClose) {
            window.electronAPI.confirmClose('close')
        }
        return
    }

    // Show the confirmation dialog component
    showCloseDialog.value = true
}

async function handleCloseDialogSave() {
    showCloseDialog.value = false
    // Save the file first
    const saved = await handleSave()
    // Only close if save was successful (not cancelled)
    if (saved && window.electronAPI && window.electronAPI.confirmClose) {
        window.electronAPI.confirmClose('close')
    } else if (!saved && window.electronAPI && window.electronAPI.confirmClose) {
        // Save was cancelled, treat as cancel
        window.electronAPI.confirmClose('cancel')
    }
}

function handleCloseDialogDontSave() {
    showCloseDialog.value = false
    if (window.electronAPI && window.electronAPI.confirmClose) {
        window.electronAPI.confirmClose('close')
    }
}

function handleCloseDialogCancel() {
    showCloseDialog.value = false
    if (window.electronAPI && window.electronAPI.confirmClose) {
        window.electronAPI.confirmClose('cancel')
    }
}

// Search and replace functions
function handleShowSearch() {
    if (showSearchDialog.value && searchDialogMode.value === 'search') {
        // Dialog already open in search mode, close it
        showSearchDialog.value = false
    } else {
        // Open or switch to search mode
        searchDialogMode.value = 'search'
        showSearchDialog.value = true
    }
}

function handleShowReplace() {
    if (showSearchDialog.value && searchDialogMode.value === 'replace') {
        // Dialog already open in replace mode, close it
        showSearchDialog.value = false
    } else {
        // Open or switch to replace mode
        searchDialogMode.value = 'replace'
        showSearchDialog.value = true
    }
}

function handleSearchFind(match) {
    if (!markdownEditorRef.value) return
    markdownEditorRef.value.selectRange(match.start, match.end)
}

function handleSearchReplace({ match, replaceText }) {
    if (!markdownEditorRef.value) return
    markdownEditorRef.value.replaceSelection(match.start, match.end, replaceText)
}

function handleSearchReplaceAll({ matches, replaceText, searchText, caseSensitive, useRegex, wholeWord }) {
    if (!matches || matches.length === 0) return

    let newContent = markdownContent.value

    if (useRegex) {
        // Use regex replace
        try {
            let pattern = searchText
            const flags = caseSensitive ? 'g' : 'gi'
            const regex = new RegExp(pattern, flags)
            newContent = newContent.replace(regex, replaceText)
        } catch (err) {
            // Invalid regex, skip
            return
        }
    } else if (wholeWord) {
        // Word boundary replace
        try {
            const pattern = `\\b${searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`
            const flags = caseSensitive ? 'g' : 'gi'
            const regex = new RegExp(pattern, flags)
            newContent = newContent.replace(regex, replaceText)
        } catch (err) {
            return
        }
    } else {
        // Simple replace all
        if (caseSensitive) {
            newContent = newContent.split(searchText).join(replaceText)
        } else {
            // Case-insensitive replace
            const regex = new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
            newContent = newContent.replace(regex, replaceText)
        }
    }

    markdownContent.value = newContent
}

function handleSearchClose() {
    showSearchDialog.value = false
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
                }
            }).catch(() => { /* ignore */ })
        }
        window.electronAPI.onFileNew(() => {
            handleNew()
        })

        window.electronAPI.onFileOpen(() => {
            handleOpen()
        })

        window.electronAPI.onFileOpened(async (data) => {
            isLoadingFile.value = true
            markdownContent.value = data.content
            currentFilePath.value = data.filePath

            if (restoreSessionEnabled.value) {
                sessionState.value = {
                    filePath: data.filePath,
                    cursor: lastCursorIndex.value || 0,
                }
            }

            if (tiptapEditor.value) {
                isUpdatingFromMarkdown.value = true
                const html = marked(data.content)
                tiptapEditor.value.commands.setContent(html, false)
                isUpdatingFromMarkdown.value = false
            }

            // Imposta isModified a false dopo tutti gli aggiornamenti
            await nextTick()
            isModified.value = false
            isLoadingFile.value = false
        })

        window.electronAPI.onFileSave(() => {
            handleSave()
        })

        window.electronAPI.onFileSaveAs(() => {
            handleSaveAs()
        })


        // Attempt session restore on startup if enabled
        if (restoreSessionEnabled.value && sessionState.value && sessionState.value.filePath && window.electronAPI && window.electronAPI.openFileByPath) {
            window.electronAPI.openFileByPath(sessionState.value.filePath).then(async (result) => {
                if (result && result.success) {
                    isLoadingFile.value = true
                    markdownContent.value = result.content
                    currentFilePath.value = result.filePath

                    if (tiptapEditor.value) {
                        isUpdatingFromMarkdown.value = true
                        const html = marked(result.content)
                        tiptapEditor.value.commands.setContent(html, false)
                        isUpdatingFromMarkdown.value = false
                    }

                    // Imposta isModified a false dopo tutti gli aggiornamenti
                    await nextTick()
                    isModified.value = false
                    isLoadingFile.value = false

                    // Jump to last cursor index (clamped)
                    const idx = Math.max(0, Math.min(sessionState.value.cursor || 0, (result.content || '').length))
                    // Ensure editor is mounted before jumping
                    setTimeout(() => {
                        if (markdownEditorRef.value) {
                            markdownEditorRef.value.jumpToIndex(idx)
                        }
                    }, 50)
                } else {
                    // If file missing, clear session
                    sessionState.value = { filePath: null, cursor: 0 }
                }
            }).catch(() => { /* ignore */ })
        }
        // Handle file opened via file association (double-click, right-click → Open with)
        window.electronAPI.onOpenFile(async (data) => {
            if (data && data.content !== undefined) {
                isLoadingFile.value = true
                markdownContent.value = data.content
                currentFilePath.value = data.filePath

                if (restoreSessionEnabled.value) {
                    sessionState.value = {
                        filePath: data.filePath,
                        cursor: lastCursorIndex.value || 0,
                    }
                }

                if (tiptapEditor.value) {
                    isUpdatingFromMarkdown.value = true
                    const html = marked(data.content)
                    tiptapEditor.value.commands.setContent(html, false)
                    isUpdatingFromMarkdown.value = false
                }

                // Imposta isModified a false dopo tutti gli aggiornamenti
                await nextTick()
                isModified.value = false
                isLoadingFile.value = false
            }
        })

        // Handle before close event
        window.electronAPI.onBeforeClose(() => {
            handleBeforeClose()
        })

        // Handle search/replace from menu
        window.electronAPI.onShowSearch(() => {
            handleShowSearch()
        })

        window.electronAPI.onShowReplace(() => {
            handleShowReplace()
        })

        // Handle settings from menu
        if (window.electronAPI.onShowSettings) {
            window.electronAPI.onShowSettings(() => {
                handleShowSettings()
            })
        }
    }
})

// Shortcuts composable
const { 
    shortcutLabels, 
    registerAction, 
    handleKeyEvent, 
    syncToElectron 
} = useShortcuts()

// Settings dialog state
const showSettingsDialog = ref(false)

function handleShowSettings() {
    showSettingsDialog.value = true
}

function handleCloseSettings() {
    showSettingsDialog.value = false
}

function handleSettingsLocaleChange(newLocale) {
    setLanguage(newLocale)
}

// Register all shortcut actions
function registerShortcutActions() {
    // File operations
    registerAction('new', handleNew)
    registerAction('open', handleOpen)
    registerAction('save', handleSave)
    registerAction('saveAs', handleSaveAs)
    
    // Formatting
    registerAction('bold', () => handleToolbarAction('bold'))
    registerAction('italic', () => handleToolbarAction('italic'))
    registerAction('underline', () => handleToolbarAction('underline'))
    registerAction('strike', () => handleToolbarAction('strike'))
    registerAction('code', () => handleToolbarAction('code'))
    registerAction('codeBlock', () => handleToolbarAction('codeBlock'))
    registerAction('h1', () => handleToolbarAction('h1'))
    registerAction('h2', () => handleToolbarAction('h2'))
    registerAction('h3', () => handleToolbarAction('h3'))
    registerAction('h4', () => handleToolbarAction('h4'))
    registerAction('bulletList', () => handleToolbarAction('bulletList'))
    registerAction('orderedList', () => handleToolbarAction('orderedList'))
    registerAction('taskList', () => handleToolbarAction('taskList'))
    registerAction('blockquote', () => handleToolbarAction('blockquote'))
    registerAction('link', () => handleToolbarAction('link'))
    registerAction('image', () => handleToolbarAction('image'))
    registerAction('hr', () => handleToolbarAction('hr'))
    registerAction('table', () => handleToolbarAction('table'))
    
    // Navigation
    registerAction('find', handleShowSearch)
    registerAction('replace', handleShowReplace)
    registerAction('toggleOutline', () => { showOutline.value = !showOutline.value })
    registerAction('settings', handleShowSettings)
}

// Central keyboard event handler using shortcuts composable
function handleKeyDown(e) {
    handleKeyEvent(e)
}

onMounted(() => {
    // Register shortcut actions before adding listener
    registerShortcutActions()
    
    window.addEventListener('keydown', handleKeyDown)
    // Inizializza il tema all'avvio dell'app
    initTheme()
    
    // Sync shortcuts to Electron menu
    syncToElectron()
})

onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
    if (tiptapEditor.value) {
        tiptapEditor.value.destroy()
    }
    // Persist session on close if enabled
    try {
        if (restoreSessionEnabled.value) {
            sessionState.value = {
                filePath: currentFilePath.value || null,
                cursor: lastCursorIndex.value || 0,
            }
        }
    } catch (_) { }
})
</script>

<template>
    <div class="h-screen flex flex-col" style="background-color: var(--app-bg); color: var(--app-text);">
        <TitleBar :currentFilePath="currentFilePath" :isModified="isModified" :untitledLabel="t('file.untitled')" />
        <Toolbar :titles="toolbarTitles" :shortcutLabels="shortcutLabels" @action="handleToolbarAction" />
        <div class="flex-1 flex overflow-hidden">
            <!-- Outline Panel -->
            <OutlinePanel v-show="showOutline" :items="outlineItems" :title="t('outline.title')" :width="outlineWidth"
                @select="handleOutlineSelect" />

            <!-- Resize Handle per Outline -->
            <ResizeHandle v-show="showOutline" @mousedown="startOutlineResize" />

            <div class="flex-1 flex overflow-hidden">
                <!-- Markdown Editor -->
                <MarkdownEditor v-show="viewMode === 'split' || viewMode === 'raw'"
                    :width="viewMode === 'split' ? editorWidth : null" ref="markdownEditorRef" v-model="markdownContent"
                    :placeholder="t('editor.placeholder')" @cursor="handleCursor" />

                <!-- Resize Handle tra Editor e Preview -->
                <ResizeHandle v-show="viewMode === 'split'" @mousedown="startEditorResize" />

                <!-- Preview Pane -->
                <PreviewPane ref="previewPaneRef" v-show="viewMode === 'split'" :html="renderedMarkdown"
                    :title="t('preview.title')" :readonlyLabel="t('preview.readonly')" />

                <!-- WYSIWYG Editor -->
                <WysiwygEditor v-show="viewMode === 'preview'" :editor="tiptapEditor" />
            </div>
        </div>
        <StatusBar :markdownContent="markdownContent" :viewMode="viewMode" :locale="locale" :languages="languages"
            :showLangMenu="showLangMenu" :showOutline="showOutline" :restoreSessionEnabled="restoreSessionEnabled"
            :currentTheme="currentTheme" :text="statusText" @update:viewMode="mode => viewMode = mode"
            @toggleLangMenu="showLangMenu = !showLangMenu" @selectLanguage="setLanguage"
            @toggleOutline="showOutline = !showOutline"
            @toggleRestoreSession="restoreSessionEnabled = !restoreSessionEnabled" @toggleTheme="toggleTheme"
            @closeLangMenu="showLangMenu = false" />

        <!-- Confirm Close Dialog -->
        <ConfirmCloseDialog v-if="showCloseDialog" :title="t('dialog.unsavedChanges')"
            :message="t('dialog.unsavedMessage')" :saveLabel="t('dialog.save')" :dontSaveLabel="t('dialog.dontSave')"
            :cancelLabel="t('dialog.cancel')" @save="handleCloseDialogSave" @dontSave="handleCloseDialogDontSave"
            @cancel="handleCloseDialogCancel" />

        <!-- Search/Replace Dialog -->
        <SearchReplaceDialog :visible="showSearchDialog" :mode="searchDialogMode" :content="markdownContent"
            :cursorPosition="markdownEditorRef?.getCursorPosition() || 0" @close="handleSearchClose"
            @find="handleSearchFind" @replace="handleSearchReplace" @replaceAll="handleSearchReplaceAll" />

        <!-- Settings Dialog -->
        <SettingsDialog 
            :visible="showSettingsDialog" 
            :locale="locale" 
            :languages="languages"
            :restoreSessionEnabled="restoreSessionEnabled"
            @close="handleCloseSettings"
            @update:locale="handleSettingsLocaleChange"
            @update:restoreSessionEnabled="val => restoreSessionEnabled = val" />
    </div>
</template>
