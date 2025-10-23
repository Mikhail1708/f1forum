<template>
  <div class="profile">
    <h1>Профиль пользователя</h1>
    <div v-if="authStore.user" class="user-info">
      <p><strong>Имя пользователя:</strong> {{ authStore.user.username }}</p>
      <p><strong>Email:</strong> {{ authStore.user.email }}</p>
      <p><strong>Роль:</strong> {{ authStore.user.role }}</p>
      <p><strong>Администратор:</strong> {{ authStore.isAdmin ? 'Да' : 'Нет' }}</p>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
</script>

<style scoped>
.profile-view {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
}

.profile-info {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.logout-btn {
  background: #e10600;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}
</style>