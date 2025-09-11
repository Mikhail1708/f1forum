<template>
  <div class="login-form">
    <h2>Вход в F1 Forum</h2>
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label>Email:</label>
        <input v-model="credentials.email" type="email" required>
      </div>
      <div class="form-group">
        <label>Пароль:</label>
        <input v-model="credentials.password" type="password" required>
      </div>
      <button type="submit" :disabled="loading">{{ loading ? 'Вход...' : 'Войти' }}</button>
      <div v-if="error" class="error-message">{{ error }}</div>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../stores/authStore';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const credentials = ref({ email: '', password: '' });
const loading = ref(false);
const error = ref('');

const handleLogin = async () => {
  loading.value = true;
  error.value = '';
  try {
    await authStore.login(credentials.value);
    router.push('/'); // Перенаправление на главную после входа
  } catch (err) {
    error.value = err.error || 'Ошибка входа';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.register-form {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input, select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

button {
  width: 100%;
  padding: 10px;
  background-color: #e10600;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.error-message {
  color: #e10600;
  margin-top: 10px;
}

.success-message {
  color: green;
  margin-top: 10px;
}
</style>