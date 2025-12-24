<script setup>
const emit = defineEmits(['mousedown'])

function handleMouseDown(event) {
    emit('mousedown', event)
}
</script>

<template>
    <div 
        class="resize-handle"
        @mousedown="handleMouseDown"
        :style="{ 
            width: '4px', 
            cursor: 'col-resize',
            backgroundColor: 'transparent',
            position: 'relative',
            zIndex: 10,
            flexShrink: 0
        }"
    >
        <div class="resize-handle-line"></div>
    </div>
</template>

<style scoped>
.resize-handle {
    transition: background-color 0.15s ease;
}

.resize-handle:hover {
    background-color: var(--resize-handle-hover, rgba(59, 130, 246, 0.5));
}

.resize-handle:active {
    background-color: var(--resize-handle-active, rgba(59, 130, 246, 0.8));
}

.resize-handle-line {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    width: 1px;
    background-color: var(--outline-header-border, rgba(0, 0, 0, 0.1));
    transform: translateX(-50%);
    pointer-events: none;
}

.resize-handle:hover .resize-handle-line {
    background-color: var(--resize-handle-hover, rgba(59, 130, 246, 0.7));
    width: 2px;
}
</style>
