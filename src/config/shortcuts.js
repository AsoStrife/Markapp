/**
 * Default keyboard shortcut definitions for Markapp.
 * 
 * Each shortcut has:
 * - id: Unique identifier (category.action format)
 * - key: The key to press (lowercase)
 * - modifiers: Array of modifier keys ('ctrl', 'shift', 'alt', 'meta')
 * - action: The action identifier to trigger
 * - category: Category for grouping in settings UI ('file', 'format', 'navigation')
 * 
 * @module config/shortcuts
 */

/**
 * @typedef {Object} ShortcutDefinition
 * @property {string} key - The key code (lowercase)
 * @property {string[]} modifiers - Array of modifier keys
 * @property {string} action - Action identifier
 * @property {string} category - Category for grouping
 */

/**
 * Default shortcut definitions.
 * Keys are shortcut IDs, values are shortcut definitions.
 * @type {Record<string, ShortcutDefinition>}
 */
export const defaultShortcuts = {
    // File operations
    'file.new': {
        key: 'n',
        modifiers: ['ctrl'],
        action: 'new',
        category: 'file'
    },
    'file.open': {
        key: 'o',
        modifiers: ['ctrl'],
        action: 'open',
        category: 'file'
    },
    'file.save': {
        key: 's',
        modifiers: ['ctrl'],
        action: 'save',
        category: 'file'
    },
    'file.saveAs': {
        key: 's',
        modifiers: ['ctrl', 'shift'],
        action: 'saveAs',
        category: 'file'
    },

    // Text formatting
    'format.bold': {
        key: 'b',
        modifiers: ['ctrl'],
        action: 'bold',
        category: 'format'
    },
    'format.italic': {
        key: 'i',
        modifiers: ['ctrl'],
        action: 'italic',
        category: 'format'
    },
    'format.underline': {
        key: 'u',
        modifiers: ['ctrl'],
        action: 'underline',
        category: 'format'
    },
    'format.strikethrough': {
        key: 'd',
        modifiers: ['ctrl', 'shift'],
        action: 'strike',
        category: 'format'
    },
    'format.code': {
        key: 'e',
        modifiers: ['ctrl'],
        action: 'code',
        category: 'format'
    },
    'format.codeBlock': {
        key: 'e',
        modifiers: ['ctrl', 'shift'],
        action: 'codeBlock',
        category: 'format'
    },
    'format.heading1': {
        key: '1',
        modifiers: ['ctrl'],
        action: 'h1',
        category: 'format'
    },
    'format.heading2': {
        key: '2',
        modifiers: ['ctrl'],
        action: 'h2',
        category: 'format'
    },
    'format.heading3': {
        key: '3',
        modifiers: ['ctrl'],
        action: 'h3',
        category: 'format'
    },
    'format.heading4': {
        key: '4',
        modifiers: ['ctrl'],
        action: 'h4',
        category: 'format'
    },
    'format.bulletList': {
        key: '8',
        modifiers: ['ctrl', 'shift'],
        action: 'bulletList',
        category: 'format'
    },
    'format.numberedList': {
        key: '7',
        modifiers: ['ctrl', 'shift'],
        action: 'orderedList',
        category: 'format'
    },
    'format.taskList': {
        key: 't',
        modifiers: ['ctrl', 'shift'],
        action: 'taskList',
        category: 'format'
    },
    'format.blockquote': {
        key: 'q',
        modifiers: ['ctrl', 'shift'],
        action: 'blockquote',
        category: 'format'
    },
    'format.link': {
        key: 'k',
        modifiers: ['ctrl'],
        action: 'link',
        category: 'format'
    },
    'format.image': {
        key: 'g',
        modifiers: ['ctrl', 'shift'],
        action: 'image',
        category: 'format'
    },
    'format.horizontalRule': {
        key: 'r',
        modifiers: ['ctrl', 'shift'],
        action: 'hr',
        category: 'format'
    },
    'format.table': {
        key: 't',
        modifiers: ['ctrl', 'alt'],
        action: 'table',
        category: 'format'
    },

    // Navigation
    'navigation.find': {
        key: 'f',
        modifiers: ['ctrl'],
        action: 'find',
        category: 'navigation'
    },
    'navigation.replace': {
        key: 'h',
        modifiers: ['ctrl'],
        action: 'replace',
        category: 'navigation'
    },
    'navigation.toggleOutline': {
        key: 'l',
        modifiers: ['ctrl', 'shift'],
        action: 'toggleOutline',
        category: 'navigation'
    },
    'navigation.settings': {
        key: ',',
        modifiers: ['ctrl'],
        action: 'settings',
        category: 'navigation'
    }
}

/**
 * List of all shortcut IDs for iteration.
 * @type {string[]}
 */
export const shortcutIds = Object.keys(defaultShortcuts)

/**
 * Map of action identifiers to their shortcut IDs.
 * Useful for looking up which shortcut triggers a given action.
 * @type {Record<string, string>}
 */
export const actionToShortcutId = Object.fromEntries(
    Object.entries(defaultShortcuts).map(([id, def]) => [def.action, id])
)

/**
 * Get the category of shortcuts for grouping.
 * @type {string[]}
 */
export const shortcutCategories = ['file', 'format', 'navigation']
