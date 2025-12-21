// Preload script per Electron
// Espone API sicure al renderer process

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    // Operazioni sui file
    saveFile: (filePath, content) => ipcRenderer.invoke('save-file', { filePath, content }),
    saveFileDialog: (content) => ipcRenderer.invoke('save-file-dialog', { content }),
    openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
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
    }
    ,
    // Menu / locale control
    setAppLocale: (locale) => ipcRenderer.send('set-app-locale', locale),
    getAppLocale: () => ipcRenderer.invoke('get-app-locale')
})
