<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  markdownContent: { type: String, default: '' },
  viewMode: { type: String, default: 'split' },
  locale: { type: String, default: 'en' },
  languages: { type: Array, default: () => [] },
  showLangMenu: { type: Boolean, default: false },
  showOutline: { type: Boolean, default: true },
  restoreSessionEnabled: { type: Boolean, default: true },
  text: { type: Object, default: () => ({ markdown: 'Markdown', encoding: 'UTF-8', lines: 'lines', words: 'words', outline: 'Outline', viewRaw: 'Raw', viewSplit: 'Split', viewPreview: 'Preview', settings: 'Settings', restoreSession: 'Restore last session' }) },
})

const emit = defineEmits(['update:viewMode', 'toggleLangMenu', 'selectLanguage', 'toggleOutline', 'toggleRestoreSession'])

const lines = computed(() => props.markdownContent.split('\n').length)
const words = computed(() => props.markdownContent.split(/\s+/).filter(w => w).length)

function setViewMode(mode) { emit('update:viewMode', mode) }
function toggleLangMenu() { emit('toggleLangMenu') }
function selectLanguage(code) { emit('selectLanguage', code) }
function toggleOutline() { emit('toggleOutline') }
function toggleRestoreSession() { emit('toggleRestoreSession') }

const showSettingsMenu = ref(false)
function toggleSettingsMenu() { showSettingsMenu.value = !showSettingsMenu.value }
</script>

<template>
  <div class="flex items-center justify-between px-4 py-1.5 bg-gray-800 border-t border-gray-700 text-xs text-gray-400">
    <div class="flex items-center space-x-4">
      <span>{{ props.text.markdown }}</span>
      <span>{{ props.text.encoding }}</span>
    </div>
    <div class="flex items-center space-x-1">
      <button @click="setViewMode('raw')" class="p-1.5 rounded transition-colors hover:bg-gray-700"
        :class="props.viewMode === 'raw' ? 'text-blue-400' : 'text-gray-400'" :title="props.text.viewRaw">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      </button>
      <button @click="setViewMode('split')" class="p-1.5 rounded transition-colors hover:bg-gray-700"
        :class="props.viewMode === 'split' ? 'text-blue-400' : 'text-gray-400'" :title="props.text.viewSplit">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 4H5a2 2 0 00-2 2v14a2 2 0 002 2h4m0-18v18m0-18l10 0a2 2 0 012 2v14a2 2 0 01-2 2h-10" />
        </svg>
      </button>
      <button @click="setViewMode('preview')" class="p-1.5 rounded transition-colors hover:bg-gray-700"
        :class="props.viewMode === 'preview' ? 'text-blue-400' : 'text-gray-400'" :title="props.text.viewPreview">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      </button>
    </div>
    <div class="flex items-center space-x-4">
      <button @click="toggleOutline" class="px-2 py-1 rounded transition-colors hover:bg-gray-700"
        :class="props.showOutline ? 'text-blue-400' : 'text-gray-400'" :title="props.text.outline">{{ props.text.outline }}</button>
      <span>{{ lines }} {{ props.text.lines }}</span>
      <span>{{ words }} {{ props.text.words }}</span>
      <div class="relative">
        <button @click="toggleLangMenu" class="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-700" :title="props.text.viewPreview">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2a10 10 0 100 20 10 10 0 000-20z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2 12h20M12 2c3.5 3.5 3.5 17 0 20M12 2C8.5 5.5 8.5 18.5 12 22" />
          </svg>
          <span class="text-xs text-gray-300">{{ props.locale }}</span>
        </button>
        <div v-show="props.showLangMenu" class="absolute right-0 bottom-full mb-2 w-40 bg-gray-800 border border-gray-700 rounded shadow-lg z-50">
          <ul>
            <li v-for="lang in props.languages" :key="lang.code">
              <button @click="selectLanguage(lang.code)" class="w-full text-left px-3 py-2 hover:bg-gray-700">{{ lang.label }}</button>
            </li>
          </ul>
        </div>
      </div>
      <div class="relative">
        <button @click="toggleSettingsMenu" class="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-700" :title="props.text.settings">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317a1 1 0 01.35-1.954h2.65a1 1 0 01.35 1.954l-.563 1.126a7.97 7.97 0 012.084 1.206l1.126-.563a1 1 0 011.354.447l1.325 2.297a1 1 0 01-.447 1.354l-1.126.563c.139.676.212 1.379.212 2.094s-.073 1.418-.212 2.094l1.126.563a1 1 0 01.447 1.354l-1.325 2.297a1 1 0 01-1.354.447l-1.126-.563a7.97 7.97 0 01-2.084 1.206l.563 1.126a1 1 0 01-.35 1.954h-2.65a1 1 0 01-.35-1.954l.563-1.126a7.97 7.97 0 01-2.084-1.206l-1.126.563a1 1 0 01-1.354-.447L4.5 17.61a1 1 0 01.447-1.354l1.126-.563A7.987 7.987 0 015.86 13c0-.715.073-1.418.212-2.094l-1.126-.563A1 1 0 014.5 8.989l1.325-2.297a1 1 0 011.354-.447l1.126.563a7.97 7.97 0 012.084-1.206l-.563-1.126z" />
          </svg>
          <span class="text-xs text-gray-300">{{ props.text.settings }}</span>
        </button>
        <div v-show="showSettingsMenu" class="absolute right-0 bottom-full mb-2 w-56 bg-gray-800 border border-gray-700 rounded shadow-lg z-50">
          <ul>
            <li class="flex items-center justify-between px-3 py-2">
              <span>{{ props.text.restoreSession }}</span>
              <button @click="toggleRestoreSession" class="ml-2 inline-flex items-center w-10 h-5 rounded-full"
                :class="props.restoreSessionEnabled ? 'bg-blue-600' : 'bg-gray-600'">
                <span class="h-4 w-4 bg-white rounded-full transform transition"
                  :class="props.restoreSessionEnabled ? 'translate-x-5' : 'translate-x-1'" />
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
