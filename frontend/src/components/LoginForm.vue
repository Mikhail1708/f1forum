<template>
  <form @submit.prevent="handleLogin" class="login-form">
    <div class="form-group">
      <label for="email">Email:</label>
      <input
        id="email"
        v-model="credentials.email"
        type="email"
        required
        placeholder="Введите ваш email"
      >
    </div>
    
    <div class="form-group">
      <label for="password">Пароль:</label>
      <input
        id="password"
        v-model="credentials.password"
        type="password"
        required
        placeholder="Введите ваш пароль"
      >
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <button type="submit" :disabled="loading" class="login-btn">
      {{ loading ? 'Вход...' : 'Войти' }}
    </button>

    <div class="debug-info" v-if="debug">
      <h4>Отладочная информация:</h4>
      <p>Email: {{ credentials.email }}</p>
      <p>Loading: {{ loading }}</p>
      <p>Error: {{ error }}</p>
    </div>
  </form>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const credentials = ref({
  email: 'admin@f1forum.com', //预设管理员邮箱方便测试
  password: 'admin123'
})
const loading = ref(false)
const error = ref('')
const debug = ref(true) // Включить отладочную информацию

const handleLogin = async () => {
  loading.value = true
  error.value = ''

  try {
    console.log('Attempting login with:', credentials.value)
    
    const result = await authStore.login(credentials.value)
    
    if (result.success) {
      console.log('Login successful, user:', authStore.user)
      console.log('Is admin:', authStore.isAdmin)
      console.log('Token in localStorage:', localStorage.getItem('authToken'))
      console.log('User in localStorage:', localStorage.getItem('user'))
      
      // Перенаправление на главную страницу
      router.push('/')
    } else {
      error.value = result.error || 'Ошибка входа'
      console.error('Login failed:', result.error)
    }
  } catch (err) {
    error.value = 'Произошла ошибка при входе'
    console.error('Login error:', err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-form {
  max-width: 400px;
  margin: 0 auto;
  padding: 2rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.form-group input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.login-btn {
  width: 100%;
  padding: 0.75rem;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
}

.login-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.error-message {
  color: #e74c3c;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background: #fdf2f2;
  border: 1px solid #e74c3c;
  border-radius: 4px;
}

.debug-info {
  margin-top: 2rem;
  padding: 1rem;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  font-size: 0.9rem;
}

.debug-info h4 {
  margin: 0 0 0.5rem 0;
  color: #6c757d;
}
</style>