<template>
  <div class="predictions-view">
    <div class="header">
      <h1>🏆 Мои прогнозы</h1>
      <p>Управляйте вашими прогнозами на гонки Формулы 1</p>
    </div>

    <div v-if="!authStore.isAuthenticated" class="auth-required">
      <h2>Требуется авторизация</h2>
      <p>Для просмотра и создания прогнозов необходимо войти в систему</p>
      <router-link to="/login" class="auth-btn">Войти</router-link>
    </div>

    <div v-else class="predictions-content">
      <!-- Активные прогнозы -->
      <div class="section">
        <h2>Активные прогнозы</h2>
        <div v-if="activePredictions.length" class="predictions-list">
          <div v-for="prediction in activePredictions" :key="prediction.id" class="prediction-card">
            <h3>Гран-при: {{ prediction.raceName }}</h3>
            <div class="prediction-details">
              <p><strong>Победитель:</strong> {{ prediction.p1_driver }}</p>
              <p><strong>Второе место:</strong> {{ prediction.p2_driver }}</p>
              <p><strong>Третье место:</strong> {{ prediction.p3_driver }}</p>
              <p><strong>Поул:</strong> {{ prediction.pole_driver }}</p>
              <p><strong>Лучший круг:</strong> {{ prediction.fastest_driver }}</p>
            </div>
            <div class="prediction-actions">
              <button @click="editPrediction(prediction)" class="edit-btn">Редактировать</button>
              <button @click="deletePrediction(prediction.id)" class="delete-btn">Удалить</button>
            </div>
          </div>
        </div>
        <div v-else class="no-predictions">
          <p>У вас нет активных прогнозов</p>
          <button @click="showCreateForm = true" class="create-btn">Создать первый прогноз</button>
        </div>
      </div>

      <!-- История прогнозов -->
      <div class="section">
        <h2>История прогнозов</h2>
        <div v-if="completedPredictions.length" class="predictions-list">
          <div v-for="prediction in completedPredictions" :key="prediction.id" class="prediction-card completed">
            <h3>Гран-при: {{ prediction.raceName }}</h3>
            <div class="prediction-result">
              <p><strong>Результат:</strong> {{ prediction.points }} очков</p>
              <p><strong>Статус:</strong> <span :class="prediction.status">{{ prediction.statusText }}</span></p>
            </div>
          </div>
        </div>
        <div v-else class="no-predictions">
          <p>Здесь будет история ваших завершенных прогнозов</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
const showCreateForm = ref(false);

// Заглушки данных - замени на реальные API вызовы
const activePredictions = ref([
  {
    id: 1,
    raceName: "Гран-при Бахрейна",
    p1_driver: "Макс Ферстаппен",
    p2_driver: "Шарль Леклер",
    p3_driver: "Льюис Хэмилтон",
    pole_driver: "Макс Ферстаппен",
    fastest_driver: "Шарль Леклер"
  }
]);

const completedPredictions = ref([]);

onMounted(() => {
  // Здесь будет загрузка прогнозов с API
  loadPredictions();
});

const loadPredictions = async () => {
  // TODO: Реализовать загрузку прогнозов с бэкенда
  console.log('Загрузка прогнозов...');
};

const editPrediction = (prediction) => {
  // TODO: Реализовать редактирование прогноза
  console.log('Редактирование прогноза:', prediction);
};

const deletePrediction = (predictionId) => {
  // TODO: Реализовать удаление прогноза
  if (confirm('Вы уверены, что хотите удалить этот прогноз?')) {
    activePredictions.value = activePredictions.value.filter(p => p.id !== predictionId);
  }
};
</script>

<style scoped>
.predictions-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
  background: linear-gradient(135deg, #e10600, #b30500);
  color: white;
  padding: 2rem;
  border-radius: 10px;
}

.auth-required {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.auth-btn {
  display: inline-block;
  background: #e10600;
  color: white;
  padding: 12px 24px;
  border-radius: 6px;
  text-decoration: none;
  margin-top: 1rem;
}

.section {
  background: white;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.section h2 {
  color: #e10600;
  margin-bottom: 1rem;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 0.5rem;
}

.predictions-list {
  display: grid;
  gap: 1rem;
}

.prediction-card {
  border: 2px solid #e10600;
  border-radius: 8px;
  padding: 1.5rem;
  background: #fafafa;
}

.prediction-card.completed {
  border-color: #006f62;
  background: #f8fffe;
}

.prediction-card h3 {
  margin: 0 0 1rem 0;
  color: #333;
}

.prediction-details p {
  margin: 0.5rem 0;
  color: #555;
}

.prediction-actions {
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
}

.edit-btn, .delete-btn, .create-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.edit-btn {
  background: #006f62;
  color: white;
}

.delete-btn {
  background: #dc3545;
  color: white;
}

.create-btn {
  background: #e10600;
  color: white;
  padding: 12px 24px;
}

.no-predictions {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.prediction-result {
  background: white;
  padding: 1rem;
  border-radius: 6px;
  margin-top: 1rem;
}
</style>