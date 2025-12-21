export default {
    app: {
        title: 'Markapp'
    },
    status: {
        markdown: 'Markdown',
        encoding: 'UTF-8'
    },
    settings: {
        menu: 'Settings',
        restoreSession: 'Restore last session'
    },
    file: {
        untitled: 'Untitled',
        menu: 'File',
        new: 'New',
        open: 'Open...',
        save: 'Save',
        saveAs: 'Save As...',
        quit: 'Quit'
    },
    editor: {
        markdown: 'Markdown Editor',
        wysiwyg: 'WYSIWYG Editor',
        placeholder: 'Write your Markdown here...',
        characters: 'characters'
    },
    preview: {
        title: 'Preview',
        readonly: 'Read only'
    },
    toolbar: {
        h1: 'Heading 1 (H1)',
        h2: 'Heading 2 (H2)',
        h3: 'Heading 3 (H3)',
        h4: 'Heading 4 (H4)',
        bold: 'Bold (Ctrl+B)',
        italic: 'Italic (Ctrl+I)',
        underline: 'Underline (Ctrl+U)',
        strike: 'Strikethrough',
        code: 'Inline code',
        codeBlock: 'Code block',
        bulletList: 'Bullet list',
        numberedList: 'Numbered list',
        taskList: 'Task list',
        blockquote: 'Blockquote',
        link: 'Link',
        image: 'Image',
        hr: 'Horizontal rule',
        table: 'Table',
        viewRaw: 'Raw view',
        viewSplit: 'Split view',
        viewPreview: 'WYSIWYG view'
    },

    edit: {
        menu: 'Edit',
        undo: 'Undo',
        redo: 'Redo',
        cut: 'Cut',
        copy: 'Copy',
        paste: 'Paste',
        selectAll: 'Select All'
    },
    view: {
        menu: 'View',
        reload: 'Reload',
        devtools: 'Developer Tools',
        zoomIn: 'Zoom In',
        zoomOut: 'Zoom Out',
        resetZoom: 'Reset Zoom',
        fullscreen: 'Toggle Fullscreen'
    },
    info: {
        menu: 'Help',
        about: 'About Markapp',
        aboutTitle: 'About Markapp',
        aboutDetail: `Version: 1.0.0\n\nA modern Markdown editor built with:\n• Vue 3\n• Electron\n• Tailwind CSS\n\n© 2025 Markapp`,
        ok: 'OK'
    },
    alerts: {
        noElectron: "Electron API not available. Make sure the app is running in Electron.",
        saveError: 'Save error: {error}',
        openError: 'Open error: {error}'
        ,
        renderError: 'Error rendering markdown'
    },
    prompt: {
        enterUrl: 'Enter URL:',
        enterImageUrl: 'Enter image URL:'
    },
    newDoc: {
        content: '# New document\n\nStart writing here...'
    },
    stats: {
        lines: 'lines',
        words: 'words'
    }
}