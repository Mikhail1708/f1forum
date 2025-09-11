// src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router' // Если у вас есть роутер

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(router) // Если используете роутер
app.mount('#app')