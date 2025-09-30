<template>
  <div class="constructors-view">
    <h1>Команды Формулы 1 {{ currentSeason }}</h1>
    <div class="constructors-grid">
      <div v-for="constructor in constructors" :key="constructor.constructorId" class="constructor-card">
        <h3>{{ constructor.name }}</h3>
        <p>Национальность: {{ constructor.nationality }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import f1Api from '../services/f1Api';

export default {
  name: 'ConstructorsView',
  setup() {
    const constructors = ref([]);
    const currentSeason = ref(new Date().getFullYear());

    const loadData = async () => {
      try {
        constructors.value = await f1Api.getConstructors();
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      }
    };

    onMounted(() => {
      loadData();
    });

    return {
      constructors,
      currentSeason
    };
  }
};
</script>