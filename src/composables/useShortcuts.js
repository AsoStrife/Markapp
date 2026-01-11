/**
 * Composable for centralized keyboard shortcut management.
 * 
 * Provides a singleton registry for shortcuts with:
 * - Persistent storage via localStorage
 * - Action callback registration
 * - Keyboard event handling
 * - Shortcut customization
 * - Conflict detection
 * - Label generation for UI display
 * 
 * @module composables/useShortcuts
 */

import { ref, computed } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { defaultShortcuts, shortcutIds, shortcutCategories, actionToShortcutId } from '../config/shortcuts'

/**
 * Module-level singleton state.
 * Shared across all component instances.
 */
let initialized = false

/** @type {import('vue').Ref<Record<string, import('../config/shortcuts').ShortcutDefinition>>} */
const customShortcuts = ref({})

/** @type {Record<string, Function>} */
const actionHandlers = {}

/** @type {import('vue').Ref<Record<string, { key: string, modifiers: string[] }>>} */
const storedOverrides = ref(null)

/**
 * Normalize modifier array for consistent comparison.
 * @param {string[]} modifiers 
 * @returns {string[]}
 */
function normalizeModifiers(modifiers) {
    const normalized = modifiers.map(m => m.toLowerCase())
    // Sort for consistent comparison
    return normalized.sort()
}

/**
 * Convert shortcut definition to display label (e.g., "Ctrl+B").
 * @param {{ key: string, modifiers: string[] }} shortcut 
 * @returns {string}
 */
function formatShortcutLabel(shortcut) {
    if (!shortcut || !shortcut.key) return ''

    const modLabels = []
    const mods = normalizeModifiers(shortcut.modifiers || [])

    if (mods.includes('ctrl')) modLabels.push('Ctrl')
    if (mods.includes('alt')) modLabels.push('Alt')
    if (mods.includes('shift')) modLabels.push('Shift')
    if (mods.includes('meta')) modLabels.push('Meta')

    // Capitalize key for display
    let keyLabel = shortcut.key.toUpperCase()
    // Handle special keys
    if (shortcut.key === ',') keyLabel = ','
    if (shortcut.key === '.') keyLabel = '.'
    if (shortcut.key === '/') keyLabel = '/'
    if (shortcut.key === ' ') keyLabel = 'Space'
    if (shortcut.key === 'escape') keyLabel = 'Esc'
    if (shortcut.key === 'enter') keyLabel = 'Enter'
    if (shortcut.key === 'backspace') keyLabel = 'Backspace'
    if (shortcut.key === 'delete') keyLabel = 'Del'
    if (shortcut.key === 'arrowup') keyLabel = '↑'
    if (shortcut.key === 'arrowdown') keyLabel = '↓'
    if (shortcut.key === 'arrowleft') keyLabel = '←'
    if (shortcut.key === 'arrowright') keyLabel = '→'

    modLabels.push(keyLabel)
    return modLabels.join('+')
}

/**
 * Convert shortcut to Electron accelerator format (e.g., "CmdOrCtrl+B").
 * @param {{ key: string, modifiers: string[] }} shortcut 
 * @returns {string}
 */
function formatElectronAccelerator(shortcut) {
    if (!shortcut || !shortcut.key) return ''

    const modLabels = []
    const mods = normalizeModifiers(shortcut.modifiers || [])

    if (mods.includes('ctrl')) modLabels.push('CmdOrCtrl')
    if (mods.includes('alt')) modLabels.push('Alt')
    if (mods.includes('shift')) modLabels.push('Shift')
    if (mods.includes('meta')) modLabels.push('Meta')

    // Capitalize key for accelerator
    let keyLabel = shortcut.key.toUpperCase()
    // Handle special keys for Electron
    if (shortcut.key === ',') keyLabel = ','
    if (shortcut.key === '+') keyLabel = 'Plus'
    if (shortcut.key === '-') keyLabel = '-'
    if (shortcut.key === ' ') keyLabel = 'Space'

    modLabels.push(keyLabel)
    return modLabels.join('+')
}

/**
 * Check if a keyboard event matches a shortcut definition.
 * @param {KeyboardEvent} event 
 * @param {{ key: string, modifiers: string[] }} shortcut 
 * @returns {boolean}
 */
function eventMatchesShortcut(event, shortcut) {
    if (!shortcut || !shortcut.key) return false

    // Check key (case-insensitive)
    const eventKey = event.key.toLowerCase()
    if (eventKey !== shortcut.key.toLowerCase()) return false

    const mods = normalizeModifiers(shortcut.modifiers || [])
    const hasCtrl = mods.includes('ctrl')
    const hasAlt = mods.includes('alt')
    const hasShift = mods.includes('shift')
    const hasMeta = mods.includes('meta')

    // Check modifiers match exactly
    const eventCtrl = event.ctrlKey || event.metaKey // Treat meta as ctrl for cross-platform
    const eventAlt = event.altKey
    const eventShift = event.shiftKey

    if (hasCtrl !== eventCtrl) return false
    if (hasAlt !== eventAlt) return false
    if (hasShift !== eventShift) return false
    // Meta is handled via ctrl for simplicity

    return true
}

/**
 * Initialize the shortcut system.
 * Loads persisted overrides from localStorage.
 */
function initialize() {
    if (initialized) return

    // Load stored overrides
    const stored = localStorage.getItem('markapp.shortcuts')
    if (stored) {
        try {
            storedOverrides.value = JSON.parse(stored)
        } catch (e) {
            console.warn('[useShortcuts] Failed to parse stored shortcuts:', e)
            storedOverrides.value = {}
        }
    } else {
        storedOverrides.value = {}
    }

    // Build the active shortcuts (defaults + overrides)
    rebuildShortcuts()
    initialized = true
}

/**
 * Rebuild the active shortcuts from defaults and overrides.
 */
function rebuildShortcuts() {
    const result = {}
    for (const id of shortcutIds) {
        const defaultDef = defaultShortcuts[id]
        const override = storedOverrides.value?.[id]
        if (override) {
            // Merge override with default (keep action and category from default)
            result[id] = {
                ...defaultDef,
                key: override.key,
                modifiers: override.modifiers
            }
        } else {
            result[id] = { ...defaultDef }
        }
    }
    customShortcuts.value = result
}

/**
 * Persist current overrides to localStorage.
 */
function persistOverrides() {
    try {
        localStorage.setItem('markapp.shortcuts', JSON.stringify(storedOverrides.value))
    } catch (e) {
        console.error('[useShortcuts] Failed to persist shortcuts:', e)
    }
}

/**
 * Main composable function.
 * Returns the shortcut management API.
 */
export function useShortcuts() {
    initialize()

    /**
     * Get the current shortcut definition for a given ID.
     * @param {string} id - Shortcut ID (e.g., 'format.bold')
     * @returns {import('../config/shortcuts').ShortcutDefinition | undefined}
     */
    function getShortcut(id) {
        return customShortcuts.value[id]
    }

    /**
     * Get the display label for a shortcut (e.g., "Ctrl+B").
     * @param {string} id - Shortcut ID
     * @returns {string}
     */
    function getShortcutLabel(id) {
        const shortcut = getShortcut(id)
        return formatShortcutLabel(shortcut)
    }

    /**
     * Get the display label for an action (looks up by action name).
     * @param {string} action - Action identifier (e.g., 'bold')
     * @returns {string}
     */
    function getShortcutLabelByAction(action) {
        const id = actionToShortcutId[action]
        if (!id) return ''
        return getShortcutLabel(id)
    }

    /**
     * Get the Electron accelerator format for a shortcut.
     * @param {string} id - Shortcut ID
     * @returns {string}
     */
    function getElectronAccelerator(id) {
        const shortcut = getShortcut(id)
        return formatElectronAccelerator(shortcut)
    }

    /**
     * Register an action handler.
     * @param {string} action - Action identifier
     * @param {Function} handler - Callback function
     */
    function registerAction(action, handler) {
        actionHandlers[action] = handler
    }

    /**
     * Unregister an action handler.
     * @param {string} action - Action identifier
     */
    function unregisterAction(action) {
        delete actionHandlers[action]
    }

    /**
     * Handle a keyboard event.
     * Matches against all shortcuts and triggers the appropriate action.
     * @param {KeyboardEvent} event 
     * @returns {boolean} True if a shortcut was matched and handled
     */
    function handleKeyEvent(event) {
        for (const id of shortcutIds) {
            const shortcut = customShortcuts.value[id]
            if (eventMatchesShortcut(event, shortcut)) {
                const handler = actionHandlers[shortcut.action]
                if (handler) {
                    event.preventDefault()
                    event.stopPropagation()
                    handler()
                    return true
                }
            }
        }
        return false
    }

    /**
     * Update a shortcut's key binding.
     * @param {string} id - Shortcut ID
     * @param {string} key - New key
     * @param {string[]} modifiers - New modifiers
     * @returns {{ success: boolean, error?: string }}
     */
    function updateShortcut(id, key, modifiers) {
        if (!defaultShortcuts[id]) {
            return { success: false, error: 'Invalid shortcut ID' }
        }

        // Check for conflicts
        const conflict = findConflict(id, key, modifiers)
        if (conflict) {
            return { success: false, error: `Conflict with "${conflict}"` }
        }

        // Store the override
        storedOverrides.value = {
            ...storedOverrides.value,
            [id]: { key, modifiers }
        }

        rebuildShortcuts()
        persistOverrides()

        // Notify Electron to update menu accelerators
        syncToElectron()

        return { success: true }
    }

    /**
     * Reset a shortcut to its default binding.
     * @param {string} id - Shortcut ID
     */
    function resetShortcut(id) {
        if (storedOverrides.value?.[id]) {
            const newOverrides = { ...storedOverrides.value }
            delete newOverrides[id]
            storedOverrides.value = newOverrides
            rebuildShortcuts()
            persistOverrides()
            syncToElectron()
        }
    }

    /**
     * Reset all shortcuts to defaults.
     */
    function resetAllShortcuts() {
        storedOverrides.value = {}
        rebuildShortcuts()
        persistOverrides()
        syncToElectron()
    }

    /**
     * Check if a shortcut has been customized from default.
     * @param {string} id - Shortcut ID
     * @returns {boolean}
     */
    function isCustomized(id) {
        return !!storedOverrides.value?.[id]
    }

    /**
     * Find a conflicting shortcut for a given key combination.
     * @param {string} excludeId - ID to exclude from check
     * @param {string} key - Key to check
     * @param {string[]} modifiers - Modifiers to check
     * @returns {string | null} - Conflicting shortcut ID or null
     */
    function findConflict(excludeId, key, modifiers) {
        const normalizedMods = normalizeModifiers(modifiers)
        for (const id of shortcutIds) {
            if (id === excludeId) continue
            const shortcut = customShortcuts.value[id]
            if (shortcut.key.toLowerCase() === key.toLowerCase()) {
                const shortcutMods = normalizeModifiers(shortcut.modifiers)
                if (JSON.stringify(shortcutMods) === JSON.stringify(normalizedMods)) {
                    return id
                }
            }
        }
        return null
    }

    /**
     * Check if a given key combination conflicts with existing shortcuts.
     * @param {string} excludeId - ID to exclude from check
     * @param {string} key - Key to check
     * @param {string[]} modifiers - Modifiers to check
     * @returns {boolean}
     */
    function hasConflict(excludeId, key, modifiers) {
        return findConflict(excludeId, key, modifiers) !== null
    }

    /**
     * Get all shortcuts grouped by category.
     * @returns {Record<string, Array<{ id: string, shortcut: import('../config/shortcuts').ShortcutDefinition }>>}
     */
    function getShortcutsByCategory() {
        const result = {}
        for (const category of shortcutCategories) {
            result[category] = []
        }
        for (const id of shortcutIds) {
            const shortcut = customShortcuts.value[id]
            if (result[shortcut.category]) {
                result[shortcut.category].push({ id, shortcut })
            }
        }
        return result
    }

    /**
     * Get all shortcuts as an object for Electron menu sync.
     * @returns {Record<string, string>} Map of action to accelerator
     */
    function getAllAccelerators() {
        const result = {}
        for (const id of shortcutIds) {
            const shortcut = customShortcuts.value[id]
            result[shortcut.action] = formatElectronAccelerator(shortcut)
        }
        return result
    }

    /**
     * Sync shortcuts to Electron main process.
     */
    function syncToElectron() {
        if (typeof window !== 'undefined' && window.electronAPI?.setShortcuts) {
            try {
                window.electronAPI.setShortcuts(getAllAccelerators())
            } catch (e) {
                console.warn('[useShortcuts] Failed to sync to Electron:', e)
            }
        }
    }

    /**
     * Computed reactive shortcuts object.
     */
    const shortcuts = computed(() => customShortcuts.value)

    /**
     * Computed shortcut labels for toolbar tooltips.
     * Map of action -> label
     */
    const shortcutLabels = computed(() => {
        const labels = {}
        for (const id of shortcutIds) {
            const shortcut = customShortcuts.value[id]
            labels[shortcut.action] = formatShortcutLabel(shortcut)
        }
        return labels
    })

    return {
        // Reactive state
        shortcuts,
        shortcutLabels,

        // Getters
        getShortcut,
        getShortcutLabel,
        getShortcutLabelByAction,
        getElectronAccelerator,
        getShortcutsByCategory,
        getAllAccelerators,
        isCustomized,

        // Action registration
        registerAction,
        unregisterAction,
        handleKeyEvent,

        // Shortcut management
        updateShortcut,
        resetShortcut,
        resetAllShortcuts,
        hasConflict,
        findConflict,

        // Electron sync
        syncToElectron,

        // Constants
        categories: shortcutCategories
    }
}
