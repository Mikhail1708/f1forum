<template>
  <div class="races-view">
    <h1>Календарь гонок {{ currentSeason }}</h1>
    <div class="races-list">
      <div v-for="race in races" :key="race.round" class="race-card">
        <div class="race-round">Раунд {{ race.round }}</div>
        <h3>{{ race.raceName }}</h3>
        <p>Трасса: {{ race.Circuit.circuitName }}</p>
        <p>Дата: {{ formatDate(race.date) }}</p>
        <p>Страна: {{ race.Circuit.Location.country }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import f1Api from '../services/f1Api';

export default {
  name: 'RacesView',
  setup() {
    const races = ref([]);
    const currentSeason = ref(new Date().getFullYear());

    const loadData = async () => {
      try {
        races.value = await f1Api.getCalendar();
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      }
    };

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('ru-RU');
    };

    onMounted(() => {
      loadData();
    });

    return {
      races,
      currentSeason,
      formatDate
    };
  }
};
</script>