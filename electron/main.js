import { app, BrowserWindow, Menu, ipcMain, dialog, nativeTheme } from 'electron'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let mainWindow
let currentFilePath = null
let messages = { it: null, en: null }
let appLocale = 'en'
let pendingFileToOpen = null
let isModified = false
let closeRequested = false

// Extract .md file path from process.argv, filtering out Electron/Squirrel flags
function getFilePathFromArgs() {
    const args = process.argv.slice(1) // Skip electron executable
    for (const arg of args) {
        // Ignore flags and non-file arguments
        if (arg.startsWith('--') || arg.startsWith('-')) continue
        if (arg === '.' || arg === 'electron/main.js') continue

        // Check if it's a .md file
        if (arg.toLowerCase().endsWith('.md') && fs.existsSync(arg)) {
            return path.resolve(arg)
        }
    }
    return null
}

// Centralized function to open a file and send to renderer
function openFileInRenderer(filePath) {
    if (!filePath || !fs.existsSync(filePath)) return

    try {
        const content = fs.readFileSync(filePath, 'utf-8')
        currentFilePath = filePath

        if (mainWindow && mainWindow.webContents) {
            updateWindowTitle(filePath)
            mainWindow.webContents.send('open-file', { filePath, content })
        }
    } catch (err) {
        console.error('Error opening file:', err)
    }
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false,
            preload: path.join(__dirname, 'preload.cjs')
        },
        icon: path.join(__dirname, '../build/icons/icon.png')
    })

    // Crea il menu dell'applicazione usando le traduzioni caricate
    function buildMenuFromMessages(msgs) {
        return [
            {
                label: msgs.file.menu,
                submenu: [
                    {
                        label: msgs.file.new,
                        accelerator: 'CmdOrCtrl+N',
                        click: () => {
                            currentFilePath = null
                            mainWindow.webContents.send('file-new')
                        }
                    },
                    {
                        label: msgs.file.open,
                        accelerator: 'CmdOrCtrl+O',
                        click: () => {
                            mainWindow.webContents.send('file-open')
                        }
                    },
                    { type: 'separator' },
                    {
                        label: msgs.file.save,
                        accelerator: 'CmdOrCtrl+S',
                        click: () => {
                            mainWindow.webContents.send('file-save')
                        }
                    },
                    {
                        label: msgs.file.saveAs,
                        accelerator: 'CmdOrCtrl+Shift+S',
                        click: () => {
                            mainWindow.webContents.send('file-save-as')
                        }
                    },
                    { type: 'separator' },
                    {
                        label: msgs.file.quit,
                        accelerator: 'Alt+F4',
                        click: () => {
                            app.quit()
                        }
                    }
                ]
            },
            {
                label: msgs.edit.menu,
                submenu: [
                    { label: msgs.edit.undo, accelerator: 'CmdOrCtrl+Z', role: 'undo' },
                    { label: msgs.edit.redo, accelerator: 'CmdOrCtrl+Y', role: 'redo' },
                    { type: 'separator' },
                    { label: msgs.edit.cut, accelerator: 'CmdOrCtrl+X', role: 'cut' },
                    { label: msgs.edit.copy, accelerator: 'CmdOrCtrl+C', role: 'copy' },
                    { label: msgs.edit.paste, accelerator: 'CmdOrCtrl+V', role: 'paste' },
                    { type: 'separator' },
                    { label: msgs.edit.selectAll, accelerator: 'CmdOrCtrl+A', role: 'selectAll' },
                    { type: 'separator' },
                    {
                        label: msgs.edit.find,
                        accelerator: 'CmdOrCtrl+F',
                        click: () => {
                            mainWindow.webContents.send('show-search')
                        }
                    },
                    {
                        label: msgs.edit.replace,
                        accelerator: 'CmdOrCtrl+H',
                        click: () => {
                            mainWindow.webContents.send('show-replace')
                        }
                    }
                ]
            },
            {
                label: msgs.view.menu,
                submenu: [
                    {
                        label: msgs.view.reload,
                        accelerator: 'CmdOrCtrl+R',
                        click: () => {
                            mainWindow.webContents.reload()
                        }
                    },
                    {
                        label: msgs.view.devtools,
                        accelerator: 'F12',
                        click: () => {
                            mainWindow.webContents.toggleDevTools()
                        }
                    },
                    { type: 'separator' },
                    { label: msgs.view.zoomIn, accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
                    { label: msgs.view.zoomOut, accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
                    { label: msgs.view.resetZoom, accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
                    { type: 'separator' },
                    { label: msgs.view.fullscreen, accelerator: 'F11', role: 'togglefullscreen' }
                ]
            },
            {
                label: msgs.info.menu,
                submenu: [
                    {
                        label: msgs.info.about,
                        click: () => {
                            dialog.showMessageBox(mainWindow, {
                                type: 'info',
                                title: msgs.info.aboutTitle || msgs.info.about,
                                message: msgs.app.title || 'Markapp',
                                detail: msgs.info.aboutDetail || `Versione: 1.0.0\n\nUn editor Markdown moderno costruito con:\n• Vue 3\n• Electron\n• Tailwind CSS\n\n© 2025 Markapp`,
                                buttons: [msgs.info.ok || 'OK']
                            })
                        }
                    }
                ]
            }
        ]
    }

    const msgs = messages[appLocale] || messages.en || {
        file: {}, edit: {}, view: {}, info: {}, app: { title: 'Markapp' }
    }

    const menu = Menu.buildFromTemplate(buildMenuFromMessages(msgs))
    Menu.setApplicationMenu(menu)

    // In development, load from Vite dev server
    if (process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
        mainWindow.webContents.openDevTools()
    } else {
        // In production, load the built files
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
    }

    mainWindow.on('closed', () => {
        mainWindow = null
    })

    // Handle close event to check for unsaved changes
    mainWindow.on('close', (e) => {
        if (closeRequested) {
            // User already confirmed or saved, allow close
            return
        }

        if (isModified) {
            // Prevent default close behavior
            e.preventDefault()
            // Ask renderer to handle the unsaved changes dialog
            mainWindow.webContents.send('before-close')
        }
    })

    // Handle pending file after window finishes loading
    mainWindow.webContents.on('did-finish-load', () => {
        if (pendingFileToOpen) {
            openFileInRenderer(pendingFileToOpen)
            pendingFileToOpen = null
        }
    })
}

function updateWindowTitle(filePath) {
    const fileName = filePath ? path.basename(filePath) : 'Senza titolo'
    mainWindow.setTitle(`${fileName} - Markapp`)
}

// IPC handlers per le operazioni sui file
ipcMain.handle('save-file', async (event, { filePath, content }) => {
    try {
        fs.writeFileSync(filePath, content, 'utf-8')
        currentFilePath = filePath
        updateWindowTitle(filePath)
        return { success: true, filePath }
    } catch (err) {
        return { success: false, error: err.message }
    }
})

ipcMain.handle('save-file-dialog', async (event, { content }) => {
    const result = await dialog.showSaveDialog(mainWindow, {
        filters: [
            { name: 'Markdown', extensions: ['md'] },
            { name: 'Tutti i file', extensions: ['*'] }
        ],
        defaultPath: currentFilePath || 'documento.md'
    })

    if (!result.canceled && result.filePath) {
        try {
            fs.writeFileSync(result.filePath, content, 'utf-8')
            currentFilePath = result.filePath
            updateWindowTitle(result.filePath)
            return { success: true, filePath: result.filePath }
        } catch (err) {
            return { success: false, error: err.message }
        }
    }
    return { success: false, canceled: true }
})

ipcMain.handle('get-current-file-path', () => {
    return currentFilePath
})

ipcMain.handle('open-file-dialog', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
            { name: 'Markdown', extensions: ['md', 'markdown'] },
            { name: 'Tutti i file', extensions: ['*'] }
        ]
    })

    if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0]
        try {
            const content = fs.readFileSync(filePath, 'utf-8')
            currentFilePath = filePath
            updateWindowTitle(filePath)
            return { success: true, filePath, content }
        } catch (err) {
            return { success: false, error: err.message }
        }
    }
    return { success: false, canceled: true }
})

// Allow renderer to open a specific file path (used for session restore)
ipcMain.handle('open-file-by-path', async (event, { filePath }) => {
    try {
        if (!filePath || typeof filePath !== 'string') {
            return { success: false, error: 'Invalid file path' }
        }
        const abs = path.resolve(filePath)
        if (!fs.existsSync(abs)) {
            return { success: false, error: 'File not found', notFound: true }
        }
        const content = fs.readFileSync(abs, 'utf-8')
        currentFilePath = abs
        updateWindowTitle(abs)
        return { success: true, filePath: abs, content }
    } catch (err) {
        return { success: false, error: err && err.message ? err.message : String(err) }
    }
})

app.whenReady().then(async () => {
    // Check if a .md file was passed as argument (double-click or context menu)
    pendingFileToOpen = getFilePathFromArgs()

    // Carica i file di traduzione delle UI da build (Vite) o dalla sorgente usando import dinamico ESM
    try {
        const itPath = path.join(__dirname, '../src/assets/i18n/it/index.js')
        const enPath = path.join(__dirname, '../src/assets/i18n/en/index.js')
        if (fs.existsSync(itPath)) {
            const mod = await import(pathToFileURL(itPath).href)
            messages.it = mod.default || mod
        }
        if (fs.existsSync(enPath)) {
            const mod = await import(pathToFileURL(enPath).href)
            messages.en = mod.default || mod
        }
    } catch (err) {
        console.warn('Could not load i18n files for electron menu:', err && err.message ? err.message : err)
    }

    createWindow()

    // Espone un handler IPC per permettere al renderer di cambiare lingua
    ipcMain.on('set-app-locale', (event, locale) => {
        if (!locale) return
        appLocale = locale
        const msgs = messages[appLocale] || messages.en || { file: {}, edit: {}, view: {}, info: {}, app: { title: 'Markapp' } }
        const menu = Menu.buildFromTemplate((function build() {
            return [
                {
                    label: msgs.file.menu,
                    submenu: [
                        { label: msgs.file.new, accelerator: 'CmdOrCtrl+N', click: () => { currentFilePath = null; mainWindow.webContents.send('file-new') } },
                        { label: msgs.file.open, accelerator: 'CmdOrCtrl+O', click: () => { mainWindow.webContents.send('file-open') } },
                        { type: 'separator' },
                        { label: msgs.file.save, accelerator: 'CmdOrCtrl+S', click: () => { mainWindow.webContents.send('file-save') } },
                        { label: msgs.file.saveAs, accelerator: 'CmdOrCtrl+Shift+S', click: () => { mainWindow.webContents.send('file-save-as') } },
                        { type: 'separator' },
                        { label: msgs.file.quit, accelerator: 'Alt+F4', click: () => { app.quit() } }
                    ]
                },
                {
                    label: msgs.edit.menu,
                    submenu: [
                        { label: msgs.edit.undo, accelerator: 'CmdOrCtrl+Z', role: 'undo' },
                        { label: msgs.edit.redo, accelerator: 'CmdOrCtrl+Y', role: 'redo' },
                        { type: 'separator' },
                        { label: msgs.edit.cut, accelerator: 'CmdOrCtrl+X', role: 'cut' },
                        { label: msgs.edit.copy, accelerator: 'CmdOrCtrl+C', role: 'copy' },
                        { label: msgs.edit.paste, accelerator: 'CmdOrCtrl+V', role: 'paste' },
                        { type: 'separator' },
                        { label: msgs.edit.selectAll, accelerator: 'CmdOrCtrl+A', role: 'selectAll' },
                        { type: 'separator' },
                        { label: msgs.edit.find, accelerator: 'CmdOrCtrl+F', click: () => { mainWindow.webContents.send('show-search') } },
                        { label: msgs.edit.replace, accelerator: 'CmdOrCtrl+H', click: () => { mainWindow.webContents.send('show-replace') } }
                    ]
                },
                { label: msgs.view.menu, submenu: [{ label: msgs.view.reload, accelerator: 'CmdOrCtrl+R', click: () => { mainWindow.webContents.reload() } }, { label: msgs.view.devtools, accelerator: 'F12', click: () => { mainWindow.webContents.toggleDevTools() } }, { type: 'separator' }, { label: msgs.view.zoomIn, accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' }, { label: msgs.view.zoomOut, accelerator: 'CmdOrCtrl+-', role: 'zoomOut' }, { label: msgs.view.resetZoom, accelerator: 'CmdOrCtrl+0', role: 'resetZoom' }, { type: 'separator' }, { label: msgs.view.fullscreen, accelerator: 'F11', role: 'togglefullscreen' }] },
                { label: msgs.info.menu, submenu: [{ label: msgs.info.about, click: () => { dialog.showMessageBox(mainWindow, { type: 'info', title: msgs.info.aboutTitle || msgs.info.about, message: msgs.app.title || 'Markapp', detail: msgs.info.aboutDetail || `Versione: 1.0.0\n\nUn editor Markdown moderno costruito con:\n• Vue 3\n• Electron\n• Tailwind CSS\n\n© 2025 Markapp`, buttons: [msgs.info.ok || 'OK'] }) } }] }
            ]
        })())
        Menu.setApplicationMenu(menu)
    })

    // Permette al renderer di richiedere la lingua corrente
    ipcMain.handle('get-app-locale', () => {
        return appLocale
    })

    // Track modified state from renderer
    ipcMain.on('set-modified-state', (event, modified) => {
        isModified = modified
    })

    // Handle theme change from renderer
    ipcMain.on('set-app-theme', (event, theme) => {
        if (theme === 'light') {
            nativeTheme.themeSource = 'light'
        } else if (theme === 'dark') {
            nativeTheme.themeSource = 'dark'
        } else {
            nativeTheme.themeSource = 'system'
        }
    })

    // Provide current theme to renderer
    ipcMain.handle('get-app-theme', () => {
        return nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
    })

    // Handle close confirmation from renderer
    ipcMain.on('confirm-close', (event, shouldSave) => {
        if (shouldSave === 'cancel') {
            // User cancelled, reset flags
            closeRequested = false
            isModified = true // Keep modified state
        } else if (shouldSave === 'save') {
            // User wants to save - trigger save and then close
            mainWindow.webContents.send('file-save')
            // The renderer will call confirm-close again with 'close' after save completes
        } else {
            // User chose 'don't save' or save completed ('close')
            closeRequested = true
            isModified = false
            mainWindow.close()
        }
    })

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
