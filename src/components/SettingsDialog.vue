<script setup>
/**
 * SettingsDialog - Tabbed settings panel for application preferences.
 * 
 * Includes:
 * - General tab: Theme, language, restore session
 * - Shortcuts tab: View and edit keyboard shortcuts
 * 
 * @component
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useShortcuts } from '../composables/useShortcuts'
import { useTheme } from '../composables/useTheme'
import { XMarkIcon, ArrowPathIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
    /** Whether the dialog is visible */
    visible: { type: Boolean, default: false },
    /** Current locale code */
    locale: { type: String, default: 'en' },
    /** Available languages */
    languages: { type: Array, default: () => [] },
    /** Whether restore session is enabled */
    restoreSessionEnabled: { type: Boolean, default: true }
})

const emit = defineEmits([
    'close',
    'update:locale',
    'update:restoreSessionEnabled'
])

const { t } = useI18n()
const { currentTheme, toggleTheme } = useTheme()
const {
    getShortcutsByCategory,
    getShortcutLabel,
    updateShortcut,
    resetShortcut,
    resetAllShortcuts,
    isCustomized,
    findConflict,
    categories
} = useShortcuts()

// Tab state
const activeTab = ref('general')

// Shortcut editing state
const editingShortcutId = ref(null)
const recordedKey = ref('')
const recordedModifiers = ref([])
const editError = ref('')

/**
 * Computed shortcuts grouped by category.
 */
const shortcutsByCategory = computed(() => getShortcutsByCategory())

/**
 * Get the translated name for a shortcut action.
 * @param {string} action - Action identifier
 * @returns {string}
 */
function getActionName(action) {
    // Map action to i18n key
    const actionMap = {
        'new': 'new',
        'open': 'open',
        'save': 'save',
        'saveAs': 'saveAs',
        'bold': 'bold',
        'italic': 'italic',
        'underline': 'underline',
        'strike': 'strike',
        'code': 'code',
        'codeBlock': 'codeBlock',
        'h1': 'h1',
        'h2': 'h2',
        'h3': 'h3',
        'h4': 'h4',
        'bulletList': 'bulletList',
        'orderedList': 'orderedList',
        'taskList': 'taskList',
        'blockquote': 'blockquote',
        'link': 'link',
        'image': 'image',
        'hr': 'hr',
        'table': 'table',
        'find': 'find',
        'replace': 'replace',
        'toggleOutline': 'toggleOutline',
        'settings': 'settings'
    }
    const key = actionMap[action] || action
    return t(`shortcuts.${key}`)
}

/**
 * Get the translated category name.
 * @param {string} category 
 * @returns {string}
 */
function getCategoryName(category) {
    return t(`shortcutCategories.${category}`)
}

/**
 * Start editing a shortcut.
 * @param {string} id - Shortcut ID
 */
function startEditing(id) {
    editingShortcutId.value = id
    recordedKey.value = ''
    recordedModifiers.value = []
    editError.value = ''
}

/**
 * Cancel editing.
 */
function cancelEditing() {
    editingShortcutId.value = null
    recordedKey.value = ''
    recordedModifiers.value = []
    editError.value = ''
}

/**
 * Handle keydown while recording a shortcut.
 * @param {KeyboardEvent} event 
 */
function handleRecordKeyDown(event) {
    if (!editingShortcutId.value) return

    event.preventDefault()
    event.stopPropagation()

    // Handle escape to cancel
    if (event.key === 'Escape') {
        cancelEditing()
        return
    }

    // Ignore modifier-only presses
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(event.key)) {
        return
    }

    // Build modifiers array
    const modifiers = []
    if (event.ctrlKey || event.metaKey) modifiers.push('ctrl')
    if (event.altKey) modifiers.push('alt')
    if (event.shiftKey) modifiers.push('shift')

    // Must have at least one modifier for safety
    if (modifiers.length === 0) {
        editError.value = 'Shortcuts must include Ctrl, Alt, or Shift'
        return
    }

    const key = event.key.toLowerCase()
    recordedKey.value = key
    recordedModifiers.value = modifiers

    // Check for conflicts
    const conflict = findConflict(editingShortcutId.value, key, modifiers)
    if (conflict) {
        // Get the action name for the conflicting shortcut
        const conflictAction = shortcutsByCategory.value
            .flatMap(cat => cat)
            .find(s => s.id === conflict)?.shortcut.action
        editError.value = t('settingsDialog.shortcutConflict', { action: getActionName(conflictAction || conflict) })
        return
    }

    // Apply the new shortcut
    const result = updateShortcut(editingShortcutId.value, key, modifiers)
    if (result.success) {
        cancelEditing()
    } else {
        editError.value = result.error || 'Failed to update shortcut'
    }
}

/**
 * Reset a single shortcut to default.
 * @param {string} id - Shortcut ID
 */
function handleResetShortcut(id) {
    resetShortcut(id)
}

/**
 * Reset all shortcuts to defaults.
 */
function handleResetAllShortcuts() {
    resetAllShortcuts()
}

/**
 * Handle language change.
 * @param {string} code - Language code
 */
function handleLanguageChange(code) {
    emit('update:locale', code)
}

/**
 * Handle restore session toggle.
 */
function handleRestoreSessionToggle() {
    emit('update:restoreSessionEnabled', !props.restoreSessionEnabled)
}

/**
 * Close the dialog.
 */
function handleClose() {
    cancelEditing()
    emit('close')
}

/**
 * Handle click outside to close.
 * @param {MouseEvent} event 
 */
function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
        handleClose()
    }
}

// Add global keydown listener for shortcut recording
onMounted(() => {
    window.addEventListener('keydown', handleRecordKeyDown, true)
})

onUnmounted(() => {
    window.removeEventListener('keydown', handleRecordKeyDown, true)
})
</script>

<template>
    <Teleport to="body">
        <div 
            v-if="visible" 
            class="fixed inset-0 z-50 flex items-center justify-center"
            style="background-color: rgba(0, 0, 0, 0.5);"
            @click="handleBackdropClick"
        >
            <div 
                class="w-full max-w-2xl max-h-[80vh] flex flex-col rounded-lg shadow-xl"
                style="background-color: var(--dialog-bg); color: var(--app-text);"
                @click.stop
            >
                <!-- Header -->
                <div 
                    class="flex items-center justify-between px-6 py-4 border-b"
                    style="border-color: var(--toolbar-border);"
                >
                    <h2 class="text-lg font-semibold">{{ t('settingsDialog.title') }}</h2>
                    <button
                        @click="handleClose"
                        class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        :title="t('settingsDialog.close')"
                    >
                        <XMarkIcon class="w-5 h-5" />
                    </button>
                </div>

                <!-- Tabs -->
                <div 
                    class="flex border-b"
                    style="border-color: var(--toolbar-border);"
                >
                    <button
                        @click="activeTab = 'general'"
                        class="px-6 py-3 text-sm font-medium transition-colors"
                        :class="activeTab === 'general' 
                            ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' 
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'"
                    >
                        {{ t('settingsDialog.generalTab') }}
                    </button>
                    <button
                        @click="activeTab = 'shortcuts'"
                        class="px-6 py-3 text-sm font-medium transition-colors"
                        :class="activeTab === 'shortcuts' 
                            ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' 
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'"
                    >
                        {{ t('settingsDialog.shortcutsTab') }}
                    </button>
                </div>

                <!-- Content -->
                <div class="flex-1 overflow-y-auto p-6">
                    <!-- General Tab -->
                    <div v-if="activeTab === 'general'" class="space-y-6">
                        <!-- Theme -->
                        <div class="flex items-center justify-between">
                            <label class="text-sm font-medium">{{ t('settingsDialog.theme') }}</label>
                            <div class="flex items-center gap-2">
                                <button
                                    @click="toggleTheme"
                                    class="px-4 py-2 text-sm rounded-md transition-colors"
                                    :class="currentTheme === 'light' 
                                        ? 'bg-blue-500 text-white' 
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'"
                                >
                                    {{ t('settingsDialog.themeLight') }}
                                </button>
                                <button
                                    @click="toggleTheme"
                                    class="px-4 py-2 text-sm rounded-md transition-colors"
                                    :class="currentTheme === 'dark' 
                                        ? 'bg-blue-500 text-white' 
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'"
                                >
                                    {{ t('settingsDialog.themeDark') }}
                                </button>
                            </div>
                        </div>

                        <!-- Language -->
                        <div class="flex items-center justify-between">
                            <label class="text-sm font-medium">{{ t('settingsDialog.language') }}</label>
                            <select
                                :value="locale"
                                @change="handleLanguageChange($event.target.value)"
                                class="px-4 py-2 text-sm rounded-md border transition-colors"
                                style="background-color: var(--input-bg); border-color: var(--toolbar-border); color: var(--app-text);"
                            >
                                <option 
                                    v-for="lang in languages" 
                                    :key="lang.code" 
                                    :value="lang.code"
                                >
                                    {{ lang.label }}
                                </option>
                            </select>
                        </div>

                        <!-- Restore Session -->
                        <div class="flex items-center justify-between">
                            <label class="text-sm font-medium">{{ t('settingsDialog.restoreSession') }}</label>
                            <button
                                @click="handleRestoreSessionToggle"
                                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                                :class="restoreSessionEnabled ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'"
                            >
                                <span
                                    class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                                    :class="restoreSessionEnabled ? 'translate-x-6' : 'translate-x-1'"
                                />
                            </button>
                        </div>
                    </div>

                    <!-- Shortcuts Tab -->
                    <div v-if="activeTab === 'shortcuts'" class="space-y-6">
                        <!-- Reset All Button -->
                        <div class="flex justify-end">
                            <button
                                @click="handleResetAllShortcuts"
                                class="flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                            >
                                <ArrowPathIcon class="w-4 h-4" />
                                {{ t('settingsDialog.shortcutResetAll') }}
                            </button>
                        </div>

                        <!-- Shortcuts by Category -->
                        <div v-for="category in categories" :key="category" class="space-y-3">
                            <h3 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                {{ getCategoryName(category) }}
                            </h3>
                            <div class="space-y-1">
                                <div
                                    v-for="{ id, shortcut } in shortcutsByCategory[category]"
                                    :key="id"
                                    class="flex items-center justify-between py-2 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <!-- Action Name -->
                                    <span class="text-sm">{{ getActionName(shortcut.action) }}</span>

                                    <!-- Shortcut Key Display / Editor -->
                                    <div class="flex items-center gap-2">
                                        <!-- Recording State -->
                                        <div v-if="editingShortcutId === id" class="flex flex-col items-end">
                                            <div class="flex items-center gap-2">
                                                <span 
                                                    class="px-3 py-1 text-sm rounded border-2 border-dashed border-blue-500 bg-blue-50 dark:bg-blue-900/20 min-w-[120px] text-center"
                                                >
                                                    {{ recordedKey ? `${recordedModifiers.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join('+')}+${recordedKey.toUpperCase()}` : t('settingsDialog.shortcutRecording') }}
                                                </span>
                                                <button
                                                    @click="cancelEditing"
                                                    class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                                                    :title="t('settingsDialog.shortcutCancel')"
                                                >
                                                    <XMarkIcon class="w-4 h-4" />
                                                </button>
                                            </div>
                                            <span v-if="editError" class="text-xs text-red-500 mt-1">{{ editError }}</span>
                                            <span v-else class="text-xs text-gray-500 mt-1">{{ t('settingsDialog.shortcutCancel') }}</span>
                                        </div>

                                        <!-- Normal State -->
                                        <template v-else>
                                            <button
                                                @click="startEditing(id)"
                                                class="px-3 py-1 text-sm rounded border transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                                                :class="isCustomized(id) 
                                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                                                    : 'border-gray-300 dark:border-gray-600'"
                                                style="min-width: 100px;"
                                                :title="t('settingsDialog.shortcutEdit')"
                                            >
                                                {{ getShortcutLabel(id) }}
                                            </button>
                                            <button
                                                v-if="isCustomized(id)"
                                                @click="handleResetShortcut(id)"
                                                class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500"
                                                :title="t('settingsDialog.shortcutReset')"
                                            >
                                                <ArrowPathIcon class="w-4 h-4" />
                                            </button>
                                        </template>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div 
                    class="flex justify-end px-6 py-4 border-t"
                    style="border-color: var(--toolbar-border);"
                >
                    <button
                        @click="handleClose"
                        class="px-6 py-2 text-sm font-medium rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                    >
                        {{ t('settingsDialog.close') }}
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
</template>
