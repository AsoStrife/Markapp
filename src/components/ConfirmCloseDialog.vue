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
        :style="{ backgroundColor: show ? 'var(--modal-overlay)' : 'transparent' }" 
        :class="show ? 'backdrop-blur-sm' : ''" @click.self="handleCancel">
        <div class="relative rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden transition-all duration-200 transform"
            :class="show ? 'scale-100 opacity-100' : 'scale-95 opacity-0'"
            style="background-color: var(--modal-bg);">
            <!-- Header -->
            <div class="px-6 pt-6 pb-4" style="border-bottom: 1px solid var(--modal-border);">
                <h3 class="text-xl font-semibold" style="color: var(--modal-text);">{{ title }}</h3>
            </div>

            <!-- Content -->
            <div class="px-6 pt-6 pb-20">
                <p class="leading-relaxed" style="color: var(--modal-text-muted);">{{ message }}</p>
            </div>

            <!-- Minimal footbar: buttons small and placed on modal perimeter -->
            <div class="absolute left-0 right-0 bottom-0">
                <div class="flex items-center justify-between px-4 py-2 bg-transparent" style="border-top: 1px solid var(--modal-border);">
                    <!-- Left: destructive action -->
                    <div>
                        <button @click="handleDontSave" class="confirm-dialog-btn-foot left">
                            {{ dontSaveLabel }}
                        </button>
                    </div>

                    <!-- Right: cancel (small) and save (primary) -->
                    <div class="flex items-center gap-3">
                        <button @click="handleCancel" class="confirm-dialog-btn-foot-cancel">
                            {{ cancelLabel }}
                        </button>
                        <button @click="handleSave" class="confirm-dialog-btn-foot right">
                            {{ saveLabel }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
