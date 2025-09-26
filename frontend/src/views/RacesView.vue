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
        <button @click="viewRaceDetails(race.round)">Подробнее</button>
      </div>
    </div>
  </div>
</template>

<script>
import f1Api from '../services/f1Api'; // вместо '@/services/f1Api'

export default {
  name: 'RacesView',
  data() {
    return {
      races: [],
      currentSeason: new Date().getFullYear()
    };
  },
  async mounted() {
    await this.loadData();
  },
  methods: {
    async loadData() {
      try {
        this.races = await f1Api.getCalendar();
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      }
    },
    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString('ru-RU');
    },
    viewRaceDetails(round) {
      this.$router.push(`/race/${round}`);
    }
  }
};
</script>