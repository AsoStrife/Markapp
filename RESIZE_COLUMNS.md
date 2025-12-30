# Sistema di Ridimensionamento Colonne

## Panoramica

È stato implementato un sistema di ridimensionamento per le colonne dell'applicazione Markapp che permette di:

1. **Ridimensionare l'Outline Panel** (indice dei contenuti)
2. **Ridimensionare l'Editor Markdown** (in modalità split view)
3. **Ridimensionare automaticamente il Preview Panel** (occupa lo spazio rimanente)

## Caratteristiche

### Persistenza dei Valori
I valori di ridimensionamento sono salvati automaticamente nel **localStorage** del browser con le seguenti chiavi:
- `markapp.outlineWidth` - Larghezza dell'Outline Panel
- `markapp.editorWidth` - Larghezza dell'Editor Markdown

Quando riapri l'applicazione, le colonne avranno le dimensioni che avevi impostato precedentemente.

### Limiti di Ridimensionamento
Per garantire una buona usabilità, sono stati impostati i seguenti limiti:

**Outline Panel:**
- Larghezza minima: 150px
- Larghezza massima: 600px
- Larghezza predefinita: 256px

**Editor Markdown:**
- Larghezza minima: 300px
- Larghezza massima: 2000px
- Larghezza predefinita: metà dello spazio disponibile

### Utilizzo

1. Porta il cursore del mouse sul bordo tra due colonne
2. Il cursore cambierà forma diventando una doppia freccia (col-resize)
3. Clicca e trascina per ridimensionare
4. Rilascia il mouse per confermare la nuova dimensione
5. La dimensione viene salvata automaticamente

## Implementazione Tecnica

### File Modificati/Creati

#### Nuovi File
- `src/composables/useResizable.js` - Composable Vue per gestire la logica di ridimensionamento
- `src/components/ResizeHandle.vue` - Componente per il separatore trascinabile

#### File Modificati
- `src/App.vue` - Integrazione del sistema di ridimensionamento
- `src/components/OutlinePanel.vue` - Aggiunta supporto larghezza dinamica
- `src/components/MarkdownEditor.vue` - Aggiunta supporto larghezza dinamica
- `src/assets/styles.css` - Aggiunta stili per i separatori

### Composable `useResizable`

Il composable gestisce:
- Eventi di mouse (mousedown, mousemove, mouseup)
- Calcolo della nuova larghezza con limiti min/max
- Salvataggio automatico in localStorage tramite VueUse
- Gestione dello stato di ridimensionamento

### Componente `ResizeHandle`

Il separatore visivo che:
- Mostra una linea sottile al centro
- Cambia colore al hover (blu chiaro)
- Cambia colore durante il drag (blu intenso)
- Ha una zona cliccabile di 4px per facilitare l'interazione

## Stili CSS

Gli stili per i separatori ridimensionabili sono stati aggiunti in `src/assets/styles.css`:
- Cursore col-resize
- Effetti hover e active
- Prevenzione della selezione di testo durante il drag

## Note Tecniche

- Il sistema utilizza `@vueuse/core` per la gestione dello storage persistente
- Gli eventi di mouse sono gestiti a livello di documento per permettere il drag anche fuori dalla zona del separatore
- La pulizia degli event listener è gestita automaticamente dal composable tramite `onUnmounted`
- In modalità "raw" o "preview", l'editor occupa tutto lo spazio disponibile
