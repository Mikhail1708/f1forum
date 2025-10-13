import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue')
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { guestOnly: true }
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('../views/RegisterView.vue'),
    meta: { guestOnly: true }
  },
  {
    path: '/discussions',
    name: 'discussions',
    component: () => import('../views/DiscussionsView.vue')
  },
  {
    path: '/discussions/:id',
    name: 'discussion',
    component: () => import('../views/DiscussionView.vue')
  },
  {
    path: '/races',
    name: 'races',
    component: () => import('../views/RacesView.vue')
  },
  {
    path: '/races/:id',
    name: 'race-details',
    component: () => import('../views/RaceDetailsView.vue')
  },
  {
    path: '/drivers',
    name: 'drivers',
    component: () => import('../views/DriversView.vue')
  },
  {
    path: '/drivers/:id',
    name: 'driver-details',
    component: () => import('../views/DriverDetailsView.vue')
  },
  {
    path: '/constructors',
    name: 'constructors',
    component: () => import('../views/ConstructorsView.vue')
  },
  {
    path: '/constructors/:id',
    name: 'constructor-details',
    component: () => import('../views/ConstructorDetailsView.vue')
  },
  {
    path: '/circuits',
    name: 'circuits',
    component: () => import('../views/CircuitsView.vue')
  },
  {
    path: '/predictions',
    name: 'predictions',
    component: () => import('../views/PredictionsView.vue'),
    meta: { requiresAuth: true }
  },
  {
  path: '/drivers/:id',
  name: 'DriverDetails',
  component: () => import('../views/DriverDetailsView.vue')
},
  {
    path: '/profile',
    name: 'profile',
    component: () => import('../views/ProfileView.vue'),
    meta: { requiresAuth: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  
  if (!authStore.isAuthenticated && localStorage.getItem('authToken')) {
    authStore.initialize();
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login');
  } else if (to.meta.guestOnly && authStore.isAuthenticated) {
    next('/');
  } else {
    next();
  }
});

export default router;