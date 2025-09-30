<template>
  <div class="drivers-view">
    <h1>Пилоты Формулы 1 {{ currentSeason }}</h1>
    <div class="drivers-grid">
      <div v-for="driver in drivers" :key="driver.driverId" class="driver-card">
        <div class="driver-number">{{ driver.permanentNumber }}</div>
        <div class="driver-name">{{ driver.givenName }} {{ driver.familyName }}</div>
        <div class="driver-team">{{ getConstructorName(driver.constructorId) }}</div>
        <div class="driver-nationality">{{ driver.nationality }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import f1Api from '../services/f1Api';

export default {
  name: 'DriversView',
  setup() {
    const drivers = ref([]);
    const constructors = ref([]);
    const currentSeason = ref(new Date().getFullYear());

    const loadData = async () => {
      try {
        drivers.value = await f1Api.getDrivers();
        constructors.value = await f1Api.getConstructors();
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      }
    };

    const getConstructorName = (constructorId) => {
      const constructor = constructors.value.find(c => c.constructorId === constructorId);
      return constructor ? constructor.name : 'Неизвестно';
    };

    onMounted(() => {
      loadData();
    });

    return {
      drivers,
      constructors,
      currentSeason,
      getConstructorName
    };
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