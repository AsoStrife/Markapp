# Heroicons - Icone vettoriali per Vue + Tailwind

## 📦 Installazione

Il package `@heroicons/vue` è già installato nel progetto:

```bash
npm install @heroicons/vue
```

## 🎨 Tipi di icone disponibili

Heroicons offre 3 stili di icone:

### 1. **Solid** (24x24px) - Icone piene
```javascript
import { HomeIcon } from '@heroicons/vue/24/solid'
```

### 2. **Outline** (24x24px) - Icone con contorno
```javascript
import { HomeIcon } from '@heroicons/vue/24/outline'
```

### 3. **Mini** (20x20px) - Icone piccole piene
```javascript
import { HomeIcon } from '@heroicons/vue/20/solid'
```

## 🚀 Utilizzo base

### In un componente Vue (Script Setup)

```vue
<template>
  <div>
    <!-- Icona solid -->
    <HeartIcon class="h-6 w-6 text-red-500" />
    
    <!-- Icona outline -->
    <HeartIconOutline class="h-6 w-6 text-blue-500" />
    
    <!-- Icona mini -->
    <HeartIconMini class="h-5 w-5 text-green-500" />
  </div>
</template>

<script setup>
import { HeartIcon } from '@heroicons/vue/24/solid'
import { HeartIcon as HeartIconOutline } from '@heroicons/vue/24/outline'
import { HeartIcon as HeartIconMini } from '@heroicons/vue/20/solid'
</script>
```

## 💡 Esempi pratici

### Bottone con icona
```vue
<button class="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded">
  <PlusIcon class="h-5 w-5" />
  <span>Aggiungi nuovo</span>
</button>
```

### Input con icona di ricerca
```vue
<div class="relative">
  <MagnifyingGlassIcon class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
  <input type="text" class="pl-10 pr-4 py-2 border rounded-lg" placeholder="Cerca..." />
</div>
```

### Menu con icone
```vue
<nav class="space-y-2">
  <a href="#" class="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded">
    <DocumentTextIcon class="h-5 w-5 text-gray-600" />
    <span>Documenti</span>
  </a>
  <a href="#" class="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded">
    <FolderIcon class="h-5 w-5 text-gray-600" />
    <span>Cartelle</span>
  </a>
  <a href="#" class="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded">
    <CogIcon class="h-5 w-5 text-gray-600" />
    <span>Impostazioni</span>
  </a>
</nav>
```

### Icone interattive
```vue
<template>
  <button @click="toggleFavorite" class="p-2 hover:bg-gray-100 rounded-full">
    <HeartIconSolid v-if="isFavorite" class="h-6 w-6 text-red-500" />
    <HeartIconOutline v-else class="h-6 w-6 text-gray-400" />
  </button>
</template>

<script setup>
import { ref } from 'vue'
import { HeartIcon as HeartIconSolid } from '@heroicons/vue/24/solid'
import { HeartIcon as HeartIconOutline } from '@heroicons/vue/24/outline'

const isFavorite = ref(false)
const toggleFavorite = () => {
  isFavorite.value = !isFavorite.value
}
</script>
```

## 📋 Icone comuni per Markdown Editor

```javascript
// Editing
import { 
  PencilIcon,           // Modifica
  DocumentTextIcon,     // Documento
  EyeIcon,              // Anteprima
  CodeBracketIcon,      // Codice
} from '@heroicons/vue/24/outline'

// Formattazione
import {
  BoldIcon,             // Grassetto (non presente, usa <b>)
  ItalicIcon,           // Corsivo (non presente, usa <i>)
  LinkIcon,             // Link
  PhotoIcon,            // Immagine
  ListBulletIcon,       // Lista puntata
  NumberedListIcon,     // Lista numerata
  TableCellsIcon,       // Tabella
} from '@heroicons/vue/24/outline'

// Azioni
import {
  MagnifyingGlassIcon,  // Cerca
  ArrowPathIcon,        // Aggiorna
  ArrowDownTrayIcon,    // Download
  ArrowUpTrayIcon,      // Upload
  FolderOpenIcon,       // Apri file
  DocumentPlusIcon,     // Nuovo documento
  DocumentDuplicateIcon,// Duplica
  TrashIcon,            // Elimina
} from '@heroicons/vue/24/outline'

// UI
import {
  XMarkIcon,            // Chiudi
  CheckIcon,            // Conferma
  ExclamationTriangleIcon, // Avviso
  InformationCircleIcon,   // Info
  Cog6ToothIcon,        // Impostazioni
  Bars3Icon,            // Menu hamburger
} from '@heroicons/vue/24/outline'
```

## 🎯 Dimensioni con Tailwind

```vue
<!-- Piccola (16px) -->
<Icon class="h-4 w-4" />

<!-- Normale (20px) - usa mini icons -->
<Icon class="h-5 w-5" />

<!-- Media (24px) -->
<Icon class="h-6 w-6" />

<!-- Grande (32px) -->
<Icon class="h-8 w-8" />

<!-- Extra Large (48px) -->
<Icon class="h-12 w-12" />
```

## 🎨 Colori con Tailwind

```vue
<!-- Colori di testo -->
<Icon class="text-blue-500" />
<Icon class="text-red-600" />
<Icon class="text-gray-400" />

<!-- Con hover -->
<Icon class="text-gray-500 hover:text-blue-600" />

<!-- Con transizioni -->
<Icon class="text-gray-500 hover:text-blue-600 transition-colors duration-200" />
```

## 📚 Risorse

- [Heroicons Official Website](https://heroicons.com/) - Browse all available icons
- [Heroicons GitHub](https://github.com/tailwindlabs/heroicons)
- [Vue Component Documentation](https://github.com/tailwindlabs/heroicons#vue)

## 🧪 Componente di esempio

Puoi trovare un componente di esempio completo in:
- [`src/components/IconsExample.vue`](../components/IconsExample.vue)

Per visualizzarlo, importalo in un altro componente o route.

## 💡 Tips

1. **Tree-shaking**: Importa solo le icone che usi effettivamente
2. **Alias**: Usa alias quando importi lo stesso nome da stili diversi
3. **Tailwind**: Sfrutta le classi Tailwind per dimensioni e colori
4. **Accessibilità**: Aggiungi sempre `aria-label` o `title` per le icone interattive
5. **Performance**: Le icone sono componenti Vue ottimizzati e leggeri
