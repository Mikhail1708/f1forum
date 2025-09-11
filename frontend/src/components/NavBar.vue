<template>
  <nav>
    <div class="nav-brand">
      <router-link to="/">F1 Forum</router-link>
    </div>
    <div class="nav-links">
      <template v-if="authStore.isAuthenticated">
        <span>Привет, {{ authStore.user?.username }}</span>
        <button @click="handleLogout">Выйти</button>
      </template>
      <template v-else>
        <router-link to="/login">Войти</router-link>
        <router-link to="/register">Регистрация</router-link>
      </template>
    </div>
  </nav>
</template>

<script setup>
import { useAuthStore } from '../stores/authStore';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const handleLogout = () => {
  authStore.logout();
  router.push('/');
};
</script>

<style scoped>
nav {
  display: flex;
  justify-content: space-between;
  padding: 1rem;
  background-color: #e10600;
  color: white;
}
.nav-links a, .nav-links button {
  color: white;
  margin-left: 1rem;
  text-decoration: none;
}
</style>