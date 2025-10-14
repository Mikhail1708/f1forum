<template>
  <div class="constructor-details-view">
    <button @click="$router.push('/constructors')" class="back-btn">← Назад к командам</button>
    
    <div v-if="loading" class="loading">Загрузка информации о команде...</div>
    
    <div v-else-if="constructor" class="constructor-details">
      <!-- Шапка команды -->
      <div class="constructor-header" :style="headerStyle">
        <div class="header-content">
          <div class="constructor-logo">
            <img :src="getLogoUrl(constructor.constructorId)" :alt="constructor.name" @error="handleImageError">
          </div>
          <div class="constructor-title">
            <h1>{{ constructor.name }}</h1>
            <div class="constructor-meta">
              <span class="nationality">
                <span class="flag">🏁</span>
                {{ getNationalityText(constructor.nationality) }}
              </span>
              <span class="founded">Основана в {{ getFoundedYear(constructor.constructorId) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Основная информация -->
      <div class="content-grid">
        <!-- Левая колонка - общая информация -->
        <div class="info-section">
          <h2>Общая информация</h2>
          <div class="info-cards">
            <div class="info-card">
              <div class="info-icon">🏢</div>
              <div class="info-content">
                <h3>Штаб-квартира</h3>
                <p>{{ getHeadquarters(constructor.constructorId) }}</p>
              </div>
            </div>
            
            <div class="info-card">
              <div class="info-icon">⚙️</div>
              <div class="info-content">
                <h3>Двигатель</h3>
                <p>{{ getEngine(constructor.constructorId) }}</p>
              </div>
            </div>
            
            <div class="info-card">
              <div class="info-icon">🏆</div>
              <div class="info-content">
                <h3>Чемпионства конструкторов</h3>
                <p>{{ getChampionships(constructor.constructorId) }}</p>
              </div>
            </div>
            
            <div class="info-card">
              <div class="info-icon">🚀</div>
              <div class="info-content">
                <h3>Дебют в Ф1</h3>
                <p>{{ getFirstSeason(constructor.constructorId) }}</p>
              </div>
            </div>
          </div>

          <!-- Достижения -->
          <div class="achievements-section">
            <h2>Достижения</h2>
            <div class="achievements-grid">
              <div class="achievement">
                <span class="achievement-number">{{ getChampionships(constructor.constructorId) }}</span>
                <span class="achievement-label">Кубков конструкторов</span>
              </div>
              <div class="achievement">
                <span class="achievement-number">{{ getWins(constructor.constructorId) }}</span>
                <span class="achievement-label">Побед в гонках</span>
              </div>
              <div class="achievement">
                <span class="achievement-number">{{ getPoles(constructor.constructorId) }}</span>
                <span class="achievement-label">Поулов</span>
              </div>
              <div class="achievement">
                <span class="achievement-number">{{ getPodiums(constructor.constructorId) }}</span>
                <span class="achievement-label">Подиумов</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Правая колонка - текущий сезон -->
        <div class="season-section">
          <h2>Текущий сезон ({{ currentSeason }})</h2>
          
          <!-- Позиция в чемпионате -->
          <div class="standing-card">
            <div class="standing-header">
              <h3>Позиция в чемпионате</h3>
              <div class="standing-position">#{{ constructorStanding?.position || '-' }}</div>
            </div>
            <div class="standing-details">
              <div class="points">
                <span class="points-value">{{ constructorStanding?.points || '0' }}</span>
                <span class="points-label">очков</span>
              </div>
              <div class="wins">
                <span class="wins-value">{{ constructorStanding?.wins || '0' }}</span>
                <span class="wins-label">побед</span>
              </div>
            </div>
          </div>

          <!-- Пилоты команды -->
          <div class="drivers-section">
            <h3>Пилоты команды</h3>
            <div class="drivers-list">
              <div 
                v-for="driver in getTeamDrivers(constructor.constructorId)" 
                :key="driver.driverId" 
                class="driver-card"
                @click="goToDriverDetails(driver.driverId)"
              >
                <div class="driver-number">{{ driver.permanentNumber }}</div>
                <div class="driver-info">
                  <div class="driver-name">{{ driver.givenName }} {{ driver.familyName }}</div>
                  <div class="driver-code">{{ driver.code }}</div>
                </div>
                <div class="driver-nationality">{{ getNationalityText(driver.nationality) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- История команды -->
      <div class="history-section">
        <h2>История команды</h2>
        <p class="team-history">{{ getTeamHistory(constructor.constructorId) }}</p>
      </div>
    </div>

    <div v-else class="error-message">
      {{ error || 'Команда не найдена' }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import f1Api from '../services/f1Api';

const route = useRoute();
const router = useRouter();
const constructor = ref(null);
const loading = ref(true);
const error = ref('');
const allDrivers = ref([]);
const constructorStanding = ref(null);
const currentSeason = ref(new Date().getFullYear());

// Расширенные данные о командах с полными описаниями
const constructorExtendedData = {
  'mercedes': {
    founded: 2010,
    headquarters: 'Бракли, Великобритания',
    engine: 'Mercedes',
    championships: 8,
    firstSeason: 2010,
    wins: 116,
    poles: 128,
    podiums: 268,
    colors: ['#00D2BE', '#000000'],
    drivers: ['hamilton', 'russell'],
    history: 'Mercedes-AMG Petronas Formula One Team - немецкая команда, доминировавшая в Формуле-1 в гибридную эру. Под руководством Тото Вольффа команда выиграла 8 подряд чемпионатов конструкторов с 2014 по 2021 год. Команда известна своими инновационными техническими решениями и одной из самых сильных структур в чемпионате.'
  },
  'ferrari': {
    founded: 1929,
    headquarters: 'Маранелло, Италия',
    engine: 'Ferrari',
    championships: 16,
    firstSeason: 1950,
    wins: 243,
    poles: 249,
    podiums: 800,
    colors: ['#DC0000', '#FFFFFF'],
    drivers: ['leclerc', 'sainz'],
    history: 'Scuderia Ferrari - самая старая и успешная команда в истории Формулы-1, участвующая в чемпионате с самого его основания в 1950 году. Команда является символом итальянского автоспорта и имеет огромную армию поклонников по всему миру. Ferrari - единственная команда, участвовавшая во всех сезонах чемпионата мира Формулы-1.'
  },
  'red_bull': {
    founded: 2005,
    headquarters: 'Милтон-Кинс, Великобритания',
    engine: 'Honda RBPT',
    championships: 5,
    firstSeason: 2005,
    wins: 116,
    poles: 95,
    podiums: 258,
    colors: ['#0600EF', '#FFFFFF'],
    drivers: ['max_verstappen', 'perez'],
    history: 'Red Bull Racing - австрийская команда, приобретенная Dietrich Mateschitz в 2005 году. Доминировала в чемпионате с 2010 по 2013 годы под руководством Эдриана Ньюи и с 2022 года с Максом Ферстаппеном. Команда известна своим агрессивным стилем и инновационным подходом к аэродинамике.'
  },
  'mclaren': {
    founded: 1963,
    headquarters: 'Уокинг, Великобритания',
    engine: 'Mercedes',
    championships: 8,
    firstSeason: 1966,
    wins: 183,
    poles: 156,
    podiums: 493,
    colors: ['#FF8700', '#000000'],
    drivers: ['norris', 'piastri'],
    history: 'McLaren - одна из самых успешных и исторически значимых команд в Формуле-1, основанная Брюсом Маклареном. Команда выиграла множество чемпионатов с такими легендами как Айртон Сенна, Ален Прост и Мика Хаккинен. В 2020-х годах команда пережила возрождение под руководством Андреа Стеллы.'
  },
  'alpine': {
    founded: 1986,
    headquarters: 'Энстоун, Великобритания',
    engine: 'Renault',
    championships: 2,
    firstSeason: 1986,
    wins: 21,
    poles: 20,
    podiums: 67,
    colors: ['#0090FF', '#FFFFFF'],
    drivers: ['gasly', 'ocon'],
    history: 'Alpine F1 Team - французская команда, представляющая автомобильный бренд Renault. Команда имеет богатую историю, начиная с выступлений как Toleman, Benetton и Renault. Под разными названиями команда добивалась успехов, включая чемпионские титулы с Михаэлем Шумахером в 1990-х годах.'
  },
  'aston_martin': {
    founded: 2018,
    headquarters: 'Сильверстоун, Великобритания',
    engine: 'Mercedes',
    championships: 0,
    firstSeason: 2018,
    wins: 0,
    poles: 1,
    podiums: 9,
    colors: ['#006F62', '#FFFFFF'],
    drivers: ['alonso', 'stroll'],
    history: 'Aston Martin - британская команда, вернувшаяся в Формулу-1 в 2018 году под руководством Лоуренса Стролла. Команда показала значительный прогресс в 2023 году, став регулярным претендентом на подиумы. Бренд Aston Martin имеет богатую историю в автоспорте, восходящую к 1920-м годам.'
  },
  'williams': {
    founded: 1977,
    headquarters: 'Гров, Великобритания',
    engine: 'Mercedes',
    championships: 9,
    firstSeason: 1978,
    wins: 114,
    poles: 128,
    podiums: 313,
    colors: ['#005AFF', '#FFFFFF'],
    drivers: ['albon', 'sargeant'],
    history: 'Williams Grand Prix Engineering - легендарная британская команда, основанная сэром Фрэнком Уильямсом. В 1980-х и 1990-х годах команда доминировала в чемпионате, выиграв 9 чемпионатов конструкторов. Команда известна тем, что открыла многих будущих чемпионов мира, включая Найджела Мэнселла, Деймона Хилла и Жака Вильнёва.'
  },
  'rb': {
    founded: 2006,
    headquarters: 'Фаэнца, Италия',
    engine: 'Honda RBPT',
    championships: 0,
    firstSeason: 2006,
    wins: 0,
    poles: 0,
    podiums: 0,
    colors: ['#6692FF', '#000000'],
    drivers: ['tsunoda', 'ricciardo'],
    history: 'RB F1 Team (ранее известная как Toro Rosso и AlphaTauri) - итальянская команда, входящая в состав Red Bull GmbH. Команда служит трамплином для молодых пилотов академии Red Bull. Наиболее известным успехом команды является победа с Себастьяном Феттелем на Гран-при Италии 2008 года.'
  },
  'sauber': {
    founded: 1993,
    headquarters: 'Хинвиль, Швейцария',
    engine: 'Ferrari',
    championships: 0,
    firstSeason: 1993,
    wins: 1,
    poles: 1,
    podiums: 5,
    colors: ['#52E252', '#000000'],
    drivers: ['bottas', 'zhou'],
    history: 'Sauber Motorsport - швейцарская команда с богатой историей в Формуле-1. Команда известна своими выступлениями под разными названиями, включая BMW Sauber. В 2026 году команда превратится в заводскую команду Audi. Sauber всегда славилась своей технической компетентностью и стабильными выступлениями.'
  },
  'haas': {
    founded: 2016,
    headquarters: 'Каннаполис, США',
    engine: 'Ferrari',
    championships: 0,
    firstSeason: 2016,
    wins: 0,
    poles: 0,
    podiums: 0,
    colors: ['#FFFFFF', '#FF0000'],
    drivers: ['magnussen', 'hulkenberg'],
    history: 'Haas F1 Team - американская команда, основанная Джином Хаасом. Команда дебютировала в 2016 году и известна своей уникальной бизнес-моделью, основанной на тесном техническом партнерстве с Ferrari и Dallara. Несмотря на скромный бюджет, команда регулярно показывает конкурентные результаты в середине пелотона.'
  }
};

// Карта соответствия driverId для команд 2025 года (на основе реальных данных)
const teamDrivers2025 = {
  'mercedes': ['russell', 'antonelli'],
  'ferrari': ['leclerc', 'hamilton'],
  'red_bull': ['max_verstappen', 'lawson'],
  'mclaren': ['norris', 'piastri'],
  'alpine': ['gasly', 'doohan'],
  'aston_martin': ['alonso', 'stroll'],
  'williams': ['albon', 'sainz'],
  'rb': ['tsunoda', 'hadjar'],
  'sauber': ['bortoleto', 'hulkenberg'],
  'haas': ['ocon', 'bearman']
};

const nationalityMap = {
  'British': 'Великобритания',
  'Italian': 'Италия', 
  'German': 'Германия',
  'French': 'Франция',
  'Swiss': 'Швейцария',
  'American': 'США',
  'Austrian': 'Австрия',
  'Dutch': 'Нидерланды',
  'Mexican': 'Мексика',
  'Spanish': 'Испания',
  'Canadian': 'Канада',
  'Thai': 'Таиланд',
  'Japanese': 'Япония',
  'Australian': 'Австралия',
  'Chinese': 'Китай',
  'Monegasque': 'Монако',
  'Finnish': 'Финляндия',
  'Brazilian': 'Бразилия',
  'New Zealander': 'Новая Зеландия',
  'Danish': 'Дания'
};

// Загрузка данных
const loadConstructorData = async () => {
  const constructorId = route.params.id;
  try {
    loading.value = true;
    error.value = '';

    constructor.value = await f1Api.getConstructorDetails(constructorId);
    
    // Загружаем всех пилотов
    allDrivers.value = await f1Api.getDrivers();

    // Загружаем позицию в чемпионате
    const standings = await f1Api.getConstructorStandings();
    constructorStanding.value = standings.find(standing => 
      standing.Constructor.constructorId === constructorId
    );

  } catch (err) {
    console.error('Ошибка загрузки данных команды:', err);
    error.value = 'Не удалось загрузить данные команды';
  } finally {
    loading.value = false;
  }
};

// Вычисляемые свойства
const headerStyle = computed(() => {
  const colors = constructorExtendedData[constructor.value?.constructorId]?.colors || ['#666666', '#FFFFFF'];
  return {
    background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`
  };
});

// Методы
const getLogoUrl = (constructorId) => {
  return `/logos/constructors/${constructorId}.png`;
};

const handleImageError = (event) => {
  event.target.src = '/logos/constructors/default.png';
};

const getNationalityText = (nationality) => {
  return nationalityMap[nationality] || nationality;
};

const getFoundedYear = (constructorId) => {
  return constructorExtendedData[constructorId]?.founded || 'Неизвестно';
};

const getHeadquarters = (constructorId) => {
  return constructorExtendedData[constructorId]?.headquarters || 'Неизвестно';
};

const getEngine = (constructorId) => {
  return constructorExtendedData[constructorId]?.engine || 'Неизвестно';
};

const getChampionships = (constructorId) => {
  return constructorExtendedData[constructorId]?.championships || 0;
};

const getFirstSeason = (constructorId) => {
  return constructorExtendedData[constructorId]?.firstSeason || 'Неизвестно';
};

const getWins = (constructorId) => {
  return constructorExtendedData[constructorId]?.wins || 0;
};

const getPoles = (constructorId) => {
  return constructorExtendedData[constructorId]?.poles || 0;
};

const getPodiums = (constructorId) => {
  return constructorExtendedData[constructorId]?.podiums || 0;
};

const getTeamHistory = (constructorId) => {
  return constructorExtendedData[constructorId]?.history || 'Информация об истории команды временно недоступна.';
};

const getTeamDrivers = (constructorId) => {
  const driverIds = teamDrivers2025[constructorId] || [];
  return allDrivers.value.filter(driver => driverIds.includes(driver.driverId));
};

const goToDriverDetails = (driverId) => {
  router.push(`/drivers/${driverId}`);
};

onMounted(() => {
  loadConstructorData();
});
</script>

<style scoped>
/* Стили остаются без изменений, как в предыдущей версии */
.constructor-details-view {
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

.loading {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 6px;
  text-align: center;
}

.constructor-header {
  color: white;
  padding: 3rem 2rem;
  border-radius: 15px;
  margin-bottom: 2rem;
  position: relative;
  overflow: hidden;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 2rem;
  position: relative;
  z-index: 2;
}

.constructor-logo {
  width: 120px;
  height: 120px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  padding: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.constructor-logo img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.constructor-title h1 {
  margin: 0 0 1rem 0;
  color: white;
  font-size: 2.5rem;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.constructor-meta {
  display: flex;
  gap: 2rem;
  font-size: 1.1rem;
}

.nationality, .founded {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.2);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  backdrop-filter: blur(10px);
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 2rem;
  margin-bottom: 2rem;
}

.info-section h2,
.season-section h2 {
  color: #e10600;
  margin-bottom: 1.5rem;
}

.info-cards {
  display: grid;
  gap: 1rem;
  margin-bottom: 2rem;
}

.info-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.info-icon {
  font-size: 2rem;
  width: 60px;
  text-align: center;
}

.info-content h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.info-content p {
  margin: 0;
  color: #666;
  font-weight: 500;
}

.achievements-section {
  background: white;
  padding: 1.5rem;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.achievement {
  text-align: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.achievement-number {
  display: block;
  font-size: 2rem;
  font-weight: bold;
  color: #e10600;
  margin-bottom: 0.5rem;
}

.achievement-label {
  font-size: 0.9rem;
  color: #666;
}

.standing-card {
  background: white;
  padding: 1.5rem;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.standing-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.standing-header h3 {
  margin: 0;
  color: #333;
}

.standing-position {
  font-size: 2rem;
  font-weight: bold;
  color: #e10600;
}

.standing-details {
  display: flex;
  gap: 2rem;
}

.points, .wins {
  text-align: center;
}

.points-value, .wins-value {
  display: block;
  font-size: 2rem;
  font-weight: bold;
  color: #333;
}

.points-label, .wins-label {
  font-size: 0.9rem;
  color: #666;
}

.drivers-section {
  background: white;
  padding: 1.5rem;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.drivers-section h3 {
  margin: 0 0 1rem 0;
  color: #333;
}

.drivers-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.driver-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.driver-card:hover {
  background: #e9ecef;
}

.driver-number {
  width: 40px;
  height: 40px;
  background: #e10600;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.driver-info {
  flex: 1;
}

.driver-name {
  font-weight: bold;
  color: #333;
}

.driver-code {
  color: #666;
  font-size: 0.9rem;
}

.driver-nationality {
  color: #666;
  font-size: 0.9rem;
}

.history-section {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.history-section h2 {
  color: #e10600;
  margin-bottom: 1rem;
}

.team-history {
  line-height: 1.6;
  color: #555;
  margin: 0;
}

@media (max-width: 768px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
  
  .header-content {
    flex-direction: column;
    text-align: center;
  }
  
  .constructor-meta {
    flex-direction: column;
    gap: 1rem;
  }
  
  .achievements-grid {
    grid-template-columns: 1fr;
  }
  
  .standing-details {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>