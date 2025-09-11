<template>
  <div class="register-form">
    <h2>Регистрация в F1 Forum</h2>
    <form @submit.prevent="handleRegister">
      <div class="form-group">
        <label>Имя пользователя:</label>
        <input v-model="form.username" type="text" required>
      </div>

      <div class="form-group">
        <label>Email:</label>
        <input v-model="form.email" type="email" required>
      </div>

      <div class="form-group">
        <label>Пароль:</label>
        <input v-model="form.password" type="password" required>
      </div>

      <div class="form-group">
        <label>Любимая команда:</label>
        <select v-model="form.favorite_team">
          <option value="">Выберите команду</option>
          <option value="Ferrari">Ferrari</option>
          <option value="Red Bull">Red Bull</option>
          <option value="Mercedes">Mercedes</option>
          <option value="McLaren">McLaren</option>
          <option value="Aston Martin">Aston Martin</option>
        </select>
      </div>

      <div class="form-group">
        <label>Любимый пилот:</label>
        <input v-model="form.favorite_driver" type="text">
      </div>

      <button type="submit" :disabled="loading">
        {{ loading ? 'Регистрация...' : 'Зарегистрироваться' }}
      </button>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-if="success" class="success-message">
        Регистрация успешна! Перенаправляем...
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../stores/authStore';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const form = ref({
  username: '',
  email: '',
  password: '',
  favorite_team: '',
  favorite_driver: ''
});

const loading = ref(false);
const error = ref('');
const success = ref(false);

const handleRegister = async () => {
  loading.value = true;
  error.value = '';

  try {
    await authStore.register(form.value);
    success.value = true;
    setTimeout(() => {
      router.push('/');
    }, 2000);
  } catch (err) {
    error.value = err.error || 'Ошибка регистрации';
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