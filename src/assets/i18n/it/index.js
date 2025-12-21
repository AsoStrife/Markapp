export default {
    app: {
        title: 'Markapp'
    },
    status: {
        markdown: 'Markdown',
        encoding: 'UTF-8'
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
        selectAll: 'Seleziona tutto'
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
    }
}