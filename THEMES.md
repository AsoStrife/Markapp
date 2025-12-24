# Sistema di Temi Markapp

## Panoramica

Gli stili CSS di tutti i componenti sono stati centralizzati nel file `src/assets/theme.css`. Questo file contiene sia il tema scuro (default) che il tema chiaro, utilizzando CSS Custom Properties (variabili CSS).

## Struttura

### File Principali

- **`src/assets/theme.css`** - Contiene tutti gli stili dei componenti e le definizioni dei temi
- **`src/composables/useTheme.js`** - Composable Vue per gestire il cambio di tema
- **`src/assets/styles.css`** - Importa `theme.css` e contiene gli stili globali per Markdown

### Come Funziona

Il sistema utilizza CSS Custom Properties con due set di valori:
- Tema scuro (default) - definito in `:root`
- Tema chiaro - definito in `[data-theme="light"]`

Quando l'utente cambia tema, viene aggiunto/rimosso l'attributo `data-theme="light"` sull'elemento `html`, cambiando automaticamente tutti i colori.

## Utilizzo

### Cambiare Tema

L'utente può cambiare tema da:
1. **StatusBar** → Impostazioni → Toggle "Tema scuro/chiaro"
2. Il tema selezionato viene salvato in `localStorage` e ripristinato al prossimo avvio
3. **Il menu nativo di Electron cambia automaticamente** per seguire il tema selezionato

### Programmaticamente

```javascript
import { useTheme } from './composables/useTheme'

const { currentTheme, toggleTheme, setTheme } = useTheme()

// Cambia tema
toggleTheme()

// Imposta tema specifico
setTheme('light')  // o 'dark'

// Leggi tema corrente
console.log(currentTheme.value)
```

## Personalizzazione

### Modificare i Colori

Per modificare i colori di un tema, edita le variabili CSS in `src/assets/theme.css`:

```css
:root {
  /* Dark Theme */
  --toolbar-bg: #1f2937;
  --toolbar-text: #e5e7eb;
  /* ... */
}

[data-theme="light"] {
  /* Light Theme */
  --toolbar-bg: #ffffff;
  --toolbar-text: #374151;
  /* ... */
}
```

### Aggiungere Nuove Variabili

1. Aggiungi la variabile in entrambi i temi in `theme.css`:
```css
:root {
  --mia-nuova-variabile: #valore-dark;
}

[data-theme="light"] {
  --mia-nuova-variabile: #valore-light;
}
```

2. Usa la variabile nei componenti:
```css
.mia-classe {
  background-color: var(--mia-nuova-variabile);
}
```

## Variabili Disponibili

### Categorie

- **TitleBar** - `--titlebar-*`
- **Toolbar** - `--toolbar-*`
- **Editor** - `--editor-*`
- **Preview** - `--preview-*`
- **StatusBar** - `--statusbar-*`
- **Outline Panel** - `--outline-*`
- **Search/Replace Dialog** - `--dialog-*`
- **Confirm Dialog** - `--modal-*`
- **WYSIWYG Editor** - `--wysiwyg-*`

Vedi `src/assets/theme.css` per l'elenco completo.

## Migrazioni Effettuate

I seguenti componenti sono stati aggiornati per usare il sistema centralizzato:

✅ **Toolbar.vue** - Rimossi stili scoped, usa classi `toolbar-btn` e `toolbar-btn-icon`
✅ **MarkdownEditor.vue** - Rimossi stili scoped, usa classe `markdown-editor-textarea`
✅ **OutlinePanel.vue** - Rimossa classe custom, usa `outline-panel-bg`
✅ **SearchReplaceDialog.vue** - Rimossi stili scoped, usa classi `search-dialog-btn-small.*`
✅ **ConfirmCloseDialog.vue** - Rimossi stili scoped, usa classi `confirm-dialog-btn-foot.*`
✅ **WysiwygEditor.vue** - Rimossi stili scoped, usa classe `tiptap-wrapper`
✅ **PreviewPane.vue** - Mantiene stile `preview-highlight` (non scoped per v-html)

## Vantaggi

1. **Centralizzazione** - Tutti gli stili in un unico file facile da mantenere
2. **Consistenza** - Stessi colori e stili in tutta l'app
3. **Facile Personalizzazione** - Modifica un valore, aggiorna ovunque
4. **Temi Multipli** - Facile aggiungere nuovi temi (es. tema ad alto contrasto)
5. **Performance** - Cambio tema istantaneo senza ricaricare componenti
6. **Integrazione Electron** - Il menu nativo si aggiorna automaticamente con il tema

## Integrazione Electron

Il sistema di temi è integrato con Electron tramite:

### File Modificati
- **`electron/main.js`** - Importa `nativeTheme` e gestisce `set-app-theme` / `get-app-theme`
- **`electron/preload.cjs`** - Espone `setAppTheme()` e `getAppTheme()` al renderer
- **`src/composables/useTheme.js`** - Comunica automaticamente con Electron quando cambia il tema

### Come Funziona
1. L'utente cambia tema nell'interfaccia
2. `useTheme.js` aggiorna il DOM con `data-theme="light"` o rimuove l'attributo
3. Chiama `window.electronAPI.setAppTheme(theme)` che invia un evento IPC
4. Il processo principale riceve l'evento e imposta `nativeTheme.themeSource`
5. Il menu nativo di Windows/macOS/Linux si aggiorna automaticamente

### API Disponibili

```javascript
// Nel renderer (Vue components)
import { useTheme } from './composables/useTheme'

const { currentTheme, toggleTheme, setTheme } = useTheme()

// Cambia tema (automaticamente sincronizza con Electron)
setTheme('light')  // o 'dark'
toggleTheme()      // Alterna tra light e dark
```

Quando l'app viene avviata, il tema viene:
1. Letto da `localStorage` se disponibile
2. Altrimenti dalle preferenze di sistema (`prefers-color-scheme`)
3. Applicato sia al renderer che al processo principale di Electron
