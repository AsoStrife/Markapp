<script setup>
import { reactive, computed } from 'vue'

const props = defineProps({
    items: { type: Array, default: () => [] }, // [{ title, level, index }]
    title: { type: String, default: 'Outline' },
})
const emit = defineEmits(['select'])

const collapsed = reactive({}) // key: item.index -> boolean

function selectItem(idx) { emit('select', idx) }
function toggleCollapse(idx) { collapsed[idx] = !collapsed[idx] }

function hasChildrenAt(pos) {
    const base = props.items[pos]
    if (!base) return false
    const level = base.level || 1
    for (let i = pos + 1; i < props.items.length; i++) {
        const it = props.items[i]
        if ((it.level || 1) <= level) return false
        if ((it.level || 1) > level) return true
    }
    return false
}

const visibleItems = computed(() => {
    const res = []
    const activeCollapsedLevels = [] // levels currently collapsed until a sibling or parent appears
    for (let i = 0; i < props.items.length; i++) {
        const it = props.items[i]
        const level = it.level || 1
        // prune collapsed levels that no longer apply
        for (let j = activeCollapsedLevels.length - 1; j >= 0; j--) {
            if (activeCollapsedLevels[j] >= level) activeCollapsedLevels.splice(j, 1)
        }
        const hidden = activeCollapsedLevels.some(l => level > l)
        if (!hidden) res.push({ it, pos: i })
        if (collapsed[it.index]) activeCollapsedLevels.push(level)
    }
    return res
})
</script>

<template>
    <div class="w-64 bg-gray-850 border-r border-gray-700 h-full flex flex-col">
        <div class="px-3 py-2 bg-gray-800 border-b border-gray-700 text-sm font-semibold text-gray-200">
            {{ props.title }}
        </div>
        <div class="flex-1 overflow-auto py-2">
            <ul class="space-y-0.5">
                <li v-for="({ it, pos }, i) in visibleItems" :key="it.index">
                    <div class="flex items-center">
                        <button v-if="hasChildrenAt(pos)"
                            class="mx-1 w-5 h-5 flex items-center justify-center text-gray-300 hover:text-white"
                            @click.stop="toggleCollapse(it.index)" :title="collapsed[it.index] ? 'Expand' : 'Collapse'">
                            <svg class="w-4 h-4 transition-transform"
                                :style="{ transform: collapsed[it.index] ? 'rotate(0deg)' : 'rotate(90deg)' }"
                                viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                        <button
                            class="flex-1 text-left px-3 py-1.5 hover:bg-gray-700 rounded transition-colors text-gray-200"
                            :style="{ paddingLeft: `${(it.level - 1) * 12 + 12}px` }" @click="selectItem(it.index)"
                            :title="it.title">
                            <span class="text-xs text-gray-400">H{{ it.level }}</span>
                            <span class="ml-2 truncate">{{ it.title }}</span>
                        </button>
                    </div>
                </li>
            </ul>
        </div>
    </div>
</template>

<style scoped>
.bg-gray-850 {
    background-color: #1f2837;
}
</style>
