// Preload script per Electron
// Espone API sicure al renderer process

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    // Operazioni sui file
    saveFile: (filePath, content) => ipcRenderer.invoke('save-file', { filePath, content }),
    saveFileDialog: (content) => ipcRenderer.invoke('save-file-dialog', { content }),
    openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
    openFileByPath: (filePath) => ipcRenderer.invoke('open-file-by-path', { filePath }),
    getCurrentFilePath: () => ipcRenderer.invoke('get-current-file-path'),

    // Listener per eventi dal menu
    onFileNew: (callback) => {
        ipcRenderer.on('file-new', callback)
        return () => ipcRenderer.removeListener('file-new', callback)
    },
    onFileOpen: (callback) => {
        ipcRenderer.on('file-open', callback)
        return () => ipcRenderer.removeListener('file-open', callback)
    },
    onFileOpened: (callback) => {
        ipcRenderer.on('file-opened', (event, data) => callback(data))
        return () => ipcRenderer.removeListener('file-opened', callback)
    },
    onFileSave: (callback) => {
        ipcRenderer.on('file-save', callback)
        return () => ipcRenderer.removeListener('file-save', callback)
    },
    onFileSaveAs: (callback) => {
        ipcRenderer.on('file-save-as', callback)
        return () => ipcRenderer.removeListener('file-save-as', callback)
    },

    // Handle file opened via file association (double-click, context menu)
    onOpenFile: (callback) => {
        ipcRenderer.on('open-file', (event, data) => callback(data))
        return () => ipcRenderer.removeListener('open-file', callback)
    },

    // Menu / locale control
    setAppLocale: (locale) => ipcRenderer.send('set-app-locale', locale),
    getAppLocale: () => ipcRenderer.invoke('get-app-locale'),

    // Close window handling
    setModifiedState: (isModified) => ipcRenderer.send('set-modified-state', isModified),
    onBeforeClose: (callback) => {
        ipcRenderer.on('before-close', callback)
        return () => ipcRenderer.removeListener('before-close', callback)
    },
    confirmClose: (shouldSave) => ipcRenderer.send('confirm-close', shouldSave),

    // Search and replace
    onShowSearch: (callback) => {
        ipcRenderer.on('show-search', callback)
        return () => ipcRenderer.removeListener('show-search', callback)
    },
    onShowReplace: (callback) => {
        ipcRenderer.on('show-replace', callback)
        return () => ipcRenderer.removeListener('show-replace', callback)
    }
})
