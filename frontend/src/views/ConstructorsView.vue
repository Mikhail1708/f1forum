<template>
  <div class="constructors-view">
    <h1>Команды Формулы 1 {{ currentSeason }}</h1>
    <div class="constructors-grid">
      <div v-for="constructor in constructors" :key="constructor.constructorId" class="constructor-card">
        <h3>{{ constructor.name }}</h3>
        <p>Национальность: {{ constructor.nationality }}</p>
        <p>Пилоты: {{ getConstructorDrivers(constructor.constructorId).join(', ') }}</p>
        <button @click="viewConstructorDetails(constructor.constructorId)">Подробнее</button>
      </div>
    </div>
  </div>
</template>

<script>
import f1Api from '../services/f1Api'; // вместо '@/services/f1Api'

export default {
  name: 'ConstructorsView',
  data() {
    return {
      constructors: [],
      drivers: [],
      currentSeason: new Date().getFullYear()
    };
  },
  async mounted() {
    await this.loadData();
  },
  methods: {
    async loadData() {
      try {
        this.constructors = await f1Api.getConstructors();
        this.drivers = await f1Api.getDrivers();
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      }
    },
    getConstructorDrivers(constructorId) {
      return this.drivers
        .filter(driver => driver.constructorId === constructorId)
        .map(driver => `${driver.givenName} ${driver.familyName}`);
    },
    viewConstructorDetails(constructorId) {
      this.$router.push(`/constructor/${constructorId}`);
    }
  }
};
</script>