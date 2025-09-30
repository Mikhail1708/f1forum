<template>
  <nav class="navbar">
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
        <router-link to="/predictions" class="nav-link">Мои прогнозы</router-link>
        <router-link to="/profile" class="nav-link">Профиль</router-link>
        <span class="user-greeting">Привет, {{ authStore.user?.username }}</span>
        <button @click="handleLogout" class="logout-btn">Выйти</button>
      </template>
      
      <template v-else>
        <router-link to="/login" class="nav-link">Войти</router-link>
        <router-link to="/register" class="nav-link register-btn">Регистрация</router-link>
      </template>
    </div>
  </nav>
</template>

<script setup>
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const handleLogout = () => {
  authStore.logout();
  router.push('/');
};
</script>

<style scoped>
/* Стили остаются такими же как в предыдущей версии */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #e10600, #b30500);
  color: white;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
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
  .navbar {
    flex-direction: column;
    gap: 1rem;
  }
  
  .nav-links {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>