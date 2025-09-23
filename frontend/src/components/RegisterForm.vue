<template>
  <div class="register-form">
    <h2>Регистрация в F1 Forum</h2>
    <form @submit.prevent="handleRegister">
      <div class="form-group">
        <label>Имя пользователя:</label>
        <input 
          v-model="form.username" 
          type="text" 
          required
          :class="{ 'error-input': errors.username }"
          @blur="validateUsername"
        >
        <div v-if="errors.username" class="error-text">{{ errors.username }}</div>
      </div>

      <div class="form-group">
        <label>Email:</label>
        <input 
          v-model="form.email" 
          type="email" 
          required
          :class="{ 'error-input': errors.email }"
          @blur="validateEmail"
          @input="clearError('email')"
        >
        <div v-if="errors.email" class="error-text">{{ errors.email }}</div>
      </div>

      <div class="form-group">
        <label>Пароль:</label>
        <input 
          v-model="form.password" 
          :type="showPassword ? 'text' : 'password'" 
          required
          :class="{ 'error-input': errors.password }"
          @blur="validatePassword"
          @input="clearError('password')"
        >
        <span class="password-toggle" @click="showPassword = !showPassword">
          {{ showPassword ? '🙈' : '👁️' }}
        </span>
        
        <div v-if="errors.password" class="error-text">{{ errors.password }}</div>
        
        <!-- Подсказки для пароля -->
        <div class="password-hints">
          <div :class="{ 'valid': passwordStrength.length }">✓ Минимум 8 символов</div>
          <div :class="{ 'valid': passwordStrength.uppercase }">✓ Заглавная буква</div>
          <div :class="{ 'valid': passwordStrength.lowercase }">✓ Строчная буква</div>
          <div :class="{ 'valid': passwordStrength.number }">✓ Цифра</div>
          <div :class="{ 'valid': passwordStrength.special }">✓ Спецсимвол (!@#$%^&*)</div>
        </div>
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

      <button type="submit" :disabled="loading || !isFormValid">
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
import { ref, computed, reactive } from 'vue';
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
const showPassword = ref(false);
const errors = reactive({
  username: '',
  email: '',
  password: ''
});

// Валидация email
const validateEmail = () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!form.value.email) {
    errors.email = 'Email обязателен';
  } else if (!emailRegex.test(form.value.email)) {
    errors.email = 'Введите корректный email';
  } else {
    errors.email = '';
  }
};

// Валидация имени пользователя
const validateUsername = () => {
  if (!form.value.username) {
    errors.username = 'Имя пользователя обязательно';
  } else if (form.value.username.length < 3) {
    errors.username = 'Минимум 3 символа';
  } else if (!/^[a-zA-Z0-9_]+$/.test(form.value.username)) {
    errors.username = 'Только латинские буквы, цифры и подчеркивание';
  } else {
    errors.username = '';
  }
};

// Валидация пароля
const validatePassword = () => {
  if (!form.value.password) {
    errors.password = 'Пароль обязателен';
    return;
  }

  const minLength = form.value.password.length >= 8;
  const hasUppercase = /[A-Z]/.test(form.value.password);
  const hasLowercase = /[a-z]/.test(form.value.password);
  const hasNumber = /[0-9]/.test(form.value.password);
  const hasSpecial = /[!@#$%^&*]/.test(form.value.password);

  let errorMsg = '';
  if (!minLength) errorMsg += 'Минимум 8 символов. ';
  if (!hasUppercase) errorMsg += 'Заглавная буква. ';
  if (!hasLowercase) errorMsg += 'Строчная буква. ';
  if (!hasNumber) errorMsg += 'Цифра. ';
  if (!hasSpecial) errorMsg += 'Спецсимвол (!@#$%^&*). ';

  errors.password = errorMsg;
};

// Сила пароля для подсказок
const passwordStrength = computed(() => {
  return {
    length: form.value.password.length >= 8,
    uppercase: /[A-Z]/.test(form.value.password),
    lowercase: /[a-z]/.test(form.value.password),
    number: /[0-9]/.test(form.value.password),
    special: /[!@#$%^&*]/.test(form.value.password)
  };
});

// Проверка валидности формы
const isFormValid = computed(() => {
  return form.value.username && 
         form.value.email && 
         form.value.password && 
         !errors.username && 
         !errors.email && 
         !errors.password;
});

const clearError = (field) => {
  errors[field] = '';
};

const handleRegister = async () => {
  // Проверяем валидацию перед отправкой
  validateUsername();
  validateEmail();
  validatePassword();

  if (!isFormValid.value) {
    error.value = 'Пожалуйста, исправьте ошибки в форме';
    return;
  }

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
  margin-bottom: 20px;
  position: relative;
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
  font-size: 14px;
}

.error-input {
  border-color: #e10600;
}

.error-text {
  color: #e10600;
  font-size: 12px;
  margin-top: 5px;
}

.password-toggle {
  position: absolute;
  right: 10px;
  top: 35px;
  cursor: pointer;
  font-size: 16px;
}

.password-hints {
  margin-top: 10px;
  font-size: 12px;
}

.password-hints div {
  color: #999;
  margin-bottom: 3px;
}

.password-hints .valid {
  color: green;
}

button {
  width: 100%;
  padding: 10px;
  background-color: #e10600;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.error-message {
  color: #e10600;
  margin-top: 10px;
  padding: 10px;
  background-color: #ffe6e6;
  border: 1px solid #e10600;
  border-radius: 4px;
}

.success-message {
  color: green;
  margin-top: 10px;
  padding: 10px;
  background-color: #e6ffe6;
  border: 1px solid green;
  border-radius: 4px;
}
</style>
