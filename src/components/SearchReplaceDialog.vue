<template>
    <div v-if="visible" class="fixed top-4 right-4 z-50"
        :style="{ transform: `translate(${position.x}px, ${position.y}px)` }">
        <div ref="dialogRef"
            class="rounded-lg shadow-2xl w-96"
            style="background-color: var(--dialog-bg); border: 1px solid var(--dialog-border);"
            @click.stop>
            <!-- Draggable header -->
            <div class="flex items-center justify-between px-4 py-3 rounded-t-lg cursor-move select-none"
                style="background-color: var(--dialog-header-bg);"
                @mousedown="startDrag">
                <h2 class="text-sm font-semibold" style="color: var(--dialog-text);">
                    {{ mode === 'search' ? t('search.title') : t('search.replaceTitle') }}
                </h2>
                <button @click="close" class="transition-colors"
                    style="color: var(--dialog-text-muted);"
                    @mouseenter="$event.target.style.color = 'var(--dialog-text)'"
                    @mouseleave="$event.target.style.color = 'var(--dialog-text-muted)'"
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
                    <label class="block text-xs font-medium mb-1" style="color: var(--dialog-label);">
                        {{ t('search.searchFor') }}
                    </label>
                    <input ref="searchInput" v-model="searchText" type="text" class="w-full px-2 py-1.5 text-sm rounded outline-none"
                   style="border: 1px solid var(--dialog-input-border); background-color: var(--dialog-input-bg); color: var(--dialog-input-text);"
                   @focus="$event.target.style.outline = '2px solid var(--dialog-input-focus)'"
                   @blur="$event.target.style.outline = 'none'"
                        :placeholder="t('search.searchPlaceholder')" @keydown.enter="findNext" @keydown.esc="close" />
                    <!-- Find buttons directly under search field, aligned right -->
                    <div class="mt-2 flex justify-end gap-2">
                        <button @click="findPrevious" :disabled="!searchText" class="search-dialog-btn-small secondary">
                            {{ t('search.findPrevious') }}
                        </button>
                        <button @click="findNext" :disabled="!searchText" class="search-dialog-btn-small primary">
                            {{ t('search.findNext') }}
                        </button>
                    </div>
                </div>

                <!-- Replace input (only in replace mode) -->
                <div v-if="mode === 'replace'" class="mb-3">
                    <label class="block text-xs font-medium mb-1" style="color: var(--dialog-label);">
                        {{ t('search.replaceWith') }}
                    </label>
                    <input v-model="replaceText" type="text" class="w-full px-2 py-1.5 text-sm rounded outline-none"
                   style="border: 1px solid var(--dialog-input-border); background-color: var(--dialog-input-bg); color: var(--dialog-input-text);"
                   @focus="$event.target.style.outline = '2px solid var(--dialog-input-focus)'"
                   @blur="$event.target.style.outline = 'none'"
                   :placeholder="t('search.replacePlaceholder')" @keydown.enter="replace" @keydown.esc="close" />

                    <!-- Replace buttons directly under replace field, aligned right -->
                    <div class="mt-2 flex justify-end gap-2">
                        <button @click="replace" :disabled="!searchText || totalMatches === 0" class="search-dialog-btn-small action">
                            {{ t('search.replace') }}
                        </button>
                        <button @click="replaceAll" :disabled="!searchText || totalMatches === 0"
                            class="search-dialog-btn-small action">
                            {{ t('search.replaceAll') }}
                        </button>
                    </div>
                </div>

                <!-- Options -->
                <div class="mb-3 space-y-1">
                    <label class="flex items-center text-xs cursor-pointer" style="color: var(--dialog-label);">
                        <input v-model="caseSensitive" type="checkbox" class="mr-2 rounded" />
                        {{ t('search.caseSensitive') }}
                    </label>
                    <label class="flex items-center text-xs cursor-pointer" style="color: var(--dialog-label);">
                        <input v-model="wholeWord" type="checkbox" class="mr-2 rounded" />
                        {{ t('search.wholeWord') }}
                    </label>
                    <label class="flex items-center text-xs cursor-pointer" style="color: var(--dialog-label);">
                        <input v-model="useRegex" type="checkbox" class="mr-2 rounded" />
                        {{ t('search.useRegex') }}
                    </label>
                </div>

                <!-- Match counter -->
                <div v-if="searchText && totalMatches > 0" class="mb-3 text-xs" style="color: var(--dialog-text-muted);">
                    {{ currentMatchIndex + 1 }} {{ t('search.of') }} {{ totalMatches }}
                </div>

                <div v-if="searchText && totalMatches === 0" class="mb-3 text-xs" style="color: #ef4444;">
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
