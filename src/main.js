import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import itMessages from './assets/i18n/it'
import enMessages from './assets/i18n/en'

import App from './App.vue'
import router from './router'

import './assets/styles.css'

const app = createApp(App)

// Pinia
app.use(createPinia())

// i18n - minimal setup for future translations
const i18n = createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: {
        it: itMessages,
        en: enMessages
    }
})

app.use(i18n)
app.use(router)

app.mount('#app')
