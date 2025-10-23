import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

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
    path: '/discussions/:id',
    name: 'discussion',
    component: () => import('../views/DiscussionView.vue')
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
    path: '/predictions',
    name: 'predictions',
    component: () => import('../views/PredictionsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('../views/ProfileView.vue'),
    meta: { requiresAuth: true }
  },

  // Админ-панель
  {
    path: '/admin',
    component: () => import('../views/admin/AdminLayout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      // Дашборд
      {
        path: 'dashboard',
        name: 'admin-dashboard',
        component: () => import('../views/admin/AdminDashboard.vue')
      },
      // Пользователи
      {
        path: 'users',
        name: 'admin-users', 
        component: () => import('../views/admin/UserManagement.vue')
      },
      // Контент
      {
        path: 'content',
        name: 'admin-content',
        component: () => import('../views/admin/ContentManagement.vue')
      },
      // Система
      {
        path: 'system',
        name: 'admin-system',
        component: () => import('../views/admin/SystemSettings.vue')
      },
      // Бэкапы
      {
        path: 'backups',
        name: 'admin-backups',
        component: () => import('../views/admin/BackupManagement.vue')
      },
      // Редирект с /admin на /admin/dashboard
      {
        path: '',
        redirect: { name: 'admin-dashboard' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  // Инициализация store если токен есть в localStorage
  if (!authStore.isAuthenticated && localStorage.getItem('authToken')) {
    authStore.initialize()
  }

  // Проверка авторизации для защищенных маршрутов
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } 
  // Проверка прав администратора для админ-маршрутов
  else if (to.meta.requiresAdmin && (!authStore.isAuthenticated || !authStore.isAdmin)) {
    next('/')
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