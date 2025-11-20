// frontend/src/router/index.js
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

  // Админ-панель
  {
    path: '/admin',
    component: () => import('../views/admin/AdminLayout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    redirect: '/admin/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('../views/admin/AdminDashboard.vue')
      },
      {
        path: 'users',
        name: 'UserManagement',
        component: () => import('../views/admin/UserManagement.vue')
      },
      {
        path: 'content',
        name: 'ContentManagement',
        component: () => import('../views/admin/ContentManagement.vue')
      },
      {
        path: 'backups',
        name: 'BackupManagement',
        component: () => import('../views/admin/BackupManagement.vue')
      },
      {
        path: 'system',
        name: 'SystemSettings',
        component: () => import('../views/admin/SystemSettings.vue')
      }
    ]
  },
  

// Модераторские роуты
{
  path: '/moderator',
  component: () => import('../views/moderator/ModeratorLayout.vue'),
  meta: { requiresAuth: true, requiresModerator: true },
  redirect: '/moderator/dashboard',
  children: [
    {
      path: 'dashboard',
      name: 'ModeratorDashboard',
      component: () => import('../views/moderator/ModeratorDashboard.vue')
    },
    {
      path: 'content',
      name: 'ContentModeration',
      component: () => import('../views/moderator/ContentModeration.vue')
    },
    {
      path: 'users',
      name: 'ModeratorUserManagement',
      component: () => import('../views/moderator/UserManagement.vue')
    },
    {
      path: 'reports',
      name: 'ReportsManagement',
      component: () => import('../views/moderator/ReportsManagement.vue')
    }
  ]
},

  // Предсказания
  {
    path: '/predictions',
    name: 'predictions',
    component: () => import('../views/PredictionsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/prediction-form',
    name: 'prediction-form',
    component: () => import('../views/PredictionForm.vue'),
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

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const discussionsStore = useDiscussionsStore()
  
  // Проверяем аутентификацию только если есть токен
  if (authStore.token && !authStore.isAuthenticated) {
    try {
      await authStore.checkAuth()
    } catch (error) {
      console.error('Auth check failed:', error)
    }
  }

  // ОЧИСТКА ТЕКУЩЕГО ОБСУЖДЕНИЯ если уходим со страницы обсуждения
  if (from.name === 'discussion' && to.name !== 'discussion') {
    discussionsStore.clearCurrentDiscussion()
  }

  // Проверка авторизации для защищенных маршрутов
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
    return
  }

  // Проверка прав администратора для админ-панели
  if (to.meta.requiresAdmin && (!authStore.isAuthenticated || authStore.user?.role !== 'admin')) {
    next('/')
    return
  }

  // Проверка прав на модератора для модер-панели
if (to.meta.requiresModerator && (!authStore.isAuthenticated || 
    (authStore.user?.role !== 'moderator' && authStore.user?.role !== 'admin'))) {
  next('/');
  return;
}
  // Редирект для гостевых маршрутов если пользователь уже авторизован
  if (to.meta.guestOnly && authStore.isAuthenticated) {
    next('/')
    return
  }

  next()
})
// frontend/src/router/index.js - обновите навигационные хуки
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  
  // Проверяем аутентификацию только если есть токен
  if (authStore.token && !authStore.isAuthenticated) {
    try {
      await authStore.checkAuth();
    } catch (error) {
      console.error('Auth check failed:', error);
    }
  }

  // Проверка авторизации для защищенных маршрутов
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login');
    return;
  }

  // Проверка прав администратора для админ-панели
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    next('/');
    return;
  }

  // Проверка прав модератора для модераторской панели
  if (to.meta.requiresModerator && !authStore.isModerator) {
    next('/');
    return;
  }

  // Редирект для гостевых маршрутов если пользователь уже авторизован
  if (to.meta.guestOnly && authStore.isAuthenticated) {
    next('/');
    return;
  }

  next();
});
export default router