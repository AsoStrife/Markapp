# Markapp

Applicazione Vue 3 + Vite con supporto Electron per creare un'applicazione desktop multipiattaforma.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd) 
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Development Web (Browser)

Avvia il server di sviluppo Vite per testare in browser:

```sh
npm run dev
```

### Development Electron (Desktop App)

Avvia l'applicazione in modalità sviluppo dentro Electron:

```sh
npm run electron:dev
```

Questo comando avvierà contemporaneamente il server Vite e l'applicazione Electron con hot-reload.

### Build for Production

#### Web Build

Compila per distribuzione web:

```sh
npm run build
```

#### Electron Build

Crea l'eseguibile desktop per la tua piattaforma corrente:

```sh
npm run electron:build
```

Oppure specifica la piattaforma target:

```sh
npm run electron:build:win   # Windows (crea installer .exe e versione portable)
npm run electron:build:mac   # macOS (crea .dmg e .zip)
npm run electron:build:linux # Linux (crea .AppImage e .deb)
```

Gli eseguibili verranno generati nella cartella `release/`.

## Icone dell'applicazione

Posiziona le icone della tua applicazione nella cartella `build/icons/`:

- **icon.png**: Icona principale (consigliato: 1024x1024 px)
- **icon.ico**: Icona Windows (256x256 px)
- **icon.icns**: Icona macOS (512x512 px)

Electron-builder genererà automaticamente le icone per tutte le piattaforme se fornisci solo il file PNG ad alta risoluzione.

## Configurazione Electron

La configurazione di Electron si trova in:
- `electron/main.js`: Processo principale di Electron
- `electron/preload.js`: Script di preload (per esporre API sicure)
- `electron-builder.json`: Configurazione per la build dell'eseguibile

## Struttura del Progetto

```
markapp/
├── electron/           # File Electron
│   ├── main.js        # Entry point Electron
│   └── preload.js     # Script preload
├── build/             # Risorse per la build
│   └── icons/         # Icone dell'applicazione
├── src/               # Codice sorgente Vue
├── dist/              # Build di produzione (generato)
├── release/           # Eseguibili Electron (generato)
├── electron-builder.json  # Config Electron Builder
└── package.json
```

## Tecnologie Utilizzate

- **Vue 3**: Framework frontend
- **Vite**: Build tool e dev server
- **Vue Router**: Routing
- **Pinia**: State management
- **Tailwind CSS**: Framework CSS utility-first
- **Electron**: Framework per app desktop
- **Electron Builder**: Packaging e distribuzione

## Styling con Tailwind CSS

Il progetto utilizza Tailwind CSS v3 per lo styling. La configurazione si trova in:
- `tailwind.config.cjs`: Configurazione Tailwind (content paths, theme, plugins)
- `postcss.config.cjs`: Configurazione PostCSS
- `src/assets/styles.css`: File CSS globale con direttive Tailwind

Le classi Tailwind sono disponibili globalmente in tutti i componenti Vue. Esempio:

```vue
<template>
  <div class="bg-blue-500 text-white p-4 rounded-lg">
    <h1 class="text-2xl font-bold">Hello Tailwind!</h1>
  </div>
</template>
```
