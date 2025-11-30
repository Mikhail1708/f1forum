// frontend/src/main.js
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';


const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

app.mount('#app');
// Добавьте в main.js или в самый верх router/index.js
router.afterEach((to, from) => {
  console.log('🌍 ACTUAL ROUTE AFTER NAVIGATION:', to.path);
  console.log('Previous route:', from.path);
});