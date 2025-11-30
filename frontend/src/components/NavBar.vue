<!-- frontend/src/components/NavBar.vue (обновленная версия) -->
<template>
  <nav class="navbar">
    <div class="nav-container">
      <div class="nav-brand">
        <router-link to="/" class="brand-link">🏎️ F1 Forum</router-link>
      </div>
      
      <div class="nav-links">
        <router-link to="/" class="nav-link">Главная</router-link>
        <router-link to="/discussions" class="nav-link">💬 Обсуждения</router-link>
        <router-link to="/drivers" class="nav-link">Пилоты</router-link>
        <router-link to="/constructors" class="nav-link">Команды</router-link>
        <router-link to="/circuits" class="nav-link">Трассы</router-link>
        <router-link to="/races" class="nav-link">Гонки</router-link>
        
        <template v-if="authStore.isAuthenticated">
          <!-- Компонент уведомлений -->
          <NotificationBell />
          
          <router-link v-if="authStore.user?.role === 'moderator' || authStore.user?.role === 'admin'" 
                       to="/moderator/dashboard" class="nav-link moderator-link">
            🛡️ Модерация
          </router-link>
          
          <router-link v-if="authStore.isAdmin" to="/admin" class="nav-link admin-link">
            ⚙️ Админка
          </router-link>
          
          <router-link to="/profile" class="nav-link">Профиль</router-link>
          <span class="user-greeting">Привет, {{ authStore.user?.username }}</span>
          <button @click="handleLogout" class="logout-btn">Выйти</button>
        </template>
        
        <template v-else>
          <router-link to="/login" class="nav-link">Войти</router-link>
          <router-link to="/register" class="nav-link register-btn">Регистрация</router-link>
        </template>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
import { computed } from 'vue';
import NotificationBell from './NotificationBell.vue';

const authStore = useAuthStore();
const router = useRouter();

const isAdmin = computed(() => {
  return authStore.user?.role === 'admin';
});

const handleLogout = () => {
  authStore.logout();
  router.push('/');
};
</script>

<style scoped>
.navbar {
  background: linear-gradient(135deg, #e10600, #b30500);
  color: white;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  width: 100%; /* ЗАПОЛНЯЕМ ВСЮ ШИРИНУ */
}

.nav-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  max-width: 100%; /* УБИРАЕМ ОГРАНИЧЕНИЕ ПО ШИРИНЕ */
  margin: 0; /* УБИРАЕМ ЦЕНТРИРОВАНИЕ */
}

.brand-link {
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
  text-decoration: none;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.nav-link {
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.nav-link:hover {
  background-color: rgba(255,255,255,0.1);
}

.nav-link.router-link-active {
  background-color: rgba(255,255,255,0.2);
}

/* Стиль для ссылки админки */
.admin-link {
  background-color: #2c3e50;
  border: 1px solid #34495e;
}

.admin-link:hover {
  background-color: #34495e;
}

.register-btn {
  background-color: #006f62;
  border: 1px solid #00574e;
}

.logout-btn {
  background: transparent;
  color: white;
  border: 1px solid white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.logout-btn:hover {
  background-color: rgba(255,255,255,0.1);
}

.user-greeting {
  color: #ffeb3b;
  font-weight: 500;
}

@media (max-width: 768px) {
  .nav-container {
    flex-direction: column;
    gap: 1rem;
  }
  
  .nav-links {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>