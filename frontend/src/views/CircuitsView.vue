<template>
  <div class="circuits-view">
    <h1>Трассы Формулы 1 {{ currentSeason }}</h1>
    
    <div class="stats-bar">
      <div class="stat">
        <span class="stat-number">{{ circuits.length }}</span>
        <span class="stat-label">Всего трасс</span>
      </div>
      <div class="stat">
        <span class="stat-number">{{ uniqueCountries.length }}</span>
        <span class="stat-label">Стран представлено</span>
      </div>
      <div class="stat">
        <span class="stat-number">{{ streetCircuitsCount }}</span>
        <span class="stat-label">Городских трасс</span>
      </div>
      <div class="stat">
        <span class="stat-number">{{ permanentCircuitsCount }}</span>
        <span class="stat-label">Постоянных трасс</span>
      </div>
    </div>

    <div class="filters">
      <div class="filter-group">
        <label>Тип трассы:</label>
        <select v-model="filterType" class="filter-select">
          <option value="all">Все трассы</option>
          <option value="street">Городские</option>
          <option value="permanent">Постоянные</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Страна:</label>
        <select v-model="filterCountry" class="filter-select">
          <option value="all">Все страны</option>
          <option v-for="country in uniqueCountries" :key="country" :value="country">
            {{ country }}
          </option>
        </select>
      </div>
      <button @click="clearFilters" class="clear-filters-btn">Сбросить фильтры</button>
    </div>

    <div class="circuits-grid">
      <div 
        v-for="circuit in filteredCircuits" 
        :key="circuit.circuitId" 
        class="circuit-card"
        @click="goToCircuitDetails(circuit.circuitId)"
      >
        <div class="circuit-header">
          <div class="circuit-type" :class="getCircuitType(circuit.circuitId)">
            {{ getCircuitTypeText(circuit.circuitId) }}
          </div>
          <div class="circuit-country">
            <span class="flag">🏁</span>
            {{ circuit.Location.country }}
          </div>
        </div>

        <h3>{{ circuit.circuitName }}</h3>
        
        <div class="circuit-location">
          <div class="location-icon">📍</div>
          <div class="location-info">
            <div class="locality">{{ circuit.Location.locality }}</div>
            <div class="coordinates">
              {{ formatCoordinates(circuit.Location.lat, circuit.Location.long) }}
            </div>
          </div>
        </div>

        <div class="circuit-details">
          <div class="detail-item">
            <span class="label">Длина трассы:</span>
            <span class="value">{{ getCircuitLength(circuit.circuitId) }}</span>
          </div>
          <div class="detail-item">
            <span class="label">Повороты:</span>
            <span class="value">{{ getCircuitTurns(circuit.circuitId) }}</span>
          </div>
          <div class="detail-item">
            <span class="label">Рекорд круга:</span>
            <span class="value">{{ getCircuitRecord(circuit.circuitId) }}</span>
          </div>
          <div class="detail-item">
            <span class="label">Первая гонка:</span>
            <span class="value">{{ getFirstRace(circuit.circuitId) }}</span>
          </div>
        </div>

        <div class="circuit-description">
          {{ getCircuitDescription(circuit.circuitId) }}
        </div>

        <div class="circuit-actions">
          <button class="details-btn" @click.stop="goToCircuitDetails(circuit.circuitId)">
            Подробнее о трассе →
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading">Загрузка трасс...</div>
    <div v-if="error" class="error-message">{{ error }}</div>
    <div v-if="filteredCircuits.length === 0 && !loading" class="no-results">
      По выбранным фильтрам трассы не найдены
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import f1Api from '../services/f1Api';

export default {
  name: 'CircuitsView',
  setup() {
    const router = useRouter();
    const circuits = ref([]);
    const currentSeason = ref(new Date().getFullYear());
    const loading = ref(true);
    const error = ref('');
    const filterType = ref('all');
    const filterCountry = ref('all');

    // Дополнительные данные о трассах
    const circuitDetails = {
      'albert_park': {
        type: 'street',
        length: '5.278 км',
        turns: 14,
        record: '1:20.235 (Макс Ферстаппен, 2023)',
        firstRace: 1996,
        description: 'Городская трасса в парке Альберт в Мельбурне, известная своей живописной локацией вокруг озера.'
      },
      'shanghai': {
        type: 'permanent',
        length: '5.451 км',
        turns: 16,
        record: '1:31.095 (Майкл Шумахер, 2006)',
        firstRace: 2004,
        description: 'Одна из самых современных трасс, спроектированная Германом Тильке. Известная длинной прямой и сложными поворотами.'
      },
      'suzuka': {
        type: 'permanent',
        length: '5.807 км',
        turns: 18,
        record: '1:27.064 (Льюис Хэмилтон, 2019)',
        firstRace: 1987,
        description: 'Легендарная трасса в форме восьмёрки, одна из самых технически сложных в календаре.'
      },
      'bahrain': {
        type: 'permanent',
        length: '5.412 км',
        turns: 15,
        record: '1:27.958 (Педро де ла Роса, 2005)',
        firstRace: 2004,
        description: 'Ночная гонка в пустыне с современной инфраструктурой и различными конфигурациями трассы.'
      },
      'jeddah': {
        type: 'street',
        length: '6.174 км',
        turns: 27,
        record: '1:28.140 (Льюис Хэмилтон, 2021)',
        firstRace: 2021,
        description: 'Самая быстрая уличная трасса в календаре с высочайшими средними скоростями.'
      },
      'miami': {
        type: 'street',
        length: '5.412 км',
        turns: 19,
        record: '1:29.708 (Макс Ферстаппен, 2023)',
        firstRace: 2022,
        description: 'Городская трасса вокруг стадиона Хард Рок с искусственной гаванью и пляжной атмосферой.'
      },
      'imola': {
        type: 'permanent',
        length: '4.909 км',
        turns: 19,
        record: '1:15.484 (Льюис Хэмилтон, 2020)',
        firstRace: 1980,
        description: 'Историческая трасса в регионе Эмилия-Романья, известная своей технической сложностью.'
      },
      'monaco': {
        type: 'street',
        length: '3.337 км',
        turns: 19,
        record: '1:10.166 (Льюис Хэмилтон, 2019)',
        firstRace: 1929,
        description: 'Самая престижная и знаменитая уличная трасса, проходящая по улицам Монте-Карло.'
      },
      'catalunya': {
        type: 'permanent',
        length: '4.675 км',
        turns: 16,
        record: '1:16.330 (Валттери Боттас, 2020)',
        firstRace: 1991,
        description: 'Трасса для тестирований в Барселоне, известная разнообразием поворотов и секторов.'
      },
      'villeneuve': {
        type: 'street',
        length: '4.361 км',
        turns: 14,
        record: '1:10.240 (Валттери Боттас, 2019)',
        firstRace: 1978,
        description: 'Островная трасса в Монреале, известная стеной чемпионов и непредсказуемыми гонками.'
      },
      'red_bull_ring': {
        type: 'permanent',
        length: '4.318 км',
        turns: 10,
        record: '1:02.939 (Карлос Сайнс, 2020)',
        firstRace: 1970,
        description: 'Короткая и быстрая трасса в австрийских Альпах с захватывающими дух пейзажами.'
      },
      'silverstone': {
        type: 'permanent',
        length: '5.891 км',
        turns: 18,
        record: '1:27.097 (Макс Ферстаппен, 2020)',
        firstRace: 1950,
        description: 'Историческая трасса, принимавшая первую гонку чемпионата мира Формулы-1 в 1950 году.'
      },
      'hungaroring': {
        type: 'permanent',
        length: '4.381 км',
        turns: 14,
        record: '1:13.447 (Льюис Хэмилтон, 2020)',
        firstRace: 1986,
        description: 'Извилистая трасса в Будапеште, часто сравниваемая с картинговой из-за небольшого количества обгонов.'
      },
      'spa': {
        type: 'permanent',
        length: '7.004 км',
        turns: 19,
        record: '1:41.252 (Валттери Боттас, 2018)',
        firstRace: 1925,
        description: 'Легендарная трасса в Арденнах, самая длинная в календаре, известная поворотом Эй-Руж.'
      },
      'zandvoort': {
        type: 'permanent',
        length: '4.259 км',
        turns: 14,
        record: '1:10.645 (Льюис Хэмилтон, 2021)',
        firstRace: 1952,
        description: 'Прибрежная трасса в дюнах, известная банкинговыми поворотами и оранжевой армией фанатов.'
      },
      'monza': {
        type: 'permanent',
        length: '5.793 км',
        turns: 11,
        record: '1:18.887 (Рубенс Барикелло, 2004)',
        firstRace: 1922,
        description: 'Храм скорости в Италии с самыми высокими средними скоростями в чемпионате.'
      },
      'baku': {
        type: 'street',
        length: '6.003 км',
        turns: 20,
        record: '1:40.495 (Шарль Леклер, 2019)',
        firstRace: 2016,
        description: 'Городская трасса в Баку с самой длинной прямой в календаре и узкими историческими участками.'
      },
      'marina_bay': {
        type: 'street',
        length: '4.940 км',
        turns: 23,
        record: '1:35.867 (Льюис Хэмилтон, 2018)',
        firstRace: 2008,
        description: 'Ночная уличная трасса в Сингапуре с захватывающим видом на набережную Марина Бэй.'
      },
      'cota': {
        type: 'permanent',
        length: '5.513 км',
        turns: 20,
        record: '1:36.169 (Чарльз Леклер, 2019)',
        firstRace: 2012,
        description: 'Современная трасса в Остине, вдохновленная лучшими поворотами со всего мира.'
      },
      'mexico': {
        type: 'permanent',
        length: '4.304 км',
        turns: 17,
        record: '1:14.758 (Валттери Боттас, 2018)',
        firstRace: 1963,
        description: 'Высокогорная трасса в Мехико на высоте 2285 метров, что влияет на работу двигателей и аэродинамику.'
      },
      'interlagos': {
        type: 'permanent',
        length: '4.309 км',
        turns: 15,
        record: '1:07.281 (Валттери Боттас, 2018)',
        firstRace: 1973,
        description: 'Короткая но насыщенная трасса в Сан-Паулу, известная непредсказуемой погодой и зрелищными гонками.'
      },
      'vegas': {
        type: 'street',
        length: '6.201 км',
        turns: 17,
        record: '1:33.660 (Макс Ферстаппен, 2023)',
        firstRace: 2023,
        description: 'Ночная трасса на знаменитом Лас-Вегас Стрип с захватывающими видами казино и отелей.'
      },
      'losail': {
        type: 'permanent',
        length: '5.380 км',
        turns: 16,
        record: '1:24.319 (Макс Ферстаппен, 2023)',
        firstRace: 2021,
        description: 'Современная трасса в Катаре, известная своими ослепительными ночными условиями освещения.'
      },
      'yas_marina': {
        type: 'permanent',
        length: '5.281 км',
        turns: 16,
        record: '1:23.109 (Макс Ферстаппен, 2021)',
        firstRace: 2009,
        description: 'Закатная гонка в Абу-Даби с уникальным отелем, пронизывающим трассу, и красивой подсветкой.'
      }
    };

    const loadData = async () => {
      try {
        loading.value = true;
        error.value = '';
        circuits.value = await f1Api.getCircuits();
        console.log('Загружено трасс:', circuits.value.length);
      } catch (err) {
        console.error('Ошибка загрузки данных:', err);
        error.value = 'Не удалось загрузить список трасс';
      } finally {
        loading.value = false;
      }
    };

    // Вычисляемые свойства
    const uniqueCountries = computed(() => {
      const countries = circuits.value.map(circuit => circuit.Location.country);
      return [...new Set(countries)].sort();
    });

    const streetCircuitsCount = computed(() => {
      return circuits.value.filter(circuit => 
        getCircuitType(circuit.circuitId) === 'street'
      ).length;
    });

    const permanentCircuitsCount = computed(() => {
      return circuits.value.filter(circuit => 
        getCircuitType(circuit.circuitId) === 'permanent'
      ).length;
    });

    const filteredCircuits = computed(() => {
      return circuits.value.filter(circuit => {
        const typeMatch = filterType.value === 'all' || 
          getCircuitType(circuit.circuitId) === filterType.value;
        const countryMatch = filterCountry.value === 'all' || 
          circuit.Location.country === filterCountry.value;
        
        return typeMatch && countryMatch;
      });
    });

    // Методы
    const getCircuitType = (circuitId) => {
      return circuitDetails[circuitId]?.type || 'permanent';
    };

    const getCircuitTypeText = (circuitId) => {
      const type = getCircuitType(circuitId);
      return type === 'street' ? 'Городская трасса' : 'Постоянная трасса';
    };

    const formatCoordinates = (lat, long) => {
      return `${parseFloat(lat).toFixed(4)}°, ${parseFloat(long).toFixed(4)}°`;
    };

    const getCircuitLength = (circuitId) => {
      return circuitDetails[circuitId]?.length || 'Неизвестно';
    };

    const getCircuitTurns = (circuitId) => {
      return circuitDetails[circuitId]?.turns || 'Неизвестно';
    };

    const getCircuitRecord = (circuitId) => {
      return circuitDetails[circuitId]?.record || 'Не установлен';
    };

    const getFirstRace = (circuitId) => {
      return circuitDetails[circuitId]?.firstRace || 'Неизвестно';
    };

    const getCircuitDescription = (circuitId) => {
      return circuitDetails[circuitId]?.description || 'Описание трассы временно недоступно.';
    };

    const goToCircuitDetails = (circuitId) => {
      // Пока просто переходим на страницу с информацией о трассе
      // В будущем можно создать отдельный компонент CircuitDetailsView
      console.log('Переход к трассе:', circuitId);
    };

    const clearFilters = () => {
      filterType.value = 'all';
      filterCountry.value = 'all';
    };

    onMounted(() => {
      loadData();
    });

    return {
      circuits,
      currentSeason,
      loading,
      error,
      filterType,
      filterCountry,
      uniqueCountries,
      streetCircuitsCount,
      permanentCircuitsCount,
      filteredCircuits,
      getCircuitType,
      getCircuitTypeText,
      formatCoordinates,
      getCircuitLength,
      getCircuitTurns,
      getCircuitRecord,
      getFirstRace,
      getCircuitDescription,
      goToCircuitDetails,
      clearFilters
    };
  }
};
</script>

<style scoped>
.circuits-view {
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
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
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

.filters {
  display: flex;
  gap: 1rem;
  align-items: end;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-weight: 500;
  color: #333;
  font-size: 0.9rem;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  font-size: 0.9rem;
  min-width: 150px;
}

.clear-filters-btn {
  background: #666;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  height: fit-content;
}

.clear-filters-btn:hover {
  background: #555;
}

.circuits-grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
}

.circuit-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 4px solid #e10600;
}

.circuit-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

.circuit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.circuit-type {
  font-size: 0.8rem;
  padding: 4px 8px;
  border-radius: 12px;
  font-weight: bold;
  text-transform: uppercase;
}

.circuit-type.street {
  background: #d4edda;
  color: #155724;
}

.circuit-type.permanent {
  background: #d1ecf1;
  color: #0c5460;
}

.circuit-country {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
  font-size: 0.9rem;
}

.circuit-card h3 {
  margin: 0 0 1rem 0;
  color: #1a1a1a;
  font-size: 1.3rem;
  line-height: 1.3;
}

.circuit-location {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.location-icon {
  font-size: 1.5rem;
  display: flex;
  align-items: flex-start;
}

.location-info {
  flex: 1;
}

.locality {
  font-weight: bold;
  color: #333;
  margin-bottom: 0.25rem;
}

.coordinates {
  font-size: 0.8rem;
  color: #666;
  font-family: 'Courier New', monospace;
}

.circuit-details {
  margin-bottom: 1.5rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f0f0f0;
}

.detail-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.label {
  font-weight: 500;
  color: #666;
  font-size: 0.9rem;
}

.value {
  font-weight: bold;
  color: #1a1a1a;
  text-align: right;
  font-size: 0.9rem;
}

.circuit-description {
  color: #555;
  line-height: 1.5;
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.circuit-actions {
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

.no-results {
  text-align: center;
  padding: 3rem;
  color: #666;
  font-size: 1.1rem;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

/* Адаптивность */
@media (max-width: 768px) {
  .circuits-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-bar {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-group {
    width: 100%;
  }
  
  .filter-select {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .circuits-view {
    padding: 10px;
  }
  
  h1 {
    font-size: 2rem;
  }
  
  .circuit-card {
    padding: 1rem;
  }
  
  .circuit-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>