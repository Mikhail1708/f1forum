import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../components/LoginForm.vue')
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('../components/RegisterForm.vue')
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;