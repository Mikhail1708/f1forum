<template>
  <div class="constructors-view">
    <h1>Команды Формулы 1 {{ currentSeason }}</h1>
    
    <div class="stats-bar">
      <div class="stat">
        <span class="stat-number">{{ constructors.length }}</span>
        <span class="stat-label">Всего команд</span>
      </div>
      <div class="stat">
        <span class="stat-number">{{ engineManufacturers.length }}</span>
        <span class="stat-label">Производителей двигателей</span>
      </div>
      <div class="stat">
        <span class="stat-number">{{ uniqueNationalities.length }}</span>
        <span class="stat-label">Стран представлено</span>
      </div>
    </div>

    <div class="constructors-grid">
      <div 
        v-for="constructor in constructors" 
        :key="constructor.constructorId" 
        class="constructor-card"
        @click="goToConstructorDetails(constructor.constructorId)"
      >
        <div class="constructor-header">
          <div class="constructor-logo">
            <img 
              :src="getLogoUrl(constructor.constructorId)" 
              :alt="constructor.name"
              @error="handleImageError"
            >
          </div>
          <div class="constructor-basic-info">
            <h3>{{ constructor.name }}</h3>
            <div class="nationality-flag">
              <span class="flag">🏁</span>
              {{ getNationalityText(constructor.nationality) }}
            </div>
          </div>
        </div>

        <div class="constructor-details">
          <div class="info-item">
            <span class="label">Основана:</span>
            <span class="value">{{ getFoundedYear(constructor.constructorId) }}</span>
          </div>
          <div class="info-item">
            <span class="label">Штаб-квартира:</span>
            <span class="value">{{ getHeadquarters(constructor.constructorId) }}</span>
          </div>
          <div class="info-item">
            <span class="label">Двигатель:</span>
            <span class="value">{{ getEngine(constructor.constructorId) }}</span>
          </div>
          <div class="info-item">
            <span class="label">Чемпионства:</span>
            <span class="value">{{ getChampionships(constructor.constructorId) }}</span>
          </div>
        </div>

        <div class="team-colors" :style="getTeamColors(constructor.constructorId)"></div>

        <div class="constructor-actions">
          <button class="details-btn" @click.stop="goToConstructorDetails(constructor.constructorId)">
            Подробнее →
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading">Загрузка команд...</div>
    <div v-if="error" class="error-message">{{ error }}</div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import f1Api from '../services/f1Api';

export default {
  name: 'ConstructorsView',
  setup() {
    const router = useRouter();
    const constructors = ref([]);
    const currentSeason = ref(new Date().getFullYear());
    const loading = ref(true);
    const error = ref('');

    // Данные о командах (можно вынести в отдельный файл)
    const constructorDetails = {
      'mercedes': {
        founded: 2010,
        headquarters: 'Бракли, Великобритания',
        engine: 'Mercedes',
        championships: 8,
        colors: ['#00D2BE', '#000000']
      },
      'ferrari': {
        founded: 1929,
        headquarters: 'Маранелло, Италия',
        engine: 'Ferrari',
        championships: 16,
        colors: ['#DC0000', '#FFFFFF']
      },
      'red_bull': {
        founded: 2005,
        headquarters: 'Милтон-Кинс, Великобритания',
        engine: 'Honda RBPT',
        championships: 5,
        colors: ['#0600EF', '#FFFFFF']
      },
      'mclaren': {
        founded: 1963,
        headquarters: 'Уокинг, Великобритания',
        engine: 'Mercedes',
        championships: 8,
        colors: ['#FF8700', '#000000']
      },
      'alpine': {
        founded: 1986,
        headquarters: 'Энстоун, Великобритания',
        engine: 'Renault',
        championships: 2,
        colors: ['#0090FF', '#FFFFFF']
      },
      'aston_martin': {
        founded: 2018,
        headquarters: 'Сильверстоун, Великобритания',
        engine: 'Mercedes',
        championships: 0,
        colors: ['#006F62', '#FFFFFF']
      },
      'williams': {
        founded: 1977,
        headquarters: 'Гров, Великобритания',
        engine: 'Mercedes',
        championships: 9,
        colors: ['#005AFF', '#FFFFFF']
      },
      'rb': {
        founded: 2006,
        headquarters: 'Фаэнца, Италия',
        engine: 'Honda RBPT',
        championships: 0,
        colors: ['#6692FF', '#000000']
      },
      'sauber': {
        founded: 1993,
        headquarters: 'Хинвиль, Швейцария',
        engine: 'Ferrari',
        championships: 0,
        colors: ['#52E252', '#000000']
      },
      'haas': {
        founded: 2016,
        headquarters: 'Каннаполис, США',
        engine: 'Ferrari',
        championships: 0,
        colors: ['#FFFFFF', '#FF0000']
      }
    };

    const nationalityMap = {
      'British': 'Великобритания',
      'Italian': 'Италия',
      'German': 'Германия',
      'French': 'Франция',
      'Swiss': 'Швейцария',
      'American': 'США',
      'Austrian': 'Австрия'
    };

    const loadData = async () => {
      try {
        loading.value = true;
        constructors.value = await f1Api.getConstructors();
        console.log('Загружено команд:', constructors.value.length);
      } catch (err) {
        console.error('Ошибка загрузки данных:', err);
        error.value = 'Не удалось загрузить список команд';
      } finally {
        loading.value = false;
      }
    };

    // Вычисляемые свойства
    const engineManufacturers = computed(() => {
      const engines = constructors.value.map(constructor => 
        getEngine(constructor.constructorId)
      );
      return [...new Set(engines)];
    });

    const uniqueNationalities = computed(() => {
      const nationalities = constructors.value.map(constructor => constructor.nationality);
      return [...new Set(nationalities)];
    });

    // Методы
    const getLogoUrl = (constructorId) => {
      try {
        return `/logos/constructors/${constructorId}.png`;
      } catch (e) {
        return '/logos/constructors/default.png';
      }
    };

    const handleImageError = (event) => {
      event.target.src = '/logos/constructors/default.png';
    };

    const getNationalityText = (nationality) => {
      return nationalityMap[nationality] || nationality;
    };

    const getFoundedYear = (constructorId) => {
      return constructorDetails[constructorId]?.founded || 'Неизвестно';
    };

    const getHeadquarters = (constructorId) => {
      return constructorDetails[constructorId]?.headquarters || 'Неизвестно';
    };

    const getEngine = (constructorId) => {
      return constructorDetails[constructorId]?.engine || 'Неизвестно';
    };

    const getChampionships = (constructorId) => {
      return constructorDetails[constructorId]?.championships || 0;
    };

    const getTeamColors = (constructorId) => {
      const colors = constructorDetails[constructorId]?.colors || ['#666666', '#FFFFFF'];
      return {
        background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`
      };
    };

    const goToConstructorDetails = (constructorId) => {
      router.push(`/constructors/${constructorId}`);
    };

    onMounted(() => {
      loadData();
    });

    return {
      constructors,
      currentSeason,
      loading,
      error,
      engineManufacturers,
      uniqueNationalities,
      getLogoUrl,
      handleImageError,
      getNationalityText,
      getFoundedYear,
      getHeadquarters,
      getEngine,
      getChampionships,
      getTeamColors,
      goToConstructorDetails
    };
  }
};
</script>

<style scoped>
.constructors-view {
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
  gap: 2rem;
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
  font-size: 2rem;
  font-weight: bold;
  color: #e10600;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
}

.constructors-grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
}

.constructor-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.constructor-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

.constructor-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.constructor-logo {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 10px;
}

.constructor-logo img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.constructor-basic-info h3 {
  margin: 0 0 0.5rem 0;
  color: #1a1a1a;
  font-size: 1.3rem;
}

.nationality-flag {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
  font-weight: 500;
}

.flag {
  font-size: 1.2rem;
}

.constructor-details {
  margin-bottom: 1rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.label {
  font-weight: 500;
  color: #666;
}

.value {
  font-weight: bold;
  color: #1a1a1a;
}

.team-colors {
  height: 4px;
  border-radius: 2px;
  margin: 1rem 0;
}

.constructor-actions {
  text-align: center;
}

.details-btn {
  background: #e10600;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.3s;
  width: 100%;
}

.details-btn:hover {
  background: #b30500;
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
  .constructors-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-bar {
    flex-direction: column;
    gap: 1rem;
  }
  
  .constructor-header {
    flex-direction: column;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .constructors-view {
    padding: 10px;
  }
  
  h1 {
    font-size: 2rem;
  }
  
  .constructor-card {
    padding: 1rem;
  }
}
</style>