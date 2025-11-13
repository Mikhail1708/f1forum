<template>
  <div class="next-gp-card">
    <div class="card-header">
      <h2>Ближайший Гран-при: {{ nextGP?.title }}</h2>
    </div>
    <div class="card-body">
      <div class="gp-info">
        <h3>{{ nextGP?.track }}, {{ nextGP?.country }}</h3>
        <p class="date">
          <i class="fa fa-calendar"></i> 
          {{ formatDate(nextGP?.event_date) }}
        </p>
        <p class="description">{{ nextGP?.description }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../services/api';

const nextGP = ref(null);

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString('ru-RU');
};

const fetchNextGrandPrix = async () => {
  try {
    const response = await api.get('/grand-prix/next');
    nextGP.value = response.data.data;
  } catch (error) {
    console.error('Ошибка загрузки Гран-при:', error);
  }
};

onMounted(() => {
  fetchNextGrandPrix();
});
</script>

<style scoped>
.next-gp-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.card-header {
  background: #e10600;
  color: white;
  padding: 1rem;
  border-radius: 8px 8px 0 0;
}

.card-header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.card-body {
  padding: 1.5rem;
}

.gp-info h3 {
  color: #333;
  margin-bottom: 0.5rem;
}

.date {
  color: #666;
  font-size: 0.9rem;
}

.description {
  color: #444;
  line-height: 1.5;
}
</style>