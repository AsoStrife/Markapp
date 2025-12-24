import { ref, onMounted, onUnmounted } from 'vue'
import { useLocalStorage } from '@vueuse/core'

/**
 * Composable per gestire il ridimensionamento delle colonne con persistenza
 * @param {string} storageKey - Chiave per il localStorage
 * @param {number} defaultWidth - Larghezza predefinita in pixel
 * @param {number} minWidth - Larghezza minima in pixel
 * @param {function} getMaxWidth - Funzione per calcolare dinamicamente la larghezza massima
 */
export function useResizable(storageKey, defaultWidth = 256, minWidth = 150, getMaxWidth = null) {
    const width = useLocalStorage(storageKey, defaultWidth)
    const isResizing = ref(false)
    const startX = ref(0)
    const startWidth = ref(0)
    let animationFrameId = null
    let cachedMaxWidth = 2000

    function startResize(event) {
        isResizing.value = true
        startX.value = event.clientX
        startWidth.value = width.value
        // Calcola maxWidth una sola volta all'inizio del resize
        cachedMaxWidth = typeof getMaxWidth === 'function' ? getMaxWidth() : 2000
        document.body.style.cursor = 'col-resize'
        document.body.style.userSelect = 'none'
    }

    function resize(event) {
        if (!isResizing.value) return
        
        // Usa requestAnimationFrame per evitare lag
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId)
        }
        
        animationFrameId = requestAnimationFrame(() => {
            const delta = event.clientX - startX.value
            const newWidth = Math.max(minWidth, Math.min(cachedMaxWidth, startWidth.value + delta))
            width.value = newWidth
        })
    }

    function stopResize() {
        if (isResizing.value) {
            isResizing.value = false
            document.body.style.cursor = ''
            document.body.style.userSelect = ''
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId)
                animationFrameId = null
            }
        }
    }

    onMounted(() => {
        document.addEventListener('mousemove', resize)
        document.addEventListener('mouseup', stopResize)
    })

    onUnmounted(() => {
        document.removeEventListener('mousemove', resize)
        document.removeEventListener('mouseup', stopResize)
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId)
        }
    })

    return {
        width,
        isResizing,
        startResize
    }
}
