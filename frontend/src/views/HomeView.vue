<template>
  <div class="home-page">
    <!-- Заголовок -->
    <div class="header">
      <h1>F1 Forum - Формула 1</h1>
      <p>Актуальные новости, результаты и статистика</p>
    </div>

    <!-- Ближайший Гран-при -->
    <div class="section" v-if="nextRace">
      <h2>📅 Ближайший Гран-при</h2>
      <div class="race-card">
        <h3>{{ nextRace.raceName }}</h3>
        <div class="race-info">
          <p><strong>Трасса:</strong> {{ nextRace.Circuit.circuitName }}</p>
          <p><strong>Место:</strong> {{ nextRace.Circuit.Location.locality }}, {{ nextRace.Circuit.Location.country }}</p>
          <p><strong>Дата:</strong> {{ formatDate(nextRace.date) }}</p>
          <p><strong>Раунд:</strong> {{ nextRace.round }}</p>
        </div>
        <div class="countdown" v-if="nextRace.date">
          До гонки: {{ calculateCountdown(nextRace.date) }}
        </div>
      </div>
    </div>
<div class="section" v-if="previousRace">
  <h2>🏁 Прошлый Гран-при</h2>
  <div class="race-card previous-race" @click="goToRace(previousRace.round)">
    <div class="race-badge">Прошлая гонка</div>
    <h3>{{ previousRace.raceName }}</h3>
    <div class="race-info">
      <p><strong>Трасса:</strong> {{ previousRace.Circuit.circuitName }}</p>
      <p><strong>Место:</strong> {{ previousRace.Circuit.Location.locality }}, {{ previousRace.Circuit.Location.country }}</p>
      <p><strong>Дата:</strong> {{ formatDate(previousRace.date) }}</p>
      <p><strong>Раунд:</strong> {{ previousRace.round }}</p>
    </div>
    <div class="view-results">Смотреть результаты →</div>
  </div>
</div>
    <!-- Чемпионат пилотов -->
    <div class="section">
      <h2>🏆 Чемпионат пилотов {{ currentSeason }}</h2>
      <div class="standings">
        <div v-for="driver in driverStandings" :key="driver.position" class="standing-item">
          <span class="position">{{ driver.position }}</span>
          <span class="name">{{ driver.Driver.givenName }} {{ driver.Driver.familyName }}</span>
          <span class="team">{{ driver.Constructors[0].name }}</span>
          <span class="points">{{ driver.points }} очков</span>
        </div>
      </div>
    </div>

    <!-- Кубок конструкторов -->
    <div class="section">
      <h2>🏅 Кубок конструкторов {{ currentSeason }}</h2>
      <div class="standings">
        <div v-for="team in constructorStandings" :key="team.position" class="standing-item">
          <span class="position">{{ team.position }}</span>
          <span class="name">{{ team.Constructor.name }}</span>
          <span class="points">{{ team.points }} очков</span>
        </div>
      </div>
    </div>

    <!-- Быстрая статистика -->
    <div class="stats-grid">
      <div class="stat-card" @click="goToDrivers">
        <h3>👥 Пилоты</h3>
        <div class="stat-number">{{ driversCount }}</div>
        <p>в базе данных</p>
      </div>
      
      <div class="stat-card" @click="goToConstructors">
        <h3>🏁 Команды</h3>
        <div class="stat-number">{{ constructorsCount }}</div>
        <p>в сезоне {{ currentSeason }}</p>
      </div>
      
      <div class="stat-card" @click="goToCircuits">
        <h3>📍 Трассы</h3>
        <div class="stat-number">{{ circuitsCount }}</div>
        <p>в календаре</p>
      </div>
      
      <div class="stat-card" @click="goToRaces">
        <h3>📊 Гонки</h3>
        <div class="stat-number">{{ racesCount }}</div>
        <p>в сезоне {{ currentSeason }}</p>
      </div>
    </div>

    <!-- Статус -->
    <div class="status-bar">
      <span>Данные обновлены: {{ lastUpdate }}</span>
      <span class="api-status">✅ Jolpi API</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router'; // ПРАВИЛЬНЫЙ ИМПОРТ
import f1Api from '../services/f1Api';

const router = useRouter(); // ПРАВИЛЬНОЕ ИСПОЛЬЗОВАНИЕ

// Данные
const loading = ref(true);
const currentSeason = ref(2024);
const nextRace = ref(null);
const driverStandings = ref([]);
const constructorStandings = ref([]);
const drivers = ref([]);
const constructors = ref([]);
const circuits = ref([]);
const calendar = ref([]);
const lastUpdate = ref('');
const previousRace = ref(null);

// Вычисляемые свойства
const driversCount = computed(() => drivers.value.length);
const constructorsCount = computed(() => constructors.value.length);
const circuitsCount = computed(() => circuits.value.length);
const racesCount = computed(() => calendar.value.length);

// Навигация
const goToDrivers = () => {
  router.push('/drivers');
};

const goToConstructors = () => {
  router.push('/constructors');
};

const goToCircuits = () => {
  router.push('/circuits');
};

const goToRaces = () => {
  router.push('/races');
};
const goToRace = (round) => {
  router.push(`/races/${round}`);
};

// Вспомогательные функции
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('ru-RU');
};

const calculateCountdown = (eventDate) => {
  const now = new Date();
  const target = new Date(eventDate);
  const diff = target - now;
  
  if (diff <= 0) return 'Гонка началась!';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  return `${days}д ${hours}ч`;
};

// Загрузка данных
const loadData = async () => {
  try {
    loading.value = true;
    console.log('🔄 Загрузка данных через F1 Jolpi API');
    
    // Параллельная загрузка всех данных
    const [
      seasonData,
      driversData,
      constructorsData,
      circuitsData,
      calendarData,
      driverStandingsData,
      constructorStandingsData
    ] = await Promise.all([
      f1Api.getCurrentSeason(),
      f1Api.getDrivers(),
      f1Api.getConstructors(),
      f1Api.getCircuits(),
      f1Api.getCalendar(),
      f1Api.getDriverStandings(),
      f1Api.getConstructorStandings()
    ]);

    // Обновление данных
    currentSeason.value = seasonData.year;
    drivers.value = driversData;
    constructors.value = constructorsData;
    circuits.value = circuitsData;
    calendar.value = calendarData;
    driverStandings.value = driverStandingsData?.slice(0, 10) || [];
    constructorStandings.value = constructorStandingsData?.slice(0, 10) || [];
    
    // Следующая гонка
    nextRace.value = await f1Api.getNextRace();
    previousRace.value = await f1Api.getPreviousRace();
    lastUpdate.value = new Date().toLocaleString('ru-RU');
    
    console.log('✅ Данные успешно загружены через Jolpi API');
    
  } catch (error) {
    console.error('❌ Ошибка загрузки данных:', error);
    // Fallback данные на случай ошибки API
    currentSeason.value = 2024;
    drivers.value = [];
    constructors.value = [];
    circuits.value = [];
    calendar.value = [];
    driverStandings.value = [];
    constructorStandings.value = [];
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadData();
  
  // Автообновление каждые 5 минут
  setInterval(loadData, 5 * 60 * 1000);
});
</script>

<style scoped>
.home-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Arial', sans-serif;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
  background: linear-gradient(135deg, #e10600, #b30500);
  color: white;
  padding: 2rem;
  border-radius: 10px;
}

.header h1 {
  margin: 0 0 0.5rem 0;
  font-size: 2.5rem;
}

.header p {
  margin: 0;
  opacity: 0.9;
  font-size: 1.1rem;
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
  margin: 0 0 1rem 0;
  border-bottom: 2px solid #e10600;
  padding-bottom: 0.5rem;
}

.race-card {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  border-left: 4px solid #e10600;
}

.race-card h3 {
  margin: 0 0 1rem 0;
  color: #1a1a1a;
}

.race-info p {
  margin: 0.5rem 0;
  color: #555;
}

.countdown {
  margin-top: 1rem;
  padding: 0.5rem;
  background: #e10600;
  color: white;
  border-radius: 4px;
  text-align: center;
  font-weight: bold;
}

.standings {
  margin-top: 1rem;
}

.standing-item {
  display: grid;
  grid-template-columns: 50px 1fr 150px 100px;
  gap: 1rem;
  align-items: center;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.standing-item:nth-child(1) {
  background: #fff3cd;
  font-weight: bold;
}

.position {
  font-weight: bold;
  color: #e10600;
  text-align: center;
}

.team {
  color: #666;
  font-size: 0.9rem;
}

.points {
  font-weight: bold;
  color: #1a1a1a;
  text-align: right;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin: 2rem 0;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 10px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.previous-race {
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 4px solid #006f62;
}

.previous-race:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.15);
}

.race-badge {
  background: #006f62;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
  display: inline-block;
  margin-bottom: 10px;
}

.view-results {
  margin-top: 1rem;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 4px;
  text-align: center;
  color: #e10600;
  font-weight: bold;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.15);
}

.stat-card h3 {
  margin: 0 0 1rem 0;
  color: #333;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: bold;
  color: #e10600;
  margin: 0.5rem 0;
}

.stat-card p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 5px;
  font-size: 0.9rem;
  color: #666;
}

.api-status {
  color: green;
  font-weight: bold;
}

/* Адаптивность */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .standing-item {
    grid-template-columns: 40px 1fr;
    gap: 0.5rem;
  }
  
  .team {
    display: none;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .header h1 {
    font-size: 2rem;
  }
}
</style>