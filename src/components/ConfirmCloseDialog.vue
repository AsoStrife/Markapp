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
            <div class="px-6 pt-6 pb-20">
                <p class="text-gray-300 leading-relaxed">{{ message }}</p>
            </div>

            <!-- Minimal footbar: buttons small and placed on modal perimeter -->
            <div class="absolute left-0 right-0 bottom-0">
                <div class="flex items-center justify-between px-4 py-2 border-t border-gray-700 bg-transparent">
                    <!-- Left: destructive action -->
                    <div>
                        <button @click="handleDontSave" class="btn-foot left">
                            {{ dontSaveLabel }}
                        </button>
                    </div>

                    <!-- Right: cancel (small) and save (primary) -->
                    <div class="flex items-center gap-3">
                        <button @click="handleCancel" class="btn-foot-cancel">
                            {{ cancelLabel }}
                        </button>
                        <button @click="handleSave" class="btn-foot right">
                            {{ saveLabel }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Minimal footbar button styles */
.btn-foot {
    min-width: 76px;
    padding: 6px 10px;
    font-size: 0.8125rem;
    /* 13px */
    border-radius: 6px;
    border: 1px solid transparent;
    background: transparent;
    cursor: pointer;
    transition: background-color .12s ease, transform .06s ease, border-color .12s ease;
}

.btn-foot:active {
    transform: scale(0.985);
}

.btn-foot.left {
    color: #ef4444;
    /* red-500 */
}

.btn-foot.left:hover {
    background: rgba(239, 68, 68, 0.08);
}

.btn-foot.center {
    color: #d1d5db;
    /* gray-300 */
}

.btn-foot.center:hover {
    background: rgba(209, 213, 219, 0.04);
}

.btn-foot.right {
    color: white;
    background: #2563eb;
    /* blue-600 */
    border-color: rgba(37, 99, 235, 0.15);
}

.btn-foot.right:hover {
    background: #1e4fd1;
}

/* Small cancel button on the right */
.btn-foot-cancel {
    padding: 5px 8px;
    font-size: 0.75rem;
    /* 12px */
    border-radius: 6px;
    background: transparent;
    color: #9ca3af;
    /* gray-400 */
    border: 1px solid rgba(156, 163, 175, 0.08);
    cursor: pointer;
}

.btn-foot-cancel:hover {
    background: rgba(156, 163, 175, 0.04);
}

/* Ensure modal content isn't hidden behind footer */
</style>
