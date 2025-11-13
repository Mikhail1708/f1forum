import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useDiscussionsStore } from '../stores/discussionsStore'

const routes = [
  // Публичные маршруты
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

  // Обсуждения
  {
    path: '/discussions',
    name: 'discussions',
    component: () => import('../views/DiscussionsView.vue')
  },
  {
    path: '/discussion/:id',
    name: 'discussion',
    component: () => import('../views/DiscussionView.vue'),
    props: true
  },

  // Гонки
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

  // Гонщики
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

  // Конструкторы
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

  // Трассы
  {
    path: '/circuits',
    name: 'circuits',
    component: () => import('../views/CircuitsView.vue')
  },
  {
    path: '/circuits/:id',
    name: 'CircuitDetails',
    component: () => import('../views/CircuitDetailsView.vue')
  },

  // Защищенные маршруты
  {
    path: '/profile',
    name: 'profile',
    component: () => import('../views/ProfileView.vue'),
    meta: { requiresAuth: true }
  },

  // Обработка 404
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const discussionsStore = useDiscussionsStore()
  
  // Инициализация store если токен есть в localStorage
  if (!authStore.isAuthenticated && localStorage.getItem('authToken')) {
    authStore.initialize()
  }

  // ОЧИСТКА ТЕКУЩЕГО ОБСУЖДЕНИЯ если уходим со страницы обсуждения
  if (from.name === 'discussion' && to.name !== 'discussion') {
    discussionsStore.clearCurrentDiscussion()
  }

  // Проверка авторизации для защищенных маршрутов
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  }
  // Редирект для гостевых маршрутов если пользователь уже авторизован
  else if (to.meta.guestOnly && authStore.isAuthenticated) {
    next('/')
  } 
  else {
    next()
  }
})

export default router