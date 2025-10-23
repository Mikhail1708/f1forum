<template>
  <div id="app">
    <NavBar />
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useAuthStore } from './stores/auth';
import NavBar from './components/NavBar.vue';

const authStore = useAuthStore();

// При загрузке приложения пытаемся получить профиль пользователя, если есть токен
onMounted(() => {
  console.log('App mounted - User:', authStore.user)
  console.log('App mounted - isAdmin:', authStore.isAdmin)
  console.log('App mounted - isAuthenticated:', authStore.isAuthenticated)
  console.log('LocalStorage user:', localStorage.getItem('user'))
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Arial', sans-serif;
  background-color: #f4f4f4;
  color: #333;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

/* Общие стили для форм */
.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input, select, textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}

button {
  padding: 10px 20px;
  background-color: #e10600;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #c10500;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.error-message {
  color: #e10600;
  margin-top: 10px;
  padding: 8px;
  background-color: #ffe6e6;
  border: 1px solid #e10600;
  border-radius: 4px;
}

.success-message {
  color: green;
  margin-top: 10px;
  padding: 8px;
  background-color: #e6ffe6;
  border: 1px solid green;
  border-radius: 4px;
}

/* Стили для карточек */
.card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Адаптивность */
@media (max-width: 768px) {
  .main-content {
    padding: 10px;
  }
  
  .nav-links {
    flex-direction: column;
    gap: 10px;
  }
}
</style>