<template>
  <div class="circuits-view">
    <h1>Трассы Формулы 1 {{ currentSeason }}</h1>
    <div class="circuits-grid">
      <div v-for="circuit in circuits" :key="circuit.circuitId" class="circuit-card">
        <h3>{{ circuit.circuitName }}</h3>
        <p>Страна: {{ circuit.Location.country }}</p>
        <p>Город: {{ circuit.Location.locality }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import f1Api from '../services/f1Api';

export default {
  name: 'CircuitsView',
  setup() {
    const circuits = ref([]);
    const currentSeason = ref(new Date().getFullYear());

    const loadData = async () => {
      try {
        circuits.value = await f1Api.getCircuits();
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      }
    };

    onMounted(() => {
      loadData();
    });

    return {
      circuits,
      currentSeason
    };
  }
};
</script>