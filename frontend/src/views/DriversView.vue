<template>
  <div class="drivers-view">
    <h1>Пилоты Формулы 1 {{ currentSeason }}</h1>
    
    <div class="stats-bar">
      <div class="stat">
        <span class="stat-number">{{ drivers.length }}</span>
        <span class="stat-label">Всего пилотов</span>
      </div>
      <div class="stat">
        <span class="stat-number">{{ teamsCount }}</span>
        <span class="stat-label">Команд</span>
      </div>
      <div class="stat">
        <span class="stat-number">{{ nationsCount }}</span>
        <span class="stat-label">Стран</span>
      </div>
    </div>

    <div class="teams-container">
      <div 
        v-for="team in groupedDrivers" 
        :key="team.constructorId"
        class="team-section"
        :style="{ borderLeftColor: getTeamColor(team.constructorId) }"
      >
        <div class="team-header">
          <h2 class="team-name">{{ team.constructorName }}</h2>
          <div class="team-nationality">{{ team.nationality }}</div>
        </div>
        
        <div class="drivers-grid">
          <div 
            v-for="driver in team.drivers" 
            :key="driver.driverId"
            class="driver-card"
            @click="goToDriverDetails(driver.driverId)"
          >
            <div class="driver-header">
              <div class="driver-number">{{ driver.permanentNumber || '?' }}</div>
              <div class="driver-code">{{ driver.code || 'N/A' }}</div>
            </div>
            
            <div class="driver-photo">
              <img 
                :src="getDriverPhoto(driver.driverId)" 
                :alt="`${driver.givenName} ${driver.familyName}`"
                @error="handleImageError"
              />
            </div>
            
            <div class="driver-info">
              <h3 class="driver-name">{{ driver.givenName }} {{ driver.familyName }}</h3>
              <div class="driver-nationality">
                <span class="flag">🏁</span>
                {{ driver.nationality || 'Неизвестно' }}
              </div>
              <div class="driver-dob" v-if="driver.dateOfBirth">
                {{ formatDate(driver.dateOfBirth) }}
              </div>
              <div class="driver-dob" v-else>
                Дата рождения неизвестна
              </div>
            </div>
            
            <div class="driver-stats">
              <div class="stat">
                <span class="stat-value">{{ getDriverAge(driver.dateOfBirth) }}</span>
                <span class="stat-label">лет</span>
              </div>
              <div class="stat">
                <span class="stat-value">{{ getSeasonsCount(driver) }}</span>
                <span class="stat-label">сезонов</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading">Загрузка данных о пилотах...</div>
    <div v-if="error" class="error-message">{{ error }}</div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import f1Api from '../services/f1Api';

export default {
  name: 'DriversView',
  setup() {
    const router = useRouter();
    const drivers = ref([]);
    const driverStandings = ref([]);
    const constructors = ref([]);
    const currentSeason = ref(new Date().getFullYear());
    const loading = ref(true);
    const error = ref('');

    // Цвета команд
    const teamColors = {
      'mercedes': '#00D2BE',
      'red_bull': '#0600EF',
      'ferrari': '#DC0000',
      'mclaren': '#FF8700',
      'alpine': '#0090FF',
      'aston_martin': '#006F62',
      'rb': '#2B4562',
      'sauber': '#900000',
      'haas': '#FFFFFF',
      'williams': '#005AFF'
    };

    // Ручное сопоставление пилотов с командами для сезона 2025
    const driverTeamMapping = {
      // Red Bull
      'max_verstappen': 'red_bull',
      'lawson': 'red_bull',
      
      // Ferrari
      'leclerc': 'ferrari',
      'hamilton': 'ferrari',
      
      // Mercedes
      'russell': 'mercedes',
      'antonelli': 'mercedes',
      
      // McLaren
      'norris': 'mclaren',
      'piastri': 'mclaren',
      
      // Aston Martin
      'alonso': 'aston_martin',
      'stroll': 'aston_martin',
      
      // Alpine
      'gasly': 'alpine',
      'doohan': 'alpine',
      
      // Williams
      'albon': 'williams',
      'sainz': 'williams',
      
      // RB
      'tsunoda': 'rb',
      'hadjar': 'rb',
      
      // Sauber
      'hulkenberg': 'sauber',
      'bortoleto': 'sauber',
      
      // Haas
      'ocon': 'haas',
      'bearman': 'haas'
    };

    const loadData = async () => {
      try {
        loading.value = true;
        error.value = '';
        
        const [driversData, standingsData, constructorsData] = await Promise.all([
          f1Api.getDrivers(),
          f1Api.getDriverStandings(),
          f1Api.getConstructors()
        ]);

        drivers.value = driversData;
        driverStandings.value = standingsData;
        constructors.value = constructorsData;

        console.log('Загружено пилотов:', drivers.value.length);
        console.log('Загружено команд:', constructors.value.length);
        console.log('Driver standings:', driverStandings.value);
        
      } catch (err) {
        console.error('Ошибка загрузки данных:', err);
        error.value = 'Не удалось загрузить данные о пилотах';
      } finally {
        loading.value = false;
      }
    };

    // Группировка пилотов по командам - ИСПРАВЛЕННАЯ ВЕРСИЯ
    const groupedDrivers = computed(() => {
      const teams = {};
      
      // Создаем структуру для всех команд
      constructors.value.forEach(constructor => {
        teams[constructor.constructorId] = {
          constructorId: constructor.constructorId,
          constructorName: constructor.name,
          nationality: constructor.nationality,
          drivers: []
        };
      });

      // Распределяем пилотов по командам на основе ручного mapping
      drivers.value.forEach(driver => {
        const constructorId = driverTeamMapping[driver.driverId];
        
        if (constructorId && teams[constructorId]) {
          // Находим standings для этого пилота
          const standing = driverStandings.value.find(s => 
            s.Driver.driverId === driver.driverId
          );
          
          teams[constructorId].drivers.push({
            ...driver,
            position: standing?.position,
            points: standing?.points,
            wins: standing?.wins
          });
        } else {
          // Если пилот не найден в mapping, добавляем в команду "unknown"
          if (!teams['unknown']) {
            teams['unknown'] = {
              constructorId: 'unknown',
              constructorName: 'Без команды',
              nationality: 'Unknown',
              drivers: []
            };
          }
          
          const standing = driverStandings.value.find(s => 
            s.Driver.driverId === driver.driverId
          );
          
          teams['unknown'].drivers.push({
            ...driver,
            position: standing?.position,
            points: standing?.points,
            wins: standing?.wins
          });
        }
      });

      // Сортируем пилотов внутри команд по номеру или имени
      Object.values(teams).forEach(team => {
        team.drivers.sort((a, b) => {
          // Сначала по permanentNumber, если есть
          if (a.permanentNumber && b.permanentNumber) {
            return parseInt(a.permanentNumber) - parseInt(b.permanentNumber);
          }
          // Затем по фамилии
          return a.familyName.localeCompare(b.familyName);
        });
      });

      // Фильтруем только команды с пилотами и сортируем команды
      return Object.values(teams)
        .filter(team => team.drivers.length > 0)
        .sort((a, b) => {
          // Команда "Без команды" в конец
          if (a.constructorId === 'unknown') return 1;
          if (b.constructorId === 'unknown') return -1;
          // Остальные по названию
          return a.constructorName.localeCompare(b.constructorName);
        });
    });

    const teamsCount = computed(() => {
      return groupedDrivers.value.filter(team => team.constructorId !== 'unknown').length;
    });
    
    const nationsCount = computed(() => {
      const nationalities = new Set(drivers.value.map(d => d.nationality).filter(Boolean));
      return nationalities.size;
    });

    const getDriverPhoto = (driverId) => {
      return `https://ui-avatars.com/api/?name=${driverId}&background=random&color=fff&size=200&bold=true`;
    };

    const handleImageError = (event) => {
      event.target.src = `https://ui-avatars.com/api/?name=Driver&background=666&color=fff&size=200`;
    };

    const getTeamColor = (constructorId) => {
      return teamColors[constructorId] || '#666666';
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

    const getSeasonsCount = (driver) => {
      // Простая логика расчета количества сезонов на основе года дебюта
      // В реальном приложении нужно получать из API
      if (!driver.dateOfBirth) return '?';
      
      try {
        const birthYear = new Date(driver.dateOfBirth).getFullYear();
        const debutYear = birthYear + 18; // Предполагаем дебют в 18 лет
        const currentYear = new Date().getFullYear();
        const seasons = Math.max(1, currentYear - debutYear);
        
        return seasons;
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

    const goToDriverDetails = (driverId) => {
      router.push(`/drivers/${driverId}`);
    };

    onMounted(() => {
      loadData();
    });

    return {
      drivers,
      currentSeason,
      loading,
      error,
      groupedDrivers,
      teamsCount,
      nationsCount,
      getDriverPhoto,
      handleImageError,
      getTeamColor,
      getDriverAge,
      getSeasonsCount,
      formatDate,
      goToDriverDetails
    };
  }
};
</script>

<style scoped>
/* Стили остаются без изменений */
.drivers-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  color: #e10600;
  text-align: center;
  margin-bottom: 2rem;
  font-size: 2.5rem;
}

.stats-bar {
  display: flex;
  justify-content: center;
  gap: 3rem;
  margin-bottom: 3rem;
  padding: 1.5rem;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.stat {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 2.5rem;
  font-weight: bold;
  color: #e10600;
  line-height: 1;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
  margin-top: 0.5rem;
}

.teams-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.team-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  border-left: 6px solid #e10600;
}

.team-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f0f0f0;
}

.team-name {
  color: #1a1a1a;
  margin: 0;
  font-size: 1.5rem;
}

.team-nationality {
  background: #f8f9fa;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  color: #666;
}

.drivers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.driver-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
}

.driver-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
  border-color: #e10600;
}

.driver-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.driver-number {
  background: #e10600;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.1rem;
}

.driver-code {
  background: #333;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: bold;
  font-size: 0.9rem;
}

.driver-photo {
  text-align: center;
  margin-bottom: 1rem;
}

.driver-photo img {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid white;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.driver-info {
  text-align: center;
  margin-bottom: 1.5rem;
}

.driver-name {
  color: #1a1a1a;
  margin: 0 0 0.5rem 0;
  font-size: 1.3rem;
}

.driver-nationality {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.flag {
  font-size: 1.2rem;
}

.driver-dob {
  color: #888;
  font-size: 0.9rem;
}

.driver-stats {
  display: flex;
  justify-content: space-around;
  background: white;
  padding: 1rem;
  border-radius: 8px;
}

.driver-stats .stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.driver-stats .stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #e10600;
}

.driver-stats .stat-label {
  font-size: 0.8rem;
  color: #666;
  margin-top: 0.25rem;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #666;
  font-size: 1.1rem;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 6px;
  text-align: center;
  margin: 2rem 0;
}

/* Адаптивность */
@media (max-width: 768px) {
  .drivers-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-bar {
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .team-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .driver-stats {
    flex-direction: column;
    gap: 1rem;
  }
}

@media (max-width: 480px) {
  .drivers-view {
    padding: 10px;
  }
  
  h1 {
    font-size: 2rem;
  }
  
  .team-section {
    padding: 1rem;
  }
  
  .driver-card {
    padding: 1rem;
  }
}
</style>