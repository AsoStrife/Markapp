<script setup>
import { ref, nextTick } from 'vue'

const props = defineProps({
    html: { type: String, default: '' },
    title: { type: String, default: 'Preview' },
    readonlyLabel: { type: String, default: 'Read only' },
})
const contentRef = ref(null)

let lastEl = null
let lastTimer = null

function clearHighlight() {
    if (lastEl) {
        lastEl.classList.remove('preview-highlight')
        lastEl = null
    }
    if (lastTimer) {
        clearTimeout(lastTimer)
        lastTimer = null
    }
}

function highlightByIndex(index) {
    nextTick(() => {
        const root = contentRef.value
        if (!root || typeof index !== 'number') return
        const blocks = root.querySelectorAll('[data-start][data-end]')
        let target = null
        let fallback = null
        let bestStart = -1
        blocks.forEach(el => {
            const start = parseInt(el.getAttribute('data-start') || '0', 10)
            const end = parseInt(el.getAttribute('data-end') || '0', 10)
            if (index >= start && index < end && !target) {
                target = el
            }
            // track closest previous block as fallback
            if (start <= index && start > bestStart) {
                bestStart = start
                fallback = el
            }
        })
        if (!target && fallback) target = fallback
        if (target) {
            clearHighlight()
            target.classList.add('preview-highlight')
            lastEl = target
            // Scroll into view within the nearest scroll container
            try { target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' }) } catch (_) { }
            lastTimer = setTimeout(() => clearHighlight(), 1600)
        }
    })
}

defineExpose({ highlightByIndex })
</script>

<template>
    <div class="w-1/2 flex flex-col transition-all duration-300">
        <div class="px-4 py-2 flex items-center justify-between"
            style="background-color: var(--preview-header-bg); border-bottom: 1px solid var(--preview-header-border);">
            <span class="text-sm font-medium" style="color: var(--preview-header-text);">{{ props.title }}</span>
            <span class="text-xs" style="color: var(--preview-header-label);">{{ props.readonlyLabel }}</span>
        </div>
        <div ref="contentRef" class="flex-1 p-6 overflow-auto prose prose-lg max-w-none"
            style="background-color: var(--preview-bg);" v-html="props.html"></div>
    </div>
</template>
