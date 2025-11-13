<template>
  <div class="races-view">
    <h1>Календарь гонок {{ currentSeason }}</h1>
    
    <div class="stats-bar">
      <div class="stat">
        <span class="stat-number">{{ races.length }}</span>
        <span class="stat-label">Всего гонок</span>
      </div>
      <div class="stat">
        <span class="stat-number">{{ completedRacesCount }}</span>
        <span class="stat-label">Завершено</span>
      </div>
      <div class="stat">
        <span class="stat-number">{{ upcomingRacesCount }}</span>
        <span class="stat-label">Предстоящих</span>
      </div>
    </div>

    <div class="races-list">
      <div 
        v-for="race in races" 
        :key="race.round" 
        class="race-card"
        :class="{
          'completed': isRaceCompleted(race.date),
          'upcoming': isRaceUpcoming(race.date),
          'next-race': isNextRace(race.round)
        }"
        @click="goToRaceDetails(race.round)"
      >
        <div class="race-header">
          <div class="race-round">Раунд {{ race.round }}</div>
          <div class="race-status" :class="getRaceStatus(race.date)">
            {{ getRaceStatusText(race.date) }}
          </div>
        </div>
        
        <h3>{{ race.raceName }}</h3>
        
        <div class="race-circuit">
          <span class="circuit-name">{{ race.Circuit.circuitName }}</span>
          <span class="circuit-location">{{ race.Circuit.Location.locality }}, {{ race.Circuit.Location.country }}</span>
        </div>
        
        <div class="race-date">
          <span class="date-icon">📅</span>
          {{ formatDate(race.date) }}
          <span v-if="race.time" class="race-time">
            • {{ formatTime(race.time) }}
          </span>
        </div>

        <div class="race-sessions" v-if="race.FirstPractice">
          <div class="session">
            <span class="session-type">FP1:</span>
            {{ formatSessionDate(race.FirstPractice) }}
          </div>
          <div class="session" v-if="race.SecondPractice">
            <span class="session-type">FP2:</span>
            {{ formatSessionDate(race.SecondPractice) }}
          </div>
          <div class="session" v-if="race.ThirdPractice">
            <span class="session-type">FP3:</span>
            {{ formatSessionDate(race.ThirdPractice) }}
          </div>
          <div class="session" v-if="race.Qualifying">
            <span class="session-type">Квалификация:</span>
            {{ formatSessionDate(race.Qualifying) }}
          </div>
        </div>

        <div class="race-actions">
          <button class="details-btn" @click.stop="goToRaceDetails(race.round)">
            Смотреть детали →
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading">Загрузка календаря...</div>
    <div v-if="error" class="error-message">{{ error }}</div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import f1Api from '../services/f1Api';

export default {
  name: 'RacesView',
  setup() {
    const router = useRouter();
    const races = ref([]);
    const currentSeason = ref(new Date().getFullYear());
    const loading = ref(true);
    const error = ref('');

    const loadData = async () => {
      try {
        loading.value = true;
        error.value = '';
        races.value = await f1Api.getCalendar();
        console.log('Загружено гонок:', races.value.length);
      } catch (err) {
        console.error('Ошибка загрузки данных:', err);
        error.value = 'Не удалось загрузить календарь гонок';
      } finally {
        loading.value = false;
      }
    };

    // Вычисляемые свойства
    const completedRacesCount = computed(() => {
      return races.value.filter(race => isRaceCompleted(race.date)).length;
    });

    const upcomingRacesCount = computed(() => {
      return races.value.filter(race => isRaceUpcoming(race.date)).length;
    });

    // Методы
    const formatDate = (dateString) => {
      if (!dateString) return 'Дата не указана';
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } catch (e) {
        return dateString;
      }
    };

    const formatTime = (timeString) => {
      if (!timeString) return '';
      try {
        // Убираем 'Z' и преобразуем в локальное время
        const time = timeString.replace('Z', '');
        return new Date(`1970-01-01T${time}`).toLocaleTimeString('ru-RU', {
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (e) {
        return timeString;
      }
    };

    const formatSessionDate = (session) => {
      if (!session || !session.date) return '';
      try {
        const date = new Date(session.date);
        return date.toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'short'
        }) + (session.time ? ` ${formatTime(session.time)}` : '');
      } catch (e) {
        return session.date;
      }
    };

    const isRaceCompleted = (raceDate) => {
      if (!raceDate) return false;
      return new Date(raceDate) < new Date();
    };

    const isRaceUpcoming = (raceDate) => {
      if (!raceDate) return false;
      return new Date(raceDate) > new Date();
    };

    const isNextRace = (round) => {
      // Находим первую предстоящую гонку
      const upcomingRaces = races.value.filter(race => isRaceUpcoming(race.date));
      if (upcomingRaces.length === 0) return false;
      return upcomingRaces[0].round === round.toString();
    };

    const getRaceStatus = (raceDate) => {
      if (isRaceCompleted(raceDate)) return 'completed';
      if (isRaceUpcoming(raceDate)) return 'upcoming';
      return 'unknown';
    };

    const getRaceStatusText = (raceDate) => {
      if (isRaceCompleted(raceDate)) return 'Завершена';
      if (isRaceUpcoming(raceDate)) return 'Предстоящая';
      return 'Дата неизвестна';
    };

    const goToRaceDetails = (round) => {
      router.push(`/races/${round}`);
    };

    onMounted(() => {
      loadData();
    });

    return {
      races,
      currentSeason,
      loading,
      error,
      completedRacesCount,
      upcomingRacesCount,
      formatDate,
      formatTime,
      formatSessionDate,
      isRaceCompleted,
      isRaceUpcoming,
      isNextRace,
      getRaceStatus,
      getRaceStatusText,
      goToRaceDetails
    };
  }
};
</script>

<style scoped>
.races-view {
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

.races-list {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
}

.race-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 4px solid #e10600;
}

.race-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

.race-card.completed {
  border-left-color: #28a745;
  opacity: 0.8;
}

.race-card.upcoming {
  border-left-color: #17a2b8;
}

.race-card.next-race {
  border-left-color: #ffc107;
  background: linear-gradient(135deg, #fff8e1, #ffffff);
}

.race-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.race-round {
  font-weight: bold;
  color: #e10600;
  font-size: 0.9rem;
}

.race-status {
  font-size: 0.8rem;
  padding: 4px 8px;
  border-radius: 12px;
  font-weight: bold;
}

.race-status.completed {
  background: #d4edda;
  color: #155724;
}

.race-status.upcoming {
  background: #d1ecf1;
  color: #0c5460;
}

.race-card h3 {
  margin: 0 0 1rem 0;
  color: #1a1a1a;
  font-size: 1.3rem;
}

.race-circuit {
  margin-bottom: 1rem;
}

.circuit-name {
  display: block;
  font-weight: bold;
  color: #333;
  margin-bottom: 0.25rem;
}

.circuit-location {
  display: block;
  color: #666;
  font-size: 0.9rem;
}

.race-date {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  color: #555;
  font-weight: 500;
}

.date-icon {
  margin-right: 0.5rem;
}

.race-time {
  margin-left: 0.5rem;
  color: #888;
  font-size: 0.9rem;
}

.race-sessions {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
}

.session {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.session:last-child {
  margin-bottom: 0;
}

.session-type {
  font-weight: bold;
  color: #e10600;
}

.race-actions {
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
  .races-list {
    grid-template-columns: 1fr;
  }
  
  .stats-bar {
    flex-direction: column;
    gap: 1rem;
  }
  
  .race-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}

@media (max-width: 480px) {
  .races-view {
    padding: 10px;
  }
  
  h1 {
    font-size: 2rem;
  }
  
  .race-card {
    padding: 1rem;
  }
}
</style>