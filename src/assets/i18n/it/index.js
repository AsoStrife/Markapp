export default {
    app: {
        title: 'Markapp'
    },
    status: {
        markdown: 'Markdown',
        encoding: 'UTF-8'
    },
    settings: {
        menu: 'Impostazioni',
        restoreSession: 'Ripristina ultima sessione',
        themeDark: 'Tema scuro',
        themeLight: 'Tema chiaro'
    },
    file: {
        untitled: 'Senza titolo',
        menu: 'File',
        new: 'Nuovo',
        open: 'Apri...',
        save: 'Salva',
        saveAs: 'Salva con nome...',
        quit: 'Esci'
    },
    editor: {
        markdown: 'Editor Markdown',
        wysiwyg: 'Editor WYSIWYG',
        placeholder: 'Scrivi il tuo Markdown qui...',
        characters: 'caratteri'
    },
    preview: {
        title: 'Anteprima',
        readonly: 'Sola lettura'
    },
    outline: {
        title: 'Indice dei contenuti'
    },
    toolbar: {
        h1: 'Titolo 1 (H1)',
        h2: 'Titolo 2 (H2)',
        h3: 'Titolo 3 (H3)',
        h4: 'Titolo 4 (H4)',
        bold: 'Grassetto (Ctrl+B)',
        italic: 'Corsivo (Ctrl+I)',
        underline: 'Sottolineato (Ctrl+U)',
        strike: 'Barrato',
        code: 'Codice inline',
        codeBlock: 'Blocco codice',
        bulletList: 'Lista puntata',
        numberedList: 'Lista numerata',
        taskList: 'Task list',
        blockquote: 'Citazione',
        link: 'Link',
        image: 'Immagine',
        hr: 'Linea orizzontale',
        table: 'Tabella',
        viewRaw: 'Vista Raw',
        viewSplit: 'Vista Split',
        viewPreview: 'Vista WYSIWYG'
    },

    edit: {
        menu: 'Modifica',
        undo: 'Annulla',
        redo: 'Ripeti',
        cut: 'Taglia',
        copy: 'Copia',
        paste: 'Incolla',
        selectAll: 'Seleziona tutto',
        find: 'Trova...',
        replace: 'Trova e sostituisci...'
    },
    search: {
        title: 'Trova',
        replaceTitle: 'Trova e sostituisci',
        searchFor: 'Cerca',
        replaceWith: 'Sostituisci con',
        searchPlaceholder: 'Inserisci il testo da cercare...',
        replacePlaceholder: 'Inserisci il testo sostitutivo...',
        caseSensitive: 'Maiuscole/minuscole',
        wholeWord: 'Parola intera',
        useRegex: 'Usa espressione regolare',
        findNext: 'Trova successivo',
        findPrevious: 'Trova precedente',
        replace: 'Sostituisci',
        replaceAll: 'Sostituisci tutto',
        of: 'di',
        noMatches: 'Nessuna corrispondenza',
        close: 'Chiudi'
    },
    view: {
        menu: 'Vista',
        reload: 'Ricarica',
        devtools: 'Strumenti sviluppatore',
        zoomIn: 'Zoom avanti',
        zoomOut: 'Zoom indietro',
        resetZoom: 'Reimposta zoom',
        fullscreen: 'Schermo intero'
    },
    info: {
        menu: 'Info',
        about: 'Informazioni su Markapp',
        aboutTitle: 'Informazioni su Markapp',
        aboutDetail: `Versione: 1.0.0\n\nUn editor Markdown moderno costruito con:\n• Vue 3\n• Electron\n• Tailwind CSS\n\n© 2025 Markapp`,
        ok: 'OK'
    },
    alerts: {
        noElectron: "API Electron non disponibili. Assicurati che l'app sia in esecuzione in Electron.",
        saveError: 'Errore nel salvataggio: {error}',
        openError: 'Errore nell\'apertura: {error}'
        ,
        renderError: 'Errore nel rendering del markdown'
    },
    dialog: {
        unsavedChanges: 'Modifiche non salvate',
        unsavedMessage: 'Ci sono modifiche non salvate. Vuoi salvare prima di chiudere?',
        save: 'Salva',
        dontSave: 'Non salvare',
        cancel: 'Annulla'
    },
    prompt: {
        enterUrl: 'Inserisci URL:',
        enterImageUrl: 'Inserisci URL immagine:'
    },
    newDoc: {
        content: '# Nuovo documento\n\nInizia a scrivere qui...'
    },
    stats: {
        lines: 'righe',
        words: 'parole'
    },
    shortcuts: {
        new: 'Nuovo File',
        open: 'Apri File',
        save: 'Salva',
        saveAs: 'Salva con nome',
        bold: 'Grassetto',
        italic: 'Corsivo',
        underline: 'Sottolineato',
        strike: 'Barrato',
        code: 'Codice Inline',
        codeBlock: 'Blocco Codice',
        h1: 'Titolo 1',
        h2: 'Titolo 2',
        h3: 'Titolo 3',
        h4: 'Titolo 4',
        bulletList: 'Lista Puntata',
        orderedList: 'Lista Numerata',
        taskList: 'Lista Task',
        blockquote: 'Citazione',
        link: 'Inserisci Link',
        image: 'Inserisci Immagine',
        hr: 'Linea Orizzontale',
        table: 'Inserisci Tabella',
        find: 'Trova',
        replace: 'Trova e Sostituisci',
        toggleOutline: 'Mostra/Nascondi Indice',
        settings: 'Impostazioni'
    },
    shortcutCategories: {
        file: 'File',
        format: 'Formattazione',
        navigation: 'Navigazione'
    },
    settingsDialog: {
        title: 'Impostazioni',
        generalTab: 'Generale',
        shortcutsTab: 'Scorciatoie',
        theme: 'Tema',
        themeDark: 'Scuro',
        themeLight: 'Chiaro',
        language: 'Lingua',
        restoreSession: 'Ripristina ultima sessione all\'avvio',
        shortcutAction: 'Azione',
        shortcutKeys: 'Scorciatoia',
        shortcutEdit: 'Clicca per modificare',
        shortcutReset: 'Ripristina',
        shortcutResetAll: 'Ripristina Tutti i Default',
        shortcutConflict: 'Questa scorciatoia è in conflitto con: {action}',
        shortcutRecording: 'Premi la nuova scorciatoia...',
        shortcutCancel: 'Premi Escape per annullare',
        close: 'Chiudi'
    }
}