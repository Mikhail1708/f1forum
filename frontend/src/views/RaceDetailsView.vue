<template>
  <div class="race-details-view">
    <button @click="$router.push('/races')" class="back-btn">← Назад к гонкам</button>
    
    <div class="race-header" v-if="race">
      <h1>{{ race.raceName }}</h1>
      <div class="race-meta">
        <p><strong>Трасса:</strong> {{ race.Circuit.circuitName }}</p>
        <p><strong>Место:</strong> {{ race.Circuit.Location.locality }}, {{ race.Circuit.Location.country }}</p>
        <p><strong>Дата:</strong> {{ formatDate(race.date) }}</p>
        <p><strong>Раунд:</strong> {{ race.round }}</p>
      </div>
    </div>

    <!-- Индикатор тестовых данных -->
    <div v-if="showMockData" class="mock-warning">
      ⚠️ Используются тестовые данные
    </div>

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
          :key="result.position"
          class="table-row"
          :class="{
            'q3-row': result.Q3,
            'q2-row': result.Q2 && !result.Q3,
            'q1-row': !result.Q2 && !result.Q3
          }"
        >
          <span class="position">{{ result.position }}</span>
          <span class="driver">
            <span class="driver-name">{{ result.Driver.givenName }} {{ result.Driver.familyName }}</span>
            <span class="driver-code">{{ result.Driver.code }}</span>
          </span>
          <span class="constructor">{{ result.Constructor.name }}</span>
          <span class="time" :class="{ 'fastest-time': isFastestTime(result.Q1, 'Q1') }">{{ result.Q1 || '-' }}</span>
          <span class="time" :class="{ 'fastest-time': isFastestTime(result.Q2, 'Q2') }">{{ result.Q2 || '-' }}</span>
          <span class="time" :class="{ 'fastest-time': isFastestTime(result.Q3, 'Q3') }">{{ result.Q3 || '-' }}</span>
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
          :key="result.position"
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
          <span class="time">{{ result.Time?.time || getGapFromPosition(result.position) }}</span>
          <span class="points">{{ result.points }}</span>
          <span class="status" :class="getStatusClass(result.status)">
            {{ getStatusText(result.status) }}
          </span>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading">Загрузка результатов...</div>
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
const showMockData = ref(false);

// Вычисляемое свойство для определения, используем ли мы mock данные
const isUsingMockData = computed(() => {
  return showMockData.value;
});

onMounted(async () => {
  const raceId = route.params.id;
  
  try {
    loading.value = true;
    
    // Получаем информацию о гонке
    const calendar = await f1Api.getCalendar();
    race.value = calendar.find(r => r.round === raceId);
    
    if (race.value) {
      const season = race.value.season || 'current';
      
      const [qualifying, raceRes] = await Promise.all([
        f1Api.getQualifyingResults(raceId, season),
        f1Api.getRaceResults(raceId, season)
      ]);
      
      qualifyingResults.value = qualifying;
      raceResults.value = raceRes;
      
      // Проверяем, используем ли мы mock данные
      if (raceId === '18' && (qualifying.length > 0 || raceRes.length > 0)) {
        showMockData.value = true;
      }
    }
    
  } catch (error) {
    console.error('Error loading race details:', error);
    // При ошибке пробуем загрузить mock данные
    if (raceId === '18') {
      qualifyingResults.value = f1Api.getMockQualifyingResults();
      raceResults.value = f1Api.getMockRaceResults();
      showMockData.value = true;
    }
  } finally {
    loading.value = false;
  }
});

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('ru-RU');
};

const getStatusClass = (status) => {
  if (status === 'Finished') return 'status-finished';
  if (status.includes('Lap')) return 'status-laps';
  return 'status-dnf';
};

const getStatusText = (status) => {
  if (status === 'Finished') return 'Финиш';
  if (status.includes('Lap')) return status;
  return 'Сход';
};

const getGapFromPosition = (position) => {
  const gaps = {
    '1': '',
    '2': '+2.345',
    '3': '+5.678', 
    '4': '+8.912',
    '5': '+12.345',
    '6': '+15.678',
    '7': '+19.012',
    '8': '+22.345',
    '9': '+25.678',
    '10': '+29.012'
  };
  return gaps[position] || '+1 круг';
};

const isFastestTime = (time, session) => {
  if (!time) return false;
  
  const fastestTimes = {
    'Q1': '1:32.100',
    'Q2': '1:31.500', 
    'Q3': '1:31.200'
  };
  
  return time === fastestTimes[session];
};
</script>

<style scoped>
.mock-warning {
  background: #fff3cd;
  color: #856404;
  padding: 10px;
  border-radius: 4px;
  text-align: center;
  margin-bottom: 1rem;
  border: 1px solid #ffeaa7;
}

.qualifying-header {
  background: #006f62 !important;
}

.race-header {
  background: #e10600 !important;
}

.q3-row {
  background: #f8fff0 !important;
}

.q2-row {
  background: #f0f8ff !important;
}

.q1-row {
  background: #fff8f0 !important;
}

.fastest-time {
  color: #e10600;
  font-weight: bold;
}

.driver {
  flex-direction: column;
  align-items: flex-start !important;
}

.driver-name {
  font-weight: 500;
}

.driver-code {
  font-size: 0.8rem;
  color: #666;
  margin-top: 2px;
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
}

.table-header {
  display: grid;
  grid-template-columns: 60px 1fr 150px 100px 80px 100px;
  gap: 1px;
  background: #e10600;
  color: white;
  font-weight: bold;
}

.table-header span {
  padding: 1rem;
  text-align: center;
}

.table-row {
  display: grid;
  grid-template-columns: 60px 1fr 150px 100px 80px 100px;
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
  padding: 4px 8px;
  border-radius: 4px;
  text-align: center;
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

/* Подиумные места */
.podium-1 {
  background: linear-gradient(135deg, #ffd700, #fff8dc) !important;
}

.podium-2 {
  background: linear-gradient(135deg, #c0c0c0, #f0f0f0) !important;
}

.podium-3 {
  background: linear-gradient(135deg, #cd7f32, #f8e0c0) !important;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #666;
  font-size: 1.1rem;
}

.no-data {
  text-align: center;
  padding: 3rem;
  color: #666;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

/* Адаптивность */
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