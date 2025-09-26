<template>
  <div class="drivers-view">
    <h1>Пилоты Формулы 1 {{ currentSeason }}</h1>
    <div class="drivers-grid">
      <div v-for="driver in drivers" :key="driver.driverId" class="driver-card">
        <div class="driver-number">{{ driver.permanentNumber }}</div>
        <div class="driver-name">{{ driver.givenName }} {{ driver.familyName }}</div>
        <div class="driver-team">{{ getConstructorName(driver.constructorId) }}</div>
        <div class="driver-nationality">{{ driver.nationality }}</div>
        <button @click="viewDriverDetails(driver.driverId)">Подробнее</button>
      </div>
    </div>
  </div>
</template>

<script>
import f1Api from '../services/f1Api'; // вместо '@/services/f1Api'

export default {
  name: 'DriversView',
  data() {
    return {
      drivers: [],
      constructors: [],
      currentSeason: new Date().getFullYear()
    };
  },
  async mounted() {
    await this.loadData();
  },
  methods: {
    async loadData() {
      try {
        this.drivers = await f1Api.getDrivers();
        this.constructors = await f1Api.getConstructors();
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      }
    },
    getConstructorName(constructorId) {
      const constructor = this.constructors.find(c => c.constructorId === constructorId);
      return constructor ? constructor.name : 'Неизвестно';
    },
    viewDriverDetails(driverId) {
      this.$router.push(`/driver/${driverId}`);
    }
  }
};
</script>

<style scoped>
.drivers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  padding: 20px;
}

.driver-card {
  border: 1px solid #ccc;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
}
</style>