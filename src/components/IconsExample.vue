<template>
    <div class="p-6 space-y-6">
        <h2 class="text-2xl font-bold mb-4">Heroicons Example</h2>

        <!-- Solid Icons (24x24) -->
        <div class="space-y-2">
            <h3 class="text-lg font-semibold">Solid Icons (24x24)</h3>
            <div class="flex gap-4 items-center">
                <DocumentTextIcon class="h-6 w-6 text-blue-500" />
                <FolderIcon class="h-6 w-6 text-yellow-500" />
                <HeartIcon class="h-6 w-6 text-red-500" />
                <StarIcon class="h-6 w-6 text-amber-500" />
                <CloudIcon class="h-6 w-6 text-sky-500" />
                <CogIcon class="h-6 w-6 text-gray-500" />
            </div>
        </div>

        <!-- Outline Icons (24x24) -->
        <div class="space-y-2">
            <h3 class="text-lg font-semibold">Outline Icons (24x24)</h3>
            <div class="flex gap-4 items-center">
                <DocumentTextIconOutline class="h-6 w-6 text-blue-500" />
                <FolderIconOutline class="h-6 w-6 text-yellow-500" />
                <HeartIconOutline class="h-6 w-6 text-red-500" />
                <StarIconOutline class="h-6 w-6 text-amber-500" />
                <CloudIconOutline class="h-6 w-6 text-sky-500" />
                <CogIconOutline class="h-6 w-6 text-gray-500" />
            </div>
        </div>

        <!-- Mini Icons (20x20) -->
        <div class="space-y-2">
            <h3 class="text-lg font-semibold">Mini Icons (20x20)</h3>
            <div class="flex gap-4 items-center">
                <DocumentTextIconMini class="h-5 w-5 text-blue-500" />
                <FolderIconMini class="h-5 w-5 text-yellow-500" />
                <HeartIconMini class="h-5 w-5 text-red-500" />
                <StarIconMini class="h-5 w-5 text-amber-500" />
                <CloudIconMini class="h-5 w-5 text-sky-500" />
                <CogIconMini class="h-5 w-5 text-gray-500" />
            </div>
        </div>

        <!-- Interactive Example -->
        <div class="space-y-2">
            <h3 class="text-lg font-semibold">Interactive Button Example</h3>
            <button @click="toggleLike"
                class="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
                <HeartIcon v-if="isLiked" class="h-5 w-5" />
                <HeartIconOutline v-else class="h-5 w-5" />
                <span>{{ isLiked ? 'Liked' : 'Like' }}</span>
            </button>
        </div>

        <!-- Common UI Icons -->
        <div class="space-y-2">
            <h3 class="text-lg font-semibold">Common UI Icons</h3>
            <div class="flex gap-4 items-center flex-wrap">
                <MagnifyingGlassIcon class="h-6 w-6" title="Search" />
                <PencilIcon class="h-6 w-6" title="Edit" />
                <TrashIcon class="h-6 w-6" title="Delete" />
                <PlusIcon class="h-6 w-6" title="Add" />
                <XMarkIcon class="h-6 w-6" title="Close" />
                <CheckIcon class="h-6 w-6" title="Check" />
                <ArrowDownTrayIcon class="h-6 w-6" title="Download" />
                <ArrowUpTrayIcon class="h-6 w-6" title="Upload" />
                <Bars3Icon class="h-6 w-6" title="Menu" />
                <BellIcon class="h-6 w-6" title="Notifications" />
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
// Solid icons (24x24 - default)
import {
    DocumentTextIcon,
    FolderIcon,
    HeartIcon,
    StarIcon,
    CloudIcon,
    CogIcon,
    MagnifyingGlassIcon,
    PencilIcon,
    TrashIcon,
    PlusIcon,
    XMarkIcon,
    CheckIcon,
    ArrowDownTrayIcon,
    ArrowUpTrayIcon,
    Bars3Icon,
    BellIcon
} from '@heroicons/vue/24/solid'

// Outline icons (24x24)
import {
    DocumentTextIcon as DocumentTextIconOutline,
    FolderIcon as FolderIconOutline,
    HeartIcon as HeartIconOutline,
    StarIcon as StarIconOutline,
    CloudIcon as CloudIconOutline,
    CogIcon as CogIconOutline
} from '@heroicons/vue/24/outline'

// Mini icons (20x20)
import {
    DocumentTextIcon as DocumentTextIconMini,
    FolderIcon as FolderIconMini,
    HeartIcon as HeartIconMini,
    StarIcon as StarIconMini,
    CloudIcon as CloudIconMini,
    CogIcon as CogIconMini
} from '@heroicons/vue/20/solid'

const isLiked = ref(false)

const toggleLike = () => {
    isLiked.value = !isLiked.value
}
</script>
