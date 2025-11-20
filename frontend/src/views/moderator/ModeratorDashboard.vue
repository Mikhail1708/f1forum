<!-- frontend/src/views/moderator/ModeratorDashboard.vue -->
<template>
  <div class="moderator-dashboard">
    <div class="dashboard-header">
      <h1>Панель модератора</h1>
      <p>Обзор контента и модерационных задач</p>
    </div>

    <div v-if="loading" class="loading">Загрузка статистики...</div>
    <div v-else-if="error" class="error-message">{{ error }}</div>

    <div v-else>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📝</div>
          <div class="stat-info">
            <h3>{{ stats.pendingTopics || 0 }}</h3>
            <p>Тем на модерации</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">💬</div>
          <div class="stat-info">
            <h3>{{ stats.pendingComments || 0 }}</h3>
            <p>Комментариев на модерации</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">🚨</div>
          <div class="stat-info">
            <h3>{{ stats.reportedContent || 0 }}</h3>
            <p>Жалоб</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">👤</div>
          <div class="stat-info">
            <h3>{{ stats.warnedUsers || 0 }}</h3>
            <p>Пользователей с предупреждениями</p>
          </div>
        </div>
      </div>

      <div class="recent-actions">
        <h2>Последние действия</h2>
        <div class="actions-list">
          <div v-for="action in recentActions" :key="action.id" class="action-item">
            <span class="action-type">{{ getActionTypeText(action.type) }}</span>
            <span class="action-desc">{{ action.description }}</span>
            <span class="action-time">{{ formatDate(action.created_at) }}</span>
          </div>
          <div v-if="recentActions.length === 0" class="no-actions">
            Действий пока нет
          </div>
        </div>
      </div>

      <div class="quick-actions">
        <h2>Быстрые действия</h2>
        <div class="action-buttons">
          <router-link to="/moderator/content" class="btn btn-primary">
            📝 Модерация контента
          </router-link>
          <router-link to="/moderator/reports" class="btn btn-warning">
            🚨 Просмотр жалоб
          </router-link>
          <router-link to="/moderator/users" class="btn btn-secondary">
            👥 Управление пользователями
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../../services/api';

const stats = ref({});
const recentActions = ref([]);
const loading = ref(true);
const error = ref('');

onMounted(async () => {
  await loadModeratorStats();
});

const loadModeratorStats = async () => {
  try {
    loading.value = true;
    const response = await api.get('/moderator/stats');
    
    if (response.data.success) {
      stats.value = response.data.stats;
      recentActions.value = response.data.recentActions || [];
    } else {
      error.value = response.data.error || 'Ошибка загрузки статистики';
    }
  } catch (err) {
    console.error('Ошибка загрузки статистики модератора:', err);
    error.value = 'Не удалось загрузить статистику';
    
    // Заглушка для демонстрации
    stats.value = {
      pendingTopics: 5,
      pendingComments: 12,
      reportedContent: 3,
      warnedUsers: 2
    };
    recentActions.value = [
      {
        id: 1,
        type: 'topic_approved',
        description: 'Одобрена тема "Обсуждение гонки в Бахрейне"',
        created_at: new Date().toISOString()
      }
    ];
  } finally {
    loading.value = false;
  }
};

const getActionTypeText = (type) => {
  const types = {
    topic_approved: '✅ Одобрена тема',
    topic_rejected: '❌ Отклонена тема',
    comment_approved: '✅ Одобрен комментарий',
    comment_deleted: '🗑️ Удален комментарий',
    user_warned: '⚠️ Выдано предупреждение'
  };
  return types[type] || type;
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('ru-RU');
};
</script>

<style scoped>
.moderator-dashboard {
  padding: 20px;
}

.dashboard-header {
  margin-bottom: 2rem;
}

.dashboard-header h1 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.dashboard-header p {
  margin: 0;
  color: #7f8c8d;
}

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

.recent-actions {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.actions-list {
  margin-top: 1rem;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid #ecf0f1;
}

.action-item:last-child {
  border-bottom: none;
}

.action-type {
  font-weight: bold;
  min-width: 200px;
}

.action-desc {
  flex: 1;
}

.action-time {
  color: #95a5a6;
  min-width: 150px;
  text-align: right;
}

.quick-actions {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.action-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
  display: inline-block;
  text-align: center;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-warning {
  background: #f39c12;
  color: white;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

.loading, .no-actions {
  text-align: center;
  padding: 3rem;
  color: #7f8c8d;
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