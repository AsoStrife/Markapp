<template>
    <div v-if="visible" class="fixed top-4 right-4 z-50"
        :style="{ transform: `translate(${position.x}px, ${position.y}px)` }">
        <div ref="dialogRef"
            class="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-96 border border-gray-300 dark:border-gray-600"
            @click.stop>
            <!-- Draggable header -->
            <div class="flex items-center justify-between px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-t-lg cursor-move select-none"
                @mousedown="startDrag">
                <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {{ mode === 'search' ? t('search.title') : t('search.replaceTitle') }}
                </h2>
                <button @click="close" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    :title="t('search.close')">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div class="p-4">
                <!-- Search input -->
                <div class="mb-3">
                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {{ t('search.searchFor') }}
                    </label>
                    <input ref="searchInput" v-model="searchText" type="text" class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded 
                   bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                   focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        :placeholder="t('search.searchPlaceholder')" @keydown.enter="findNext" @keydown.esc="close" />
                    <!-- Find buttons directly under search field, aligned right -->
                    <div class="mt-2 flex justify-end gap-2">
                        <button @click="findPrevious" :disabled="!searchText" class="btn-small secondary">
                            {{ t('search.findPrevious') }}
                        </button>
                        <button @click="findNext" :disabled="!searchText" class="btn-small primary">
                            {{ t('search.findNext') }}
                        </button>
                    </div>
                </div>

                <!-- Replace input (only in replace mode) -->
                <div v-if="mode === 'replace'" class="mb-3">
                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {{ t('search.replaceWith') }}
                    </label>
                    <input v-model="replaceText" type="text" class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded 
                   bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                   focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        :placeholder="t('search.replacePlaceholder')" @keydown.enter="replace" @keydown.esc="close" />

                    <!-- Replace buttons directly under replace field, aligned right -->
                    <div class="mt-2 flex justify-end gap-2">
                        <button @click="replace" :disabled="!searchText || totalMatches === 0" class="btn-small action">
                            {{ t('search.replace') }}
                        </button>
                        <button @click="replaceAll" :disabled="!searchText || totalMatches === 0"
                            class="btn-small action">
                            {{ t('search.replaceAll') }}
                        </button>
                    </div>
                </div>

                <!-- Options -->
                <div class="mb-3 space-y-1">
                    <label class="flex items-center text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                        <input v-model="caseSensitive" type="checkbox" class="mr-2 rounded border-gray-300 dark:border-gray-600 
                     text-blue-600 focus:ring-blue-500" />
                        {{ t('search.caseSensitive') }}
                    </label>
                    <label class="flex items-center text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                        <input v-model="wholeWord" type="checkbox" class="mr-2 rounded border-gray-300 dark:border-gray-600 
                     text-blue-600 focus:ring-blue-500" />
                        {{ t('search.wholeWord') }}
                    </label>
                    <label class="flex items-center text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                        <input v-model="useRegex" type="checkbox" class="mr-2 rounded border-gray-300 dark:border-gray-600 
                     text-blue-600 focus:ring-blue-500" />
                        {{ t('search.useRegex') }}
                    </label>
                </div>

                <!-- Match counter -->
                <div v-if="searchText && totalMatches > 0" class="mb-3 text-xs text-gray-600 dark:text-gray-400">
                    {{ currentMatchIndex + 1 }} {{ t('search.of') }} {{ totalMatches }}
                </div>

                <div v-if="searchText && totalMatches === 0" class="mb-3 text-xs text-red-600 dark:text-red-400">
                    {{ t('search.noMatches') }}
                </div>

                <!-- no global action buttons: buttons are located under each input -->
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
    visible: { type: Boolean, default: false },
    mode: { type: String, default: 'search' }, // 'search' or 'replace'
    content: { type: String, default: '' },
    cursorPosition: { type: Number, default: 0 }
})

const emit = defineEmits(['close', 'find', 'replace', 'replaceAll'])

const searchInput = ref(null)
const dialogRef = ref(null)
const searchText = ref('')
const replaceText = ref('')
const caseSensitive = ref(false)
const wholeWord = ref(false)
const useRegex = ref(false)
const currentMatchIndex = ref(-1)
const totalMatches = ref(0)
const matches = ref([])

// Dragging state
const position = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })

function startDrag(e) {
    isDragging.value = true
    dragStart.value = {
        x: e.clientX - position.value.x,
        y: e.clientY - position.value.y
    }

    const onMouseMove = (e) => {
        if (!isDragging.value) return
        position.value = {
            x: e.clientX - dragStart.value.x,
            y: e.clientY - dragStart.value.y
        }
    }

    const onMouseUp = () => {
        isDragging.value = false
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
}

watch(() => props.visible, (val) => {
    if (val) {
        // Reset position when dialog is shown
        position.value = { x: 0, y: 0 }
        nextTick(() => {
            searchInput.value?.focus()
        })
    }
})

watch([() => searchText.value, () => caseSensitive.value, () => wholeWord.value, () => useRegex.value, () => props.content], () => {
    findMatches()
})

function close() {
    searchText.value = ''
    replaceText.value = ''
    currentMatchIndex.value = -1
    totalMatches.value = 0
    matches.value = []
    emit('close')
}

function findMatches() {
    if (!searchText.value) {
        matches.value = []
        totalMatches.value = 0
        currentMatchIndex.value = -1
        return
    }

    const content = props.content
    matches.value = []

    try {
        let pattern = searchText.value

        if (useRegex.value) {
            // Use as regex
            const flags = caseSensitive.value ? 'g' : 'gi'
            const regex = new RegExp(pattern, flags)
            let match
            while ((match = regex.exec(content)) !== null) {
                matches.value.push({ start: match.index, end: match.index + match[0].length })
                // Prevent infinite loop on zero-length matches
                if (match.index === regex.lastIndex) regex.lastIndex++
            }
        } else {
            // Plain text search
            if (wholeWord.value) {
                pattern = `\\b${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`
                const flags = caseSensitive.value ? 'g' : 'gi'
                const regex = new RegExp(pattern, flags)
                let match
                while ((match = regex.exec(content)) !== null) {
                    matches.value.push({ start: match.index, end: match.index + match[0].length })
                }
            } else {
                const searchLower = caseSensitive.value ? pattern : pattern.toLowerCase()
                const contentToSearch = caseSensitive.value ? content : content.toLowerCase()
                let pos = 0
                while ((pos = contentToSearch.indexOf(searchLower, pos)) !== -1) {
                    matches.value.push({ start: pos, end: pos + searchText.value.length })
                    pos++
                }
            }
        }

        totalMatches.value = matches.value.length

        // Find closest match to current cursor position and highlight it automatically
        if (matches.value.length > 0) {
            let closestIndex = 0
            for (let i = 0; i < matches.value.length; i++) {
                if (matches.value[i].start >= props.cursorPosition) {
                    closestIndex = i
                    break
                }
                closestIndex = i
            }
            currentMatchIndex.value = closestIndex
            // Automatically highlight the first/closest match
            emit('find', matches.value[closestIndex])
        } else {
            currentMatchIndex.value = -1
        }
    } catch (err) {
        // Invalid regex
        matches.value = []
        totalMatches.value = 0
        currentMatchIndex.value = -1
    }
}

function findNext() {
    if (matches.value.length === 0) return

    currentMatchIndex.value = (currentMatchIndex.value + 1) % matches.value.length
    const match = matches.value[currentMatchIndex.value]
    emit('find', match)
}

function findPrevious() {
    if (matches.value.length === 0) return

    currentMatchIndex.value = currentMatchIndex.value <= 0
        ? matches.value.length - 1
        : currentMatchIndex.value - 1
    const match = matches.value[currentMatchIndex.value]
    emit('find', match)
}

function replace() {
    if (matches.value.length === 0) return

    const match = matches.value[currentMatchIndex.value]
    emit('replace', { match, replaceText: replaceText.value })

    // After replace, re-find matches
    setTimeout(() => {
        findMatches()
        if (matches.value.length > 0) {
            // Move to the next match (which is now at the same index due to replacement)
            const match = matches.value[currentMatchIndex.value]
            emit('find', match)
        }
    }, 50)
}

function replaceAll() {
    if (matches.value.length === 0) return

    emit('replaceAll', {
        matches: [...matches.value],
        replaceText: replaceText.value,
        searchText: searchText.value,
        caseSensitive: caseSensitive.value,
        useRegex: useRegex.value,
        wholeWord: wholeWord.value
    })

    // After replace all, clear matches
    setTimeout(() => {
        findMatches()
    }, 50)
}
</script>

<style scoped>
/* Subtle outline-style buttons for non-modal search dialog */
.btn-small {
    min-width: 64px;
    padding: 6px 12px;
    font-size: 0.8125rem;
    /* 13px */
    border-radius: 8px;
    border: 2px solid transparent;
    background: transparent;
    cursor: pointer;
    transition: background-color .12s ease, transform .06s ease, border-color .12s ease, color .12s ease;
}

.btn-small:active {
    transform: translateY(1px);
}

/* Primary: subtle outline blue */
.btn-small.primary {
    color: #2563eb;
    /* blue-600 */
    background: transparent;
    border-color: rgba(37, 99, 235, 0.28);
}

.btn-small.primary:hover {
    background: rgba(37, 99, 235, 0.06);
}

/* Secondary: muted neutral */
.btn-small.secondary {
    color: #6b7280;
    /* gray-500 */
    background: transparent;
    border-color: rgba(107, 114, 128, 0.12);
}

.btn-small.secondary:hover {
    background: rgba(107, 114, 128, 0.04);
}

/* Action (replace): subtle green outline */
.btn-small.action {
    color: #059669;
    /* green-600 */
    background: transparent;
    border-color: rgba(5, 150, 105, 0.22);
}

.btn-small.action:hover {
    background: rgba(5, 150, 105, 0.06);
}

.btn-small[disabled] {
    color: #9ca3af;
    border-color: rgba(156, 163, 175, 0.06);
    background: transparent;
    cursor: not-allowed;
    opacity: 0.8;
}
</style>
