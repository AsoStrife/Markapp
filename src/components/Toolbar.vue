<script setup>
import {
    ListBulletIcon,
    NumberedListIcon,
    CheckCircleIcon,
    LinkIcon,
    PhotoIcon,
    ChatBubbleLeftRightIcon,
    MinusIcon,
    TableCellsIcon,
    CodeBracketIcon,
    CodeBracketSquareIcon
} from '@heroicons/vue/24/outline'
import { computed } from 'vue'

const props = defineProps({
    /** Localized action titles (e.g., 'Bold', 'Italic') */
    titles: { type: Object, default: () => ({}) },
    /** Shortcut labels for each action (e.g., 'Ctrl+B') */
    shortcutLabels: { type: Object, default: () => ({}) }
})
const emit = defineEmits(['action'])

/**
 * Format a tooltip with title and optional shortcut.
 * @param {string} action - Action identifier
 * @returns {string}
 */
function getTooltip(action) {
    const title = props.titles[action] || ''
    const shortcut = props.shortcutLabels[action]
    if (shortcut) {
        // Remove any existing shortcut from title (in case it's already there from i18n)
        const cleanTitle = title.replace(/\s*\([^)]+\)$/, '')
        return `${cleanTitle} (${shortcut})`
    }
    return title
}

function trigger(act) {
    emit('action', act)
}
</script>

<template>
    <div class="flex items-center px-2 py-1.5 gap-2 flex-wrap" style="background-color: var(--toolbar-bg); border-bottom: 1px solid var(--toolbar-border);">
        <!-- Headers -->
        <div class="flex items-center gap-1 pr-3 mr-2" style="border-right: 1px solid var(--toolbar-border-divider);">
            <button @click="trigger('h1')" class="toolbar-btn" :title="getTooltip('h1')">H1</button>
            <button @click="trigger('h2')" class="toolbar-btn" :title="getTooltip('h2')">H2</button>
            <button @click="trigger('h3')" class="toolbar-btn" :title="getTooltip('h3')">H3</button>
            <button @click="trigger('h4')" class="toolbar-btn" :title="getTooltip('h4')">H4</button>
        </div>

        <!-- Text formatting -->
        <div class="flex items-center gap-1 pr-3 mr-2" style="border-right: 1px solid var(--toolbar-border-divider);">
            <button @click="trigger('bold')" class="toolbar-btn font-bold" :title="getTooltip('bold')">B</button>
            <button @click="trigger('italic')" class="toolbar-btn italic" :title="getTooltip('italic')">I</button>
            <button @click="trigger('underline')" class="toolbar-btn underline"
                :title="getTooltip('underline')">U</button>
            <button @click="trigger('strike')" class="toolbar-btn line-through" :title="getTooltip('strike')">S</button>
        </div>

        <!-- Code -->
        <div class="flex items-center gap-1 pr-3 mr-2" style="border-right: 1px solid var(--toolbar-border-divider);">
            <button @click="trigger('code')" class="toolbar-btn-icon" :title="getTooltip('code')">
                <CodeBracketIcon class="h-4 w-4" />
            </button>
            <button @click="trigger('codeBlock')" class="toolbar-btn-icon" :title="getTooltip('codeBlock')">
                <CodeBracketSquareIcon class="h-4 w-4" />
            </button>
        </div>

        <!-- Lists -->
        <div class="flex items-center gap-1 pr-3 mr-2" style="border-right: 1px solid var(--toolbar-border-divider);">
            <button @click="trigger('bulletList')" class="toolbar-btn-icon" :title="getTooltip('bulletList')">
                <ListBulletIcon class="h-4 w-4" />
            </button>
            <button @click="trigger('orderedList')" class="toolbar-btn-icon" :title="getTooltip('orderedList')">
                <NumberedListIcon class="h-4 w-4" />
            </button>
            <button @click="trigger('taskList')" class="toolbar-btn-icon" :title="getTooltip('taskList')">
                <CheckCircleIcon class="h-4 w-4" />
            </button>
        </div>

        <!-- Other elements -->
        <div class="flex items-center gap-1 pr-3 mr-2" style="border-right: 1px solid var(--toolbar-border-divider);">
            <button @click="trigger('blockquote')" class="toolbar-btn-icon" :title="getTooltip('blockquote')">
                <ChatBubbleLeftRightIcon class="h-4 w-4" />
            </button>
            <button @click="trigger('link')" class="toolbar-btn-icon" :title="getTooltip('link')">
                <LinkIcon class="h-4 w-4" />
            </button>
            <button @click="trigger('image')" class="toolbar-btn-icon" :title="getTooltip('image')">
                <PhotoIcon class="h-4 w-4" />
            </button>
        </div>

        <!-- Extras -->
        <div class="flex items-center gap-1">
            <button @click="trigger('hr')" class="toolbar-btn-icon" :title="getTooltip('hr')">
                <MinusIcon class="h-4 w-4" />
            </button>
            <button @click="trigger('table')" class="toolbar-btn-icon" :title="getTooltip('table')">
                <TableCellsIcon class="h-4 w-4" />
            </button>
        </div>
    </div>
</template>
