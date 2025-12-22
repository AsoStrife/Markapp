<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
    title: { type: String, required: true },
    message: { type: String, required: true },
    saveLabel: { type: String, required: true },
    dontSaveLabel: { type: String, required: true },
    cancelLabel: { type: String, required: true }
})

const emit = defineEmits(['save', 'dontSave', 'cancel'])

const show = ref(false)

onMounted(() => {
    setTimeout(() => {
        show.value = true
    }, 10)
})

function handleSave() {
    emit('save')
}

function handleDontSave() {
    emit('dontSave')
}

function handleCancel() {
    emit('cancel')
}
</script>

<template>
    <div class="fixed inset-0 z-[10000] flex items-center justify-center transition-all duration-200"
        :class="show ? 'bg-black/60 backdrop-blur-sm' : 'bg-black/0'" @click.self="handleCancel">
        <div class="relative bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden transition-all duration-200 transform"
            :class="show ? 'scale-100 opacity-100' : 'scale-95 opacity-0'">
            <!-- Header -->
            <div class="px-6 pt-6 pb-4 border-b border-gray-700">
                <h3 class="text-xl font-semibold text-gray-100">{{ title }}</h3>
            </div>

            <!-- Content -->
            <div class="px-6 py-6">
                <p class="text-gray-300 leading-relaxed">{{ message }}</p>
            </div>

            <!-- Footer with buttons -->
            <div class="px-6 pb-6 flex items-center justify-end gap-3">
                <button @click="handleCancel"
                    class="px-5 py-2.5 rounded-lg font-medium text-gray-300 bg-gray-700/50 hover:bg-gray-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 focus:ring-offset-gray-800">
                    {{ cancelLabel }}
                </button>
                <button @click="handleDontSave"
                    class="px-5 py-2.5 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800">
                    {{ dontSaveLabel }}
                </button>
                <button @click="handleSave"
                    class="px-5 py-2.5 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800">
                    {{ saveLabel }}
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Animazioni fluide */
button {
    transform: translateZ(0);
}

button:active {
    transform: scale(0.98);
}
</style>
