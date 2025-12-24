import { ref, watch } from 'vue'

const THEME_STORAGE_KEY = 'markapp-theme'
const currentTheme = ref('dark')

// Inizializza il tema salvato o usa il tema di sistema
function initTheme() {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)

    if (savedTheme) {
        currentTheme.value = savedTheme
    } else {
        // Controlla le preferenze di sistema
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        currentTheme.value = prefersDark ? 'dark' : 'light'
    }

    applyTheme(currentTheme.value)

    // Sincronizza con Electron all'avvio
    if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.setAppTheme) {
        try {
            window.electronAPI.setAppTheme(currentTheme.value)
        } catch (err) {
            // ignore if not in Electron context
        }
    }
}

// Applica il tema al documento
function applyTheme(theme) {
    if (theme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light')
    } else {
        document.documentElement.removeAttribute('data-theme')
    }

    // Comunica il tema a Electron per aggiornare il menu nativo
    if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.setAppTheme) {
        try {
            window.electronAPI.setAppTheme(theme)
        } catch (err) {
            // ignore if not in Electron context
        }
    }
}

// Watch per cambiamenti del tema
watch(currentTheme, (newTheme) => {
    localStorage.setItem(THEME_STORAGE_KEY, newTheme)
    applyTheme(newTheme)
})

export function useTheme() {
    const setTheme = (theme) => {
        if (theme === 'light' || theme === 'dark') {
            currentTheme.value = theme
        }
    }

    const toggleTheme = () => {
        currentTheme.value = currentTheme.value === 'dark' ? 'light' : 'dark'
    }

    const getTheme = () => currentTheme.value

    return {
        currentTheme,
        setTheme,
        toggleTheme,
        getTheme,
        initTheme
    }
}
