<!-- frontend/src/views/moderator/ModeratorLayout.vue -->
<template>
  <div class="moderator-layout">
    <header class="moderator-header">
      <div class="header-left">
        <h1>⚙️ F1 Forum Moderator</h1>
      </div>
      <div class="header-right">
        <span>Модератор: {{ authStore.user?.username }}</span>
        <button @click="logout" class="logout-btn">Выйти</button>
      </div>
    </header>

    <div class="moderator-container">
      <aside class="moderator-sidebar">
        <nav class="sidebar-nav">
          <router-link to="/moderator/dashboard" class="nav-item">
            📊 Дашборд
          </router-link>
          <router-link to="/moderator/content" class="nav-item">
            📝 Управление контентом
          </router-link>
          <router-link to="/moderator/reports" class="nav-item">
            🚨 Жалобы
          </router-link>
          <router-link to="/moderator/users" class="nav-item">
            👥 Пользователи
          </router-link>
        </nav>
      </aside>

      <main class="moderator-main">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '../../stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const logout = () => {
  authStore.logout();
  router.push('/');
};
</script>

<style scoped>
.moderator-layout {
  min-height: 100vh;
  background: #f8f9fa;
}

.moderator-header {
  background: #3498db;
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.header-left h1 {
  margin: 0;
  font-size: 1.5rem;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logout-btn {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.moderator-container {
  display: flex;
  min-height: calc(100vh - 80px);
}

.moderator-sidebar {
  width: 250px;
  background: white;
  border-right: 1px solid #e0e0e0;
}

.sidebar-nav {
  padding: 1rem 0;
}

.nav-item {
  display: block;
  padding: 1rem 2rem;
  color: #333;
  text-decoration: none;
  border-left: 4px solid transparent;
  transition: all 0.3s;
}

.nav-item:hover {
  background: #f8f9fa;
  border-left-color: #3498db;
}

.nav-item.router-link-active {
  background: #e3f2fd;
  border-left-color: #3498db;
  color: #3498db;
  font-weight: bold;
}

.moderator-main {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}
</style>