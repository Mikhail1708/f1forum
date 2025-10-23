<template>
  <div class="admin-dashboard">
    <div class="dashboard-header">
      <h1>Админ-панель F1 Forum</h1>
      <p>Обзор системы и статистика</p>
    </div>

    <div v-if="loading" class="loading">Загрузка статистики...</div>
    <div v-else-if="error" class="error-message">{{ error }}</div>

    <div v-else>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-info">
            <h3>{{ stats.totalUsers }}</h3>
            <p>Пользователей</p>
            <small>+{{ stats.newUsersToday }} сегодня</small>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">📝</div>
          <div class="stat-info">
            <h3>{{ stats.totalTopics }}</h3>
            <p>Тем</p>
            <small>+{{ stats.newTopicsToday }} сегодня</small>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">💬</div>
          <div class="stat-info">
            <h3>{{ stats.totalComments }}</h3>
            <p>Комментариев</p>
            <small>+{{ stats.newCommentsToday }} сегодня</small>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">🏁</div>
          <div class="stat-info">
            <h3>{{ stats.totalRaces }}</h3>
            <p>Гонок в базе</p>
          </div>
        </div>
      </div>

      <div class="recent-activity">
        <h2>Последняя активность на сайте</h2>
        <div class="activity-list">
          <div v-for="activity in recentActivity" :key="activity.id" class="activity-item">
            <span class="activity-type" :class="activity.type">{{ getActivityTypeText(activity.type) }}</span>
            <span class="activity-desc">
              <strong>{{ activity.title }}</strong> - {{ activity.description }}
            </span>
            <span class="activity-time">{{ formatDate(activity.created_at) }}</span>
          </div>
          <div v-if="recentActivity.length === 0" class="no-activity">
            Активности пока нет
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../../services/api';

const stats = ref({
  totalUsers: 0,
  totalTopics: 0,
  totalComments: 0,
  totalRaces: 0,
  newUsersToday: 0,
  newTopicsToday: 0,
  newCommentsToday: 0
});
const recentActivity = ref([]);
const loading = ref(true);
const error = ref('');

onMounted(async () => {
  await loadStats();
});

const loadStats = async () => {
  try {
    loading.value = true;
    const response = await api.get('/admin/stats');
    
    if (response.data.success) {
      stats.value = response.data.stats;
      recentActivity.value = response.data.recentActivity;
    } else {
      error.value = 'Ошибка загрузки статистики';
    }
  } catch (err) {
    console.error('Error loading stats:', err);
    error.value = 'Не удалось загрузить статистику';
  } finally {
    loading.value = false;
  }
};

const getActivityTypeText = (type) => {
  const types = {
    user: '👤',
    topic: '📝', 
    comment: '💬'
  };
  return types[type] || type;
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('ru-RU');
};
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  font-size: 2rem;
}

.stat-info h3 {
  font-size: 2rem;
  margin: 0 0 0.25rem 0;
  color: #2c3e50;
}

.stat-info p {
  margin: 0;
  color: #7f8c8d;
  font-weight: 500;
}

.stat-info small {
  color: #95a5a6;
  font-size: 0.8rem;
}

.recent-activity {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.activity-list {
  margin-top: 1rem;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid #ecf0f1;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-type {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
  min-width: 40px;
  text-align: center;
}

.activity-desc {
  flex: 1;
}

.activity-time {
  color: #95a5a6;
  font-size: 0.9rem;
  min-width: 150px;
  text-align: right;
}

.no-activity {
  text-align: center;
  padding: 2rem;
  color: #7f8c8d;
  font-style: italic;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #666;
  font-size: 1.1rem;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 6px;
  text-align: center;
  margin: 2rem 0;
}
</style>