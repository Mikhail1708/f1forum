<template>
  <div class="driver-details-view">
    <button @click="$router.push('/drivers')" class="back-btn">← Назад к пилотам</button>
    
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      Загрузка информации о пилоте...
    </div>
    
    <div v-else-if="error" class="error-message">
      {{ error }}
    </div>
    
    <div v-else-if="driver" class="driver-profile">
      <!-- Заголовок профиля -->
      <div class="profile-header">
        <div class="driver-main-info">
          <div class="driver-number">{{ driver.permanentNumber || '?' }}</div>
          <h1>{{ driver.givenName }} {{ driver.familyName }}</h1>
          <div class="driver-code">{{ driver.code }}</div>
          <div class="driver-team" v-if="currentTeam">
            <span class="team-badge">{{ currentTeam.name }}</span>
          </div>
        </div>
        
        <div class="driver-photo-large">
          <img 
            :src="getDriverPhoto(driver.driverId)" 
            :alt="`${driver.givenName} ${driver.familyName}`"
            @error="handleImageError"
          />
        </div>
      </div>

      <!-- Статистика текущего сезона -->
      <div class="season-stats" v-if="currentSeasonStanding">
        <h2>📊 Статистика сезона {{ currentSeason }}</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">{{ currentSeasonStanding.position }}</div>
            <div class="stat-label">Место в чемпионате</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ currentSeasonStanding.points }}</div>
            <div class="stat-label">Очков</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ currentSeasonStanding.wins }}</div>
            <div class="stat-label">Побед</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ totalPodiums }}</div>
            <div class="stat-label">Подиумов</div>
          </div>
        </div>
      </div>

      <!-- Основная информация -->
      <div class="info-grid">
        <div class="info-card personal-info">
          <h3>👤 Личная информация</h3>
          <div class="info-list">
            <div class="info-item">
              <span class="label">Национальность:</span>
              <span class="value">{{ driver.nationality }}</span>
            </div>
            <div class="info-item">
              <span class="label">Дата рождения:</span>
              <span class="value">{{ formatDate(driver.dateOfBirth) }}</span>
            </div>
            <div class="info-item">
              <span class="label">Возраст:</span>
              <span class="value">{{ getDriverAge(driver.dateOfBirth) }} лет</span>
            </div>
            <div class="info-item" v-if="driver.url">
              <span class="label">Биография:</span>
              <a :href="driver.url" target="_blank" class="value-link">Wikipedia</a>
            </div>
          </div>
        </div>

        <!-- Карьера в Формуле 1 -->
        <div class="info-card career-info" v-if="driverStats.length > 0">
          <h3>🏎️ Карьера в Формуле 1</h3>
          <div class="career-summary">
            <div class="career-stat">
              <span class="career-value">{{ driverStats.length }}</span>
              <span class="career-label">сезонов</span>
            </div>
            <div class="career-stat">
              <span class="career-value">{{ totalPoints }}</span>
              <span class="career-label">очков за карьеру</span>
            </div>
            <div class="career-stat">
              <span class="career-value">{{ totalWins }}</span>
              <span class="career-label">побед</span>
            </div>
          </div>
          
          <div class="seasons-history">
            <h4>История выступлений:</h4>
            <div class="seasons-list">
              <div 
                v-for="season in driverStats" 
                :key="season.season"
                class="season-item"
              >
                <span class="season-year">{{ season.season }}</span>
                <span class="season-position">P{{ season.position }}</span>
                <span class="season-points">{{ season.points }} очков</span>
                <span class="season-wins">{{ season.wins }} побед</span>
                <span class="season-team" v-if="season.Constructors[0]">
                  {{ season.Constructors[0].name }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Результаты в текущем сезоне -->
      <div class="season-results" v-if="seasonResults.length > 0">
        <h2>🎯 Результаты в сезоне {{ currentSeason }}</h2>
        <div class="results-container">
          <div class="results-table">
            <div class="table-header">
              <span class="round">Раунд</span>
              <span class="grand-prix">Гран-при</span>
              <span class="qualifying">Квалификация</span>
              <span class="race">Гонка</span>
              <span class="points">Очки</span>
              <span class="status">Статус</span>
            </div>
            <div 
              v-for="result in seasonResults" 
              :key="result.round"
              class="table-row"
              :class="{
                'podium-1': result.Results?.position === '1',
                'podium-2': result.Results?.position === '2',
                'podium-3': result.Results?.position === '3'
              }"
            >
              <span class="round">{{ result.round }}</span>
              <span class="grand-prix">
                <span class="race-name">{{ result.raceName }}</span>
                <span class="circuit-name">{{ result.Circuit.circuitName }}</span>
              </span>
              <span class="qualifying">
                {{ getQualifyingPosition(result.round) || '-' }}
              </span>
              <span class="race">
                <span class="race-position" v-if="result.Results">
                  P{{ result.Results.position }}
                </span>
                <span v-else>-</span>
              </span>
              <span class="points">{{ result.Results?.points || '0' }}</span>
              <span class="status" :class="getStatusClass(result.Results?.status)">
                {{ getStatusText(result.Results?.status) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Если нет данных о результатах -->
      <div v-else class="no-results">
        <h2>📊 Результаты сезона {{ currentSeason }}</h2>
        <p>Результаты для этого пилота в текущем сезоне пока недоступны</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import f1Api from '../services/f1Api';

const route = useRoute();
const driver = ref(null);
const currentSeasonStanding = ref(null);
const seasonResults = ref([]);
const qualifyingResults = ref([]);
const driverStats = ref([]);
const currentSeason = ref(new Date().getFullYear());
const loading = ref(true);
const error = ref('');

const getDriverPhoto = (driverId) => {
  return `https://ui-avatars.com/api/?name=${driverId}&background=random&color=fff&size=400&bold=true`;
};

const handleImageError = (event) => {
  event.target.src = `https://ui-avatars.com/api/?name=Driver&background=666&color=fff&size=400`;
};

const getDriverAge = (dateOfBirth) => {
  if (!dateOfBirth) return '?';
  try {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  } catch (e) {
    return '?';
  }
};

const formatDate = (dateString) => {
  if (!dateString) return 'Дата неизвестна';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch (e) {
    return dateString;
  }
};

const getQualifyingPosition = (round) => {
  const qualifying = qualifyingResults.value.find(q => q.round === round);
  return qualifying?.QualifyingResults?.position || null;
};

const getStatusClass = (status) => {
  if (!status) return 'status-unknown';
  if (status === 'Finished') return 'status-finished';
  if (status.includes('Lap')) return 'status-laps';
  return 'status-dnf';
};

const getStatusText = (status) => {
  if (!status) return '-';
  if (status === 'Finished') return 'Финиш';
  if (status.includes('Lap')) return status;
  return 'Сход';
};

// Вычисляемые свойства
const currentTeam = computed(() => {
  return currentSeasonStanding.value?.Constructors?.[0] || null;
});

const totalPodiums = computed(() => {
  if (!seasonResults.value.length) return 0;
  return seasonResults.value.filter(result => {
    const pos = parseInt(result.Results?.position);
    return pos >= 1 && pos <= 3;
  }).length;
});

const totalPoints = computed(() => {
  return driverStats.value.reduce((sum, season) => sum + parseFloat(season.points || 0), 0);
});

const totalWins = computed(() => {
  return driverStats.value.reduce((sum, season) => sum + parseInt(season.wins || 0), 0);
});

onMounted(async () => {
  const driverId = route.params.id;
  console.log('Загрузка информации о пилоте:', driverId);
  
  try {
    loading.value = true;
    
    // Параллельная загрузка всех данных
    const [
      driverData,
      standingsData,
      seasonData,
      qualifyingData,
      statsData
    ] = await Promise.all([
      f1Api.getDriverDetails(driverId),
      f1Api.getDriverStandings(currentSeason.value),
      f1Api.getDriverSeasonResults(driverId, currentSeason.value),
      f1Api.getDriverQualifyingResults(driverId, currentSeason.value),
      f1Api.getDriverStats(driverId)
    ]);

    driver.value = driverData;
    seasonResults.value = seasonData;
    qualifyingResults.value = qualifyingData;
    driverStats.value = statsData;
    
    // Находим текущую позицию в чемпионате
    currentSeasonStanding.value = standingsData.find(s => s.Driver.driverId === driverId);
    
    console.log('Данные пилота загружены:', {
      driver: driver.value,
      standing: currentSeasonStanding.value,
      seasonResults: seasonResults.value.length,
      qualifyingResults: qualifyingResults.value.length,
      careerStats: driverStats.value.length
    });
    
  } catch (err) {
    console.error('Ошибка загрузки данных пилота:', err);
    error.value = 'Не удалось загрузить информацию о пилоте';
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.driver-details-view {
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
  font-size: 1rem;
  transition: background-color 0.3s;
}

.back-btn:hover {
  background: #555;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #666;
  font-size: 1.1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #e10600;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 6px;
  text-align: center;
  margin: 2rem 0;
  border: 1px solid #f5c6cb;
}

.profile-header {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 3rem;
  align-items: center;
  background: white;
  padding: 2rem;
  border-radius: 15px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.driver-main-info {
  text-align: left;
}

.driver-number {
  background: #e10600;
  color: white;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.driver-main-info h1 {
  color: #1a1a1a;
  margin: 0 0 0.5rem 0;
  font-size: 2.5rem;
  text-align: left;
}

.driver-code {
  background: #333;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: bold;
  font-size: 1.1rem;
  display: inline-block;
  margin-bottom: 1rem;
}

.team-badge {
  background: #e10600;
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: bold;
}

.driver-photo-large img {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  object-fit: cover;
  border: 6px solid white;
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

.season-stats {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.season-stats h2 {
  color: #e10600;
  margin: 0 0 1.5rem 0;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 0.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
  border-left: 4px solid #e10600;
}

.stat-card .stat-value {
  font-size: 2.5rem;
  font-weight: bold;
  color: #e10600;
  line-height: 1;
  margin-bottom: 0.5rem;
}

.stat-card .stat-label {
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.info-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.info-card h3 {
  color: #e10600;
  margin: 0 0 1.5rem 0;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 0.5rem;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.label {
  color: #666;
  font-weight: 500;
}

.value {
  color: #1a1a1a;
  font-weight: bold;
}

.value-link {
  color: #e10600;
  text-decoration: none;
  font-weight: bold;
}

.value-link:hover {
  text-decoration: underline;
}

.career-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.career-stat {
  text-align: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.career-value {
  display: block;
  font-size: 2rem;
  font-weight: bold;
  color: #e10600;
  line-height: 1;
  margin-bottom: 0.5rem;
}

.career-label {
  font-size: 0.8rem;
  color: #666;
}

.seasons-history h4 {
  color: #333;
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
}

.seasons-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 300px;
  overflow-y: auto;
}

.season-item {
  display: grid;
  grid-template-columns: 60px 60px 100px 80px 1fr;
  gap: 1rem;
  align-items: center;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 0.9rem;
}

.season-year {
  font-weight: bold;
  color: #e10600;
}

.season-position {
  font-weight: bold;
}

.season-points {
  color: #666;
}

.season-wins {
  color: #28a745;
  font-weight: 500;
}

.season-team {
  color: #666;
  text-align: right;
}

.season-results {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.season-results h2 {
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
  grid-template-columns: 60px 2fr 100px 80px 80px 100px;
  gap: 1px;
  background: #e10600;
  color: white;
  font-weight: bold;
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
  grid-template-columns: 60px 2fr 100px 80px 80px 100px;
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

.round {
  font-weight: bold;
  color: #333;
}

.grand-prix {
  flex-direction: column;
  align-items: flex-start !important;
  justify-content: center !important;
}

.race-name {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.circuit-name {
  font-size: 0.8rem;
  color: #666;
}

.qualifying, .race-position {
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

.status-unknown {
  background: #e2e3e5;
  color: #383d41;
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

.no-results {
  background: white;
  padding: 3rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  text-align: center;
  color: #666;
}

.no-results h2 {
  color: #e10600;
  margin: 0 0 1rem 0;
}

/* Адаптивность */
@media (max-width: 768px) {
  .profile-header {
    grid-template-columns: 1fr;
    text-align: center;
    gap: 1.5rem;
  }
  
  .driver-main-info {
    text-align: center;
  }
  
  .driver-main-info h1 {
    text-align: center;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .career-summary {
    grid-template-columns: 1fr;
  }
  
  .season-item {
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }
  
  .season-team {
    text-align: left;
  }
  
  .table-header,
  .table-row {
    grid-template-columns: 50px 1fr 80px;
    font-size: 0.9rem;
  }
  
  .table-header span:nth-child(4),
  .table-row span:nth-child(4),
  .table-header span:nth-child(6),
  .table-row span:nth-child(6) {
    display: none;
  }
}

@media (max-width: 480px) {
  .driver-details-view {
    padding: 10px;
  }
  
  .profile-header {
    padding: 1rem;
  }
  
  .driver-main-info h1 {
    font-size: 2rem;
  }
  
  .driver-photo-large img {
    width: 150px;
    height: 150px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>