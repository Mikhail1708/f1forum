<template>
  <div class="circuits-view">
    <h1>Трассы Формулы 1 {{ currentSeason }}</h1>
    <div class="circuits-grid">
      <div v-for="circuit in circuits" :key="circuit.circuitId" class="circuit-card">
        <h3>{{ circuit.circuitName }}</h3>
        <p>Страна: {{ circuit.Location.country }}</p>
        <p>Город: {{ circuit.Location.locality }}</p>
        <button @click="viewCircuitDetails(circuit.circuitId)">Подробнее</button>
      </div>
    </div>
  </div>
</template>

<script>
import f1Api from '../services/f1Api'; // вместо '@/services/f1Api'

export default {
  name: 'CircuitsView',
  data() {
    return {
      circuits: [],
      currentSeason: new Date().getFullYear()
    };
  },
  async mounted() {
    await this.loadData();
  },
  methods: {
    async loadData() {
      try {
        this.circuits = await f1Api.getCircuits();
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      }
    },
    viewCircuitDetails(circuitId) {
      this.$router.push(`/circuit/${circuitId}`);
    }
  }
};
</script>