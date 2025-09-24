<template>
  <div class="calendar">
    <div class="calendar-header">
      <h2>Календарь событий Формулы-1</h2>
    </div>
    <div class="calendar-body">
      <table v-if="events.length" class="events-table">
        <thead>
          <tr>
            <th>Гран-при</th>
            <th>Трасса</th>
            <th>Страна</th>
            <th>Дата и время</th>
            <th>Статус</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="event in events" :key="event.id">
            <td><strong>{{ event.title }}</strong></td>
            <td>{{ event.track }}</td>
            <td>{{ event.country }}</td>
            <td>{{ formatDate(event.event_date) }}</td>
            <td>
              <span class="status-badge" :class="getStatusClass(event)">
                {{ getStatusText(event) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else class="no-events">Нет запланированных событий</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../services/api';

const events = ref([]);

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString('ru-RU');
};

const getStatusClass = (event) => {
  const now = new Date();
  const eventDate = new Date(event.event_date);
  
  if (event.is_completed) return 'completed';
  if (eventDate < now) return 'completed';
  if (events.value[0]?.id === event.id) return 'next';
  return 'upcoming';
};

const getStatusText = (event) => {
  const now = new Date();
  const eventDate = new Date(event.event_date);
  
  if (event.is_completed || eventDate < now) return 'Завершен';
  if (events.value[0]?.id === event.id) return 'Ближайший';
  return 'Предстоящий';
};

const fetchUpcomingEvents = async () => {
  try {
    const response = await api.get('/grand-prix/upcoming');
    events.value = response.data.data || [];
  } catch (error) {
    console.error('Ошибка загрузки событий:', error);
  }
};

onMounted(() => {
  fetchUpcomingEvents();
});
</script>

<style scoped>
.calendar {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.calendar-header {
  background: #006f62;
  color: white;
  padding: 1rem;
  border-radius: 8px 8px 0 0;
}

.calendar-header h2 {
  margin: 0;
}

.calendar-body {
  padding: 1.5rem;
}

.events-table {
  width: 100%;
  border-collapse: collapse;
}

.events-table th,
.events-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.events-table th {
  background: #f8f9fa;
  font-weight: 600;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
}

.status-badge.next {
  background: #fff3cd;
  color: #856404;
}

.status-badge.upcoming {
  background: #d1ecf1;
  color: #0c5460;
}

.status-badge.completed {
  background: #d4edda;
  color: #155724;
}

.no-events {
  text-align: center;
  color: #666;
  font-style: italic;
}
</style>