import { createRouter, createWebHistory } from 'vue-router'

// Minimal route configuration to avoid "No match found for location" warnings
const routes = [
    {
        path: '/',
        name: 'home',
        // A no-op route; the main UI is provided by App.vue directly
        component: {
            template: '<div />'
        }
    }
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
})

export default router
