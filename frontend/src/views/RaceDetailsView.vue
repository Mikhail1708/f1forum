<template>
  <div class="race-details-view">
    <button @click="$router.push('/races')" class="back-btn">← Назад к гонкам</button>
    <div class="race-header" v-if="race">
      <h1>{{ race.raceName }}</h1>
      <div class="race-meta">
        <p><strong>Трасса:</strong> {{ race.Circuit?.circuitName || 'Не указана' }}</p>
        <p><strong>Место:</strong> {{ race.Circuit?.Location?.locality }}, {{ race.Circuit?.Location?.country }}</p>
        <p><strong>Дата:</strong> {{ formatDate(race.date) }}</p>
        <p><strong>Раунд:</strong> {{ race.round }}</p>
        <p><strong>Сезон:</strong> {{ race.season }}</p>
      </div>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-if="loading" class="loading">Загрузка результатов...</div>

    <div v-else-if="!qualifyingResults.length && !raceResults.length" class="no-data">
      <p>Результаты для этой гонки пока недоступны в API</p>
      <p class="api-info">Проверьте актуальность данных по адресу:<br>
        <a :href="apiQualifyingUrl" target="_blank">{{ apiQualifyingUrl }}</a><br>
        <a :href="apiRaceUrl" target="_blank">{{ apiRaceUrl }}</a>
      </p>
    </div>

    <div v-else>
      <!-- Результаты квалификации -->
      <div class="results-section" v-if="qualifyingResults.length">
        <h2>🏎️ Результаты квалификации</h2>
        <div class="results-table">
          <div class="table-header qualifying-header">
            <span>Поз</span>
            <span>Пилот</span>
            <span>Команда</span>
            <span>Q1</span>
            <span>Q2</span>
            <span>Q3</span>
          </div>
          <div 
            v-for="result in qualifyingResults" 
            :key="`qual-${result.position}-${result.Driver.driverId}`"
            class="table-row"
          >
            <span class="position">{{ result.position }}</span>
            <span class="driver">
              <span class="driver-name">{{ result.Driver.givenName }} {{ result.Driver.familyName }}</span>
              <span class="driver-code">{{ result.Driver.code }}</span>
            </span>
            <span class="constructor">{{ result.Constructor.name }}</span>
            <span class="time">{{ result.Q1 || '-' }}</span>
            <span class="time">{{ result.Q2 || '-' }}</span>
            <span class="time">{{ result.Q3 || '-' }}</span>
          </div>
        </div>
      </div>

      <!-- Результаты гонки -->
      <div class="results-section" v-if="raceResults.length">
        <h2>🏆 Результаты гонки</h2>
        <div class="results-table">
          <div class="table-header race-header">
            <span>Поз</span>
            <span>Пилот</span>
            <span>Команда</span>
            <span>Время</span>
            <span>Очки</span>
            <span>Статус</span>
          </div>
          <div 
            v-for="result in raceResults" 
            :key="`race-${result.position}-${result.Driver.driverId}`"
            class="table-row"
            :class="{
              'podium-1': result.position === '1',
              'podium-2': result.position === '2', 
              'podium-3': result.position === '3'
            }"
          >
            <span class="position">{{ result.position }}</span>
            <span class="driver">
              <span class="driver-name">{{ result.Driver.givenName }} {{ result.Driver.familyName }}</span>
              <span class="driver-code">{{ result.Driver.code }}</span>
            </span>
            <span class="constructor">{{ result.Constructor.name }}</span>
            <span class="time">{{ result.Time?.time || '-' }}</span>
            <span class="points">{{ result.points }}</span>
            <span class="status" :class="getStatusClass(result.status)">
              {{ getStatusText(result.status) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import f1Api from '../services/f1Api';

const route = useRoute();
const race = ref(null);
const qualifyingResults = ref([]);
const raceResults = ref([]);
const loading = ref(true);
const error = ref('');
const debug = ref(true);

// Вычисляемые свойства для URL API
const apiQualifyingUrl = computed(() => {
  if (!race.value) return '';
  return `https://api.jolpi.ca/ergast/f1/${race.value.season}/${race.value.round}/qualifying.json`;
});

const apiRaceUrl = computed(() => {
  if (!race.value) return '';
  return `https://api.jolpi.ca/ergast/f1/${race.value.season}/${race.value.round}/results.json`;
});

// Основная функция загрузки данных
const loadRaceData = async () => {
  const raceId = route.params.id;
  console.log('🔄 Загрузка деталей гонки, раунд:', raceId);
  
  try {
    loading.value = true;
    error.value = '';
    
    // Получаем календарь текущего сезона
    console.log('📅 Получение календаря...');
    const calendar = await f1Api.getCalendar();
    console.log('📅 Календарь загружен:', calendar.length, 'гонок');
    
    // Находим гонку
    race.value = calendar.find(r => r.round === raceId);
    console.log('🎯 Найдена гонка:', race.value);
    
    if (!race.value) {
      error.value = 'Гонка не найдена';
      loading.value = false;
      return;
    }
    
    // Загружаем реальные данные из API
    console.log('🌐 Запрос реальных данных...');
    const [qualifying, raceRes] = await Promise.all([
      f1Api.getQualifyingResults(raceId, race.value.season),
      f1Api.getRaceResults(raceId, race.value.season)
    ]);
    
    console.log('✅ Квалификация:', qualifying.length, 'результатов');
    console.log('✅ Гонка:', raceRes.length, 'результатов');
    
    qualifyingResults.value = qualifying;
    raceResults.value = raceRes;
    
    if (qualifying.length === 0 && raceRes.length === 0) {
      console.log('⚠️ API не вернул данных для этой гонки');
    }
    
  } catch (err) {
    console.error('❌ Ошибка загрузки:', err);
    error.value = 'Ошибка загрузки данных из API. ' + (err.message || 'Попробуйте обновить страницу.');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadRaceData();
});

const formatDate = (dateString) => {
  if (!dateString) return 'Дата не указана';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (e) {
    return dateString;
  }
};

const getStatusClass = (status) => {
  if (status === 'Finished') return 'status-finished';
  if (status && status.includes('Lap')) return 'status-laps';
  return 'status-dnf';
};

const getStatusText = (status) => {
  if (status === 'Finished') return 'Финиш';
  if (status && status.includes('Lap')) return status;
  return 'Сход';
};
</script>

<style scoped>
.debug-info {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-family: monospace;
  font-size: 0.8rem;
  color: #666;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  border: 1px solid #f5c6cb;
}

.no-data {
  text-align: center;
  padding: 3rem;
  color: #666;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.api-info {
  margin-top: 1rem;
  font-size: 0.9rem;
}

.api-info a {
  color: #e10600;
  word-break: break-all;
}

.race-details-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.back-btn {
  background: #666;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 2rem;
}

.race-header {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
  text-align: center;
}

.race-header h1 {
  color: #e10600;
  margin: 0 0 1rem 0;
}

.race-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.race-meta p {
  margin: 0;
  color: #555;
}

.results-section {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.results-section h2 {
  color: #e10600;
  margin: 0 0 1.5rem 0;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 0.5rem;
}

.results-table {
  display: grid;
  gap: 1px;
  background: #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
}

.table-header {
  display: grid;
  grid-template-columns: 60px 1fr 150px 100px 100px 100px;
  gap: 1px;
  background: #e10600;
  color: white;
  font-weight: bold;
}

.qualifying-header {
  background: #006f62 !important;
}

.table-header span {
  padding: 1rem;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.table-row {
  display: grid;
  grid-template-columns: 60px 1fr 150px 100px 100px 100px;
  gap: 1px;
  background: white;
  transition: background-color 0.3s;
}

.table-row:hover {
  background: #f8f9fa;
}

.table-row span {
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.position {
  font-weight: bold;
  color: #333;
}

.driver {
  flex-direction: column;
  align-items: flex-start !important;
  justify-content: center !important;
}

.driver-name {
  font-weight: 500;
}

.driver-code {
  font-size: 0.8rem;
  color: #666;
  margin-top: 2px;
}

.constructor {
  color: #666;
}

.time {
  font-family: 'Courier New', monospace;
  font-weight: bold;
}

.points {
  font-weight: bold;
  color: #e10600;
}

.status {
  font-size: 0.8rem;
  padding: 6px 10px;
  border-radius: 4px;
  text-align: center;
  font-weight: 500;
}

.status-finished {
  background: #d4edda;
  color: #155724;
}

.status-laps {
  background: #fff3cd;
  color: #856404;
}

.status-dnf {
  background: #f8d7da;
  color: #721c24;
}

.podium-1 {
  background: linear-gradient(135deg, #ffd700, #fff8dc) !important;
  font-weight: bold;
}

.podium-2 {
  background: linear-gradient(135deg, #c0c0c0, #f0f0f0) !important;
  font-weight: bold;
}

.podium-3 {
  background: linear-gradient(135deg, #cd7f32, #f8e0c0) !important;
  font-weight: bold;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #666;
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .table-header,
  .table-row {
    grid-template-columns: 50px 1fr 120px;
    font-size: 0.9rem;
  }
  
  .time:nth-child(4),
  .time:nth-child(5),
  .time:nth-child(6),
  .points,
  .status {
    display: none;
  }
  
  .race-meta {
    grid-template-columns: 1fr;
  }
}
</style>