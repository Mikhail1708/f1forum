<template>
  <div class="admin-layout">
    <header class="admin-header">
      <div class="header-left">
        <h1>🏎️ F1 Forum Admin</h1>
      </div>
      <div class="header-right">
        <span>Привет, {{ authStore.user?.username }}</span>
        <button @click="logout" class="logout-btn">Выйти</button>
      </div>
    </header>

    <div class="admin-container">
      <aside class="admin-sidebar">
        <nav class="sidebar-nav">
          <router-link to="/admin/dashboard" class="nav-item">
            📊 Дашборд
          </router-link>
          <router-link to="/admin/users" class="nav-item">
            👥 Пользователи
          </router-link>
          <router-link to="/admin/content" class="nav-item">
            📝 Контент
          </router-link>
          <router-link to="/admin/backups" class="nav-item">
            💾 Бэкапы
          </router-link>
          <router-link to="/admin/system" class="nav-item">
            ⚙️ Система
          </router-link>
        </nav>
      </aside>

      <main class="admin-main">
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
.admin-layout {
  min-height: 100vh;
  background: #f5f5f5;
}

.admin-header {
  background: #2c3e50;
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

.admin-container {
  display: flex;
  min-height: calc(100vh - 80px);
}

.admin-sidebar {
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
  border-left-color: #e10600;
  color: #e10600;
  font-weight: bold;
}

.admin-main {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}
</style>