<template>
  <div class="home-page">
    <!-- Заголовок -->
    <div class="header">
      <h1>F1 Forum - Формула 1</h1>
      <p>Актуальные новости, результаты и статистика</p>
    </div>

    <!-- Ближайший Гран-при -->
    <div class="section">
      <h2>Ближайший Гран-при</h2>
      <div v-if="nextRace" class="race-card">
        <h3>{{ nextRace.raceName }}</h3>
        <div class="race-details">
          <p><strong>Трасса:</strong> {{ nextRace.Circuit?.circuitName }}</p>
          <p><strong>Место:</strong> {{ nextRace.Circuit?.Location?.locality }}, {{ nextRace.Circuit?.Location?.country }}</p>
          <p><strong>Дата:</strong> {{ formatDate(nextRace.date) }}</p>
          <p><strong>Раунд:</strong> {{ nextRace.round }}</p>
        </div>
      </div>
      <div v-else class="no-race">
        Нет данных о ближайших гонках
      </div>
    </div>

    <hr class="divider">

    <!-- Чемпионат пилотов -->
    <div class="section">
      <h2>Чемпионат пилотов 2024</h2>
      <div class="standings">
        <div v-for="driver in driverStandings" :key="driver.position" class="standing-item">
          <span class="position">{{ driver.position }}</span>
          <span class="driver-name">{{ getDriverName(driver.Driver) }}</span>
          <span class="team">{{ driver.Constructors?.[0]?.name }}</span>
          <span class="points">{{ driver.points }} очков</span>
        </div>
      </div>
    </div>

    <!-- Быстрая статистика -->
    <div class="stats-grid">
      <div class="stat-item">
        <h3>Пилоты</h3>
        <div class="stat-number">{{ driversCount }}</div>
        <p>в базе данных</p>
      </div>
      
      <div class="stat-item">
        <h3>Команды</h3>
        <div class="stat-number">{{ constructorsCount }}</div>
        <p>в сезоне 2024</p>
      </div>
      
      <div class="stat-item">
        <h3>Трассы</h3>
        <div class="stat-number">{{ circuitsCount }}</div>
        <p>в календаре</p>
      </div>
      
      <div class="stat-item">
        <h3>Гонки</h3>
        <div class="stat-number">{{ racesCount }}</div>
        <p>в сезоне 2024</p>
      </div>
    </div>

    <!-- Статус обновления -->
    <div class="update-info">
      <p>Данные обновлены: {{ lastUpdate }}</p>
      <span class="status" :class="{ 'online': apiOnline, 'offline': !apiOnline }">
        {{ apiOnline ? '✅ API онлайн' : '⚠️ Демо-данные' }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import f1Api from '../services/f1Api';

// Реактивные данные
const loading = ref(true);
const apiOnline = ref(true);

const currentSeason = ref(2024);
const calendar = ref([]);
const nextRace = ref(null);
const driverStandings = ref([]);
const drivers = ref([]);
const constructors = ref([]);
const circuits = ref([]);
const lastUpdate = ref('');

// Вычисляемые свойства
const driversCount = computed(() => drivers.value.length);
const constructorsCount = computed(() => constructors.value.length);
const circuitsCount = computed(() => circuits.value.length);
const racesCount = computed(() => calendar.value.length);

// Вспомогательные функции
const formatDate = (dateString) => {
  if (!dateString) return 'Дата не указана';
  return new Date(dateString).toLocaleDateString('ru-RU');
};

const getDriverName = (driver) => {
  if (!driver) return 'Неизвестный пилот';
  return `${driver.givenName} ${driver.familyName}`;
};

// Загрузка данных
const loadData = async () => {
  try {
    loading.value = true;
    
    console.log('🔄 Загрузка данных с F1 API...');
    
    // Параллельная загрузка данных
    const [
      seasonData,
      driversData,
      constructorsData,
      circuitsData,
      calendarData,
      driverStandingsData
    ] = await Promise.all([
      f1Api.getCurrentSeason(),
      f1Api.getDrivers(),
      f1Api.getConstructors(),
      f1Api.getCircuits(),
      f1Api.getCalendar(),
      f1Api.getDriverStandings()
    ]);

    // Обновление данных
    currentSeason.value = seasonData?.year || 2024;
    drivers.value = Array.isArray(driversData) ? driversData : [];
    constructors.value = Array.isArray(constructorsData) ? constructorsData : [];
    circuits.value = Array.isArray(circuitsData) ? circuitsData : [];
    calendar.value = Array.isArray(calendarData) ? calendarData : [];
    
    // Топ-5 пилотов
    driverStandings.value = Array.isArray(driverStandingsData) 
      ? driverStandingsData.slice(0, 5) 
      : [];

    // Находим следующую гонку
    if (calendar.value.length > 0) {
      const now = new Date();
      nextRace.value = calendar.value.find(race => new Date(race.date) > now) 
        || calendar.value[calendar.value.length - 1];
    }

    lastUpdate.value = new Date().toLocaleString('ru-RU');
    apiOnline.value = true;
    
  } catch (error) {
    console.error('❌ Ошибка загрузки данных:', error);
    apiOnline.value = false;
    loadDemoData();
  } finally {
    loading.value = false;
  }
};

// Демо-данные для fallback
const loadDemoData = () => {
  console.log('📋 Загрузка демо-данных...');
  
  currentSeason.value = 2024;
  
  // Демо-пилоты
  drivers.value = [
    { driverId: "alonso", givenName: "Fernando", familyName: "Alonso" },
    { driverId: "hamilton", givenName: "Lewis", familyName: "Hamilton" },
    { driverId: "max_verstappen", givenName: "Max", familyName: "Verstappen" },
    { driverId: "leclerc", givenName: "Charles", familyName: "Leclerc" },
    { driverId: "sainz", givenName: "Carlos", familyName: "Sainz" }
  ];
  
  // Демо-команды
  constructors.value = [
    { constructorId: "mercedes", name: "Mercedes" },
    { constructorId: "red_bull", name: "Red Bull" }
  ];
  
  // Демо-трассы
  circuits.value = Array.from({ length: 30 }, (_, i) => ({
    circuitId: `circuit_${i + 1}`,
    circuitName: `Трасса ${i + 1}`
  }));
  
  // Демо-календарь
  calendar.value = [{
    raceName: "Bahrain Grand Prix",
    Circuit: {
      circuitName: "Bahrain International Circuit",
      Location: {
        locality: "Sakhir",
        country: "Bahrain"
      }
    },
    date: "2024-03-02",
    round: "1"
  }];
  
  // Демо-чемпионат
  driverStandings.value = [
    {
      position: "1",
      Driver: { givenName: "Max", familyName: "Verstappen" },
      Constructors: [{ name: "Red Bull" }],
      points: "300"
    },
    {
      position: "2",
      Driver: { givenName: "Lewis", familyName: "Hamilton" },
      Constructors: [{ name: "Mercedes" }],
      points: "250"
    },
    {
      position: "3",
      Driver: { givenName: "Fernando", familyName: "Alonso" },
      Constructors: [{ name: "Aston Martin" }],
      points: "200"
    }
  ];
  
  nextRace.value = calendar.value[0];
  lastUpdate.value = new Date().toLocaleString('ru-RU') + ' (демо)';
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.home-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: #333;
}

/* Заголовок */
.header {
  text-align: center;
  margin-bottom: 2rem;
  padding: 2rem;
  background: linear-gradient(135deg, #e10600, #b30500);
  color: white;
  border-radius: 10px;
}

.header h1 {
  margin: 0 0 0.5rem 0;
  font-size: 2.2rem;
  font-weight: 600;
}

.header p {
  margin: 0;
  opacity: 0.9;
  font-size: 1.1rem;
}

/* Секции */
.section {
  background: white;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.section h2 {
  color: #e10600;
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
  border-bottom: 2px solid #e10600;
  padding-bottom: 0.5rem;
}

/* Карточка гонки */
.race-card {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 6px;
  border-left: 4px solid #e10600;
}

.race-card h3 {
  margin: 0 0 1rem 0;
  color: #1a1a1a;
  font-size: 1.3rem;
}

.race-details p {
  margin: 0.5rem 0;
  color: #555;
}

/* Разделитель */
.divider {
  border: none;
  border-top: 2px solid #e10600;
  margin: 2rem 0;
  opacity: 0.3;
}

/* Таблица чемпионата */
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
  transition: background-color 0.3s;
}

.standing-item:hover {
  background: #e9ecef;
}

.standing-item:nth-child(1) {
  background: #fff3cd;
  font-weight: 600;
}

.position {
  font-weight: bold;
  color: #e10600;
  text-align: center;
  font-size: 1.1rem;
}

.driver-name {
  font-weight: 500;
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

/* Статистика */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  margin: 2rem 0;
}

.stat-item {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-top: 4px solid #e10600;
}

.stat-item h3 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.1rem;
  font-weight: 600;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: bold;
  color: #e10600;
  margin: 0.5rem 0;
}

.stat-item p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

/* Информация об обновлении */
.update-info {
  text-align: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
  margin-top: 2rem;
  font-size: 0.9rem;
  color: #666;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status.online {
  color: #28a745;
  font-weight: 600;
}

.status.offline {
  color: #ffc107;
  font-weight: 600;
}

.no-race {
  text-align: center;
  padding: 2rem;
  color: #666;
  font-style: italic;
  background: #f8f9fa;
  border-radius: 6px;
}

/* Адаптивность */
@media (max-width: 768px) {
  .home-page {
    padding: 10px;
  }
  
  .header {
    padding: 1.5rem;
  }
  
  .header h1 {
    font-size: 1.8rem;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
  
  .standing-item {
    grid-template-columns: 40px 1fr;
    gap: 0.5rem;
  }
  
  .team, .points {
    display: none;
  }
  
  .update-info {
    flex-direction: column;
    gap: 0.5rem;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .section {
    padding: 1rem;
  }
  
  .stat-number {
    font-size: 2rem;
  }
}
</style>