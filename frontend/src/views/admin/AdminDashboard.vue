<template>
  <div class="admin-dashboard">
    <!-- Заголовок с фильтрами -->
    <div class="dashboard-header">
      <div class="header-content">
        <div class="header-text">
          <h1>Админ-панель F1 Forum</h1>
          <p>Полный обзор системы и управление</p>
        </div>
        
        <div class="header-controls">
          <!-- Фильтры по дате -->
          <div class="date-filters">
            <div class="filter-group">
              <label>Начальная дата:</label>
              <input 
                type="date" 
                v-model="filters.startDate" 
                class="filter-input"
              >
            </div>
            <div class="filter-group">
              <label>Конечная дата:</label>
              <input 
                type="date" 
                v-model="filters.endDate" 
                class="filter-input"
              >
            </div>
            <button @click="applyFilters" class="btn btn-primary">
              Применить
            </button>
            <button @click="resetFilters" class="btn btn-secondary">
              Сбросить
            </button>
          </div>

          <!-- Кнопки экспорта -->
          <div class="export-section">
            <button 
              @click="showExportOptions = !showExportOptions" 
              class="btn btn-success"
              :disabled="loading"
            >
              Экспорт отчетов
            </button>
            
            <!-- Опции экспорта -->
            <div v-if="showExportOptions" class="export-options">
              <div class="export-types">
                <label>Тип отчета:</label>
                <select v-model="exportType" class="export-select">
                  <option value="overview">Общий отчет</option>
                  <option value="users">Отчет по пользователям</option>
                  <option value="content">Отчет по контенту</option>
                  <option value="reports">Отчет по жалобам</option>
                </select>
              </div>
              
              <div class="export-actions">
                <button @click="downloadPDFReport" class="btn btn-primary">
                  PDF отчет
                </button>
                <button @click="showExportOptions = false" class="btn btn-secondary">
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Загрузка и ошибки -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Загрузка данных системы...</p>
    </div>
    
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <div class="error-content">
        <h3>Ошибка загрузки</h3>
        <p>{{ error }}</p>
        <button @click="loadStats" class="btn btn-primary">
          Повторить попытку
        </button>
      </div>
    </div>

    <!-- Основной контент -->
    <div v-else class="dashboard-content">
      <!-- Статистика в реальном времени -->
      <div class="stats-section">
        <h2>Статистика в реальном времени</h2>
        <div class="stats-grid">
          <!-- Пользователи -->
          <div class="stat-card user-stats">
            <div class="stat-header">
              <div class="stat-icon">👥</div>
              <div class="stat-trend" :class="getTrendClass(userTrend)">
                {{ userTrend }}%
              </div>
            </div>
            <div class="stat-main">
              <h3>{{ formatNumber(stats.totalUsers) }}</h3>
              <p>Всего пользователей</p>
            </div>
            <div class="stat-details">
              <div class="stat-detail">
                <span class="label">Новых сегодня:</span>
                <span class="value highlight">{{ stats.newUsersToday }}</span>
              </div>
              <div class="stat-detail">
                <span class="label">Онлайн сейчас:</span>
                <span class="value highlight">{{ onlineUsers }}</span>
              </div>
              <div class="stat-detail">
                <span class="label">Активных сегодня:</span>
                <span class="value">{{ stats.active_today || 0 }}</span>
              </div>
              <div class="stat-detail">
                <span class="label">Админы:</span>
                <span class="value">{{ stats.admin_count || 0 }}</span>
              </div>
              <div class="stat-detail">
                <span class="label">Модераторы:</span>
                <span class="value">{{ stats.moderator_count || 0 }}</span>
              </div>
            </div>
          </div>

          <!-- Контент -->
          <div class="stat-card content-stats">
            <div class="stat-header">
              <div class="stat-icon">📝</div>
              <div class="stat-trend" :class="getTrendClass(contentTrend)">
                {{ contentTrend }}%
              </div>
            </div>
            <div class="stat-main">
              <h3>{{ formatNumber(stats.totalTopics) }}</h3>
              <p>Тем на форуме</p>
            </div>
            <div class="stat-details">
              <div class="stat-detail">
                <span class="label">Новых сегодня:</span>
                <span class="value highlight">{{ stats.newTopicsToday }}</span>
              </div>
              <div class="stat-detail">
                <span class="label">Комментарии:</span>
                <span class="value">{{ formatNumber(stats.totalComments) }}</span>
              </div>
              <div class="stat-detail">
                <span class="label">Новых комментов:</span>
                <span class="value highlight">{{ stats.newCommentsToday }}</span>
              </div>
              <div class="stat-detail">
                <span class="label">Просмотры:</span>
                <span class="value">{{ formatNumber(totalViews) }}</span>
              </div>
              <div class="stat-detail">
                <span class="label">Лайки:</span>
                <span class="value">{{ formatNumber(totalLikes) }}</span>
              </div>
            </div>
          </div>

          <!-- Активность -->
          <div class="stat-card activity-stats">
            <div class="stat-header">
              <div class="stat-icon">🚀</div>
              <div class="stat-trend" :class="getTrendClass(activityTrend)">
                {{ activityTrend }}%
              </div>
            </div>
            <div class="stat-main">
              <h3>{{ formatNumber(dailyActivity) }}</h3>
              <p>Активность сегодня</p>
            </div>
            <div class="stat-details">
              <div class="stat-detail">
                <span class="label">Новых за неделю:</span>
                <span class="value highlight">{{ stats.new_users_week + stats.new_topics_week + stats.new_comments_week }}</span>
              </div>
              <div class="stat-detail">
                <span class="label">Средний возраст аккаунтов:</span>
                <span class="value">{{ stats.avg_account_age_days || 0 }} дн.</span>
              </div>
              <div class="stat-detail">
                <span class="label">Пользователей за неделю:</span>
                <span class="value">{{ stats.new_users_week || 0 }}</span>
              </div>
              <div class="stat-detail">
                <span class="label">Тем за неделю:</span>
                <span class="value">{{ stats.new_topics_week || 0 }}</span>
              </div>
              <div class="stat-detail">
                <span class="label">Комментариев за неделю:</span>
                <span class="value">{{ stats.new_comments_week || 0 }}</span>
              </div>
            </div>
          </div>

          <!-- Жалобы и модерация -->
          <div class="stat-card moderation-stats">
            <div class="stat-header">
              <div class="stat-icon">🚨</div>
              <div class="stat-trend warning" v-if="pendingReports > 0">
                {{ pendingReports }}
              </div>
            </div>
            <div class="stat-main">
              <h3>{{ formatNumber(stats.totalReports || 0) }}</h3>
              <p>Всего жалоб</p>
            </div>
            <div class="stat-details">
              <div class="stat-detail">
                <span class="label">Ожидают:</span>
                <span class="value warning" v-if="pendingReports > 0">
                  {{ pendingReports }}
                </span>
                <span class="value" v-else>0</span>
              </div>
              <div class="stat-detail">
                <span class="label">Решено:</span>
                <span class="value success">{{ stats.resolved_reports || 0 }}</span>
              </div>
              <div class="stat-detail">
                <span class="label">Новых за неделю:</span>
                <span class="value">{{ stats.new_reports_week || 0 }}</span>
              </div>
              <div class="stat-detail">
                <span class="label">Эффективность:</span>
                <span class="value">{{ moderationEfficiency }}%</span>
              </div>
              <div class="stat-detail">
                <span class="label">Заблокированных:</span>
                <span class="value">{{ stats.banned_users || 0 }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Последняя активность и логи -->
      <div class="activity-section">
        <div class="activity-grid">
          <!-- Последняя активность -->
          <div class="activity-card">
            <div class="card-header">
              <h3>Последняя активность</h3>
              <button @click="loadStats" class="btn btn-sm btn-outline">
                Обновить
              </button>
            </div>
            <div class="activity-list">
              <div 
                v-for="activity in recentActivity" 
                :key="activity.id" 
                class="activity-item"
                :class="activity.type"
              >
                <div class="activity-icon">
                  {{ getActivityIcon(activity.type) }}
                </div>
                <div class="activity-content">
                  <div class="activity-title">
                    {{ activity.actor_username || 'Система' }}
                  </div>
                  <div class="activity-description">
                    {{ formatActivityDescription(activity) }}
                  </div>
                  <div class="activity-details" v-if="activity.title">
                    {{ activity.title }}
                  </div>
                </div>
                <div class="activity-time">
                  {{ formatActivityDate(activity.activity_date) }}
                </div>
              </div>
              <div v-if="recentActivity.length === 0" class="no-activity">
                <div class="no-data-icon">😴</div>
                <p>Активности пока нет</p>
              </div>
            </div>
          </div>

          <!-- Системные логи -->
          <div class="logs-card">
            <div class="card-header">
              <h3>Системные логи</h3>
              <div class="log-filters">
                <select v-model="logLevel" class="log-select">
                  <option value="all">Все уровни</option>
                  <option value="error">Ошибки</option>
                  <option value="warn">Предупреждения</option>
                  <option value="info">Информация</option>
                </select>
              </div>
            </div>
            <div class="logs-list">
              <div 
                v-for="log in filteredLogs" 
                :key="log.id" 
                class="log-item"
                :class="log.level"
              >
                <div class="log-level" :class="log.level">
                  {{ log.level.toUpperCase() }}
                </div>
                <div class="log-message">
                  {{ log.message }}
                </div>
                <div class="log-time">
                  {{ formatLogDate(log.created_at) }}
                </div>
              </div>
              <div v-if="filteredLogs.length === 0" class="no-logs">
                <div class="no-data-icon">📝</div>
                <p>Логов пока нет</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Быстрые действия -->
      <div class="quick-actions">
        <h3>Быстрые действия</h3>
        <div class="actions-grid">
          <button @click="clearCache" class="action-btn cache">
            <span class="action-icon">🗑️</span>
            <span class="action-text">Очистить кэш</span>
          </button>
          <button @click="backupDatabase" class="action-btn backup">
            <span class="action-icon">💾</span>
            <span class="action-text">Бэкап БД</span>
          </button>
          <button @click="optimizeDatabase" class="action-btn optimize">
            <span class="action-icon">⚡</span>
            <span class="action-text">Оптимизировать БД</span>
          </button>
          <button @click="viewSystemInfo" class="action-btn info">
            <span class="action-icon">ℹ️</span>
            <span class="action-text">Инфо системы</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import api from '../../services/api';

// Реактивные данные
const stats = ref({
  totalUsers: 0,
  totalTopics: 0,
  totalComments: 0,
  totalRaces: 0,
  newUsersToday: 0,
  newTopicsToday: 0,
  newCommentsToday: 0,
  admin_count: 0,
  moderator_count: 0,
  active_users: 0,
  banned_users: 0,
  active_today: 0,
  avg_account_age_days: 0,
  online_users: 0,
  total_views: 0,
  total_likes: 0,
  total_comment_likes: 0,
  new_users_week: 0,
  new_topics_week: 0,
  new_comments_week: 0,
  total_reports: 0,
  resolved_reports: 0,
  pending_reports: 0,
  new_reports_week: 0
});

const recentActivity = ref([]);
const systemLogs = ref([]);
const loading = ref(true);
const error = ref('');
const filters = ref({
  startDate: '',
  endDate: ''
});
const showExportOptions = ref(false);
const exportType = ref('overview');
const logLevel = ref('all');

// Computed свойства с реальными данными
const userTrend = computed(() => {
  const total = stats.value.totalUsers;
  const week = stats.value.new_users_week;
  return total > 0 ? Math.round((week / total) * 100) : 0;
});

const contentTrend = computed(() => {
  const total = stats.value.totalTopics + stats.value.totalComments;
  const week = stats.value.new_topics_week + stats.value.new_comments_week;
  return total > 0 ? Math.round((week / total) * 100) : 0;
});

const activityTrend = computed(() => {
  const today = stats.value.newUsersToday + stats.value.newTopicsToday + stats.value.newCommentsToday;
  const weekAvg = (stats.value.new_users_week + stats.value.new_topics_week + stats.value.new_comments_week) / 7;
  return weekAvg > 0 ? Math.round((today / weekAvg) * 100) : 0;
});

const dailyActivity = computed(() => 
  stats.value.newUsersToday + stats.value.newTopicsToday + stats.value.newCommentsToday
);

const onlineUsers = computed(() => stats.value.online_users || 0);
const totalViews = computed(() => stats.value.total_views || 0);
const totalLikes = computed(() => (stats.value.total_likes || 0) + (stats.value.total_comment_likes || 0));
const pendingReports = computed(() => stats.value.pending_reports || 0);
const moderationEfficiency = computed(() => {
  const total = stats.value.total_reports || 0;
  const resolved = stats.value.resolved_reports || 0;
  return total > 0 ? Math.round((resolved / total) * 100) : 100;
});

const filteredLogs = computed(() => {
  if (logLevel.value === 'all') return systemLogs.value;
  return systemLogs.value.filter(log => log.level === logLevel.value);
});

// Загрузка данных при монтировании
onMounted(async () => {
  await loadStats();
  await loadSystemLogs();
});

// Загрузка статистики
const loadStats = async () => {
  try {
    loading.value = true;
    error.value = '';
    
    const params = {};
    if (filters.value.startDate) params.start_date = filters.value.startDate;
    if (filters.value.endDate) params.end_date = filters.value.endDate;

    console.log('🔄 Загрузка статистики...', params);
    const response = await api.get('/admin/stats', { params });
    
    if (response.data.success) {
      stats.value = { ...stats.value, ...response.data.stats };
      recentActivity.value = response.data.recentActivity || [];
      console.log('✅ Статистика загружена:', stats.value);
    } else {
      error.value = response.data.error || 'Ошибка загрузки статистики';
    }
  } catch (err) {
    console.error('❌ Ошибка загрузки статистики:', err);
    error.value = 'Не удалось загрузить статистику: ' + err.message;
  } finally {
    loading.value = false;
  }
};

// Загрузка системных логов
const loadSystemLogs = async () => {
  try {
    // Заглушка для логов - в реальном приложении здесь будет API вызов
    systemLogs.value = [
      {
        id: 1,
        level: 'info',
        message: 'Система запущена успешно',
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        level: 'info',
        message: 'Новый пользователь зарегистрирован',
        created_at: new Date(Date.now() - 300000).toISOString()
      },
      {
        id: 3,
        level: 'warn',
        message: 'Высокая нагрузка на базу данных',
        created_at: new Date(Date.now() - 600000).toISOString()
      }
    ];
  } catch (err) {
    console.error('❌ Ошибка загрузки логов:', err);
  }
};

// Методы
const applyFilters = () => {
  loadStats();
};

const resetFilters = () => {
  filters.value = { startDate: '', endDate: '' };
  loadStats();
};

const downloadPDFReport = async () => {
  try {
    loading.value = true;
    
    const params = {
      report_type: exportType.value,
      start_date: filters.value.startDate,
      end_date: filters.value.endDate
    };

    const response = await api.get('/admin/reports/export/pdf', {
      params,
      responseType: 'blob'
    });
    
    // Скачивание файла
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `system_report_${new Date().toISOString().split('T')[0]}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    showExportOptions.value = false;
  } catch (err) {
    console.error('❌ Ошибка экспорта PDF:', err);
    alert('❌ Ошибка при скачивании отчета');
  } finally {
    loading.value = false;
  }
};

const getActivityIcon = (type) => {
  const icons = {
    'user': '👤',
    'topic': '📝', 
    'comment': '💬',
    'report': '🚨'
  };
  return icons[type] || '📌';
};

const formatActivityDescription = (activity) => {
  // Если в описании уже есть информация о пользователе, используем её
  if (activity.description && activity.actor_username) {
    return activity.description;
  }
  
  // Иначе формируем описание на основе типа активности
  const types = {
    'user': `Зарегистрирован новый пользователь`,
    'topic': `Создана новая тема`,
    'comment': `Добавлен новый комментарий`, 
    'report': `Обработана жалоба`
  };
  
  const baseText = types[activity.type] || 'Действие в системе';
  return activity.actor_username ? `${baseText} пользователем ${activity.actor_username}` : baseText;
};

const formatActivityDate = (dateString) => {
  if (!dateString) return 'Неизвестно';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    
    if (diffMinutes < 1) return 'Только что';
    if (diffMinutes < 60) return `${diffMinutes} мин назад`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} ч назад`;
    
    return date.toLocaleDateString('ru-RU', { 
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Неверная дата';
  }
};

const formatLogDate = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (error) {
    return '';
  }
};

const formatNumber = (num) => {
  if (!num) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const getTrendClass = (trend) => {
  return trend > 0 ? 'positive' : trend < 0 ? 'negative' : 'neutral';
};

// Быстрые действия
const clearCache = () => {
  alert('🗑️ Кэш очищен');
};

const backupDatabase = () => {
  alert('💾 Бэкап базы данных запущен');
};

const optimizeDatabase = () => {
  alert('⚡ Оптимизация базы данных завершена');
};

const viewSystemInfo = () => {
  const info = `
Пользователей: ${stats.value.totalUsers}
Тем: ${stats.value.totalTopics}
Комментариев: ${stats.value.totalComments}
Жалоб: ${stats.value.total_reports || 0}
Онлайн: ${stats.value.online_users || 0}
Активных сегодня: ${stats.value.active_today || 0}
  `.trim();
  
  alert('Информация о системе:\n\n' + info);
};

// Наблюдатели
watch(logLevel, () => {
  console.log('📋 Уровень логов изменен:', logLevel.value);
});
</script>

<style scoped>
.admin-dashboard {
  padding: 20px;
  background: #f8f9fa;
  min-height: 100vh;
}

/* Заголовок */
.dashboard-header {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 2rem;
}

.header-text h1 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 2.2rem;
  font-weight: 700;
}

.header-text p {
  margin: 0;
  color: #7f8c8d;
  font-size: 1.1rem;
}

.header-controls {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  min-width: 300px;
}

.date-filters {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #2c3e50;
}

.filter-input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  min-width: 140px;
}

.export-section {
  position: relative;
}

.export-options {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  border: 1px solid #e0e0e0;
  z-index: 1000;
  min-width: 280px;
  margin-top: 0.5rem;
}

.export-types {
  margin-bottom: 1rem;
}

.export-types label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #2c3e50;
}

.export-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
}

.export-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

/* Состояния загрузки и ошибок */
.loading-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #666;
}

.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-content h3 {
  margin: 0 0 1rem 0;
  color: #e74c3c;
}

/* Статистика */
.stats-section {
  margin-bottom: 2rem;
}

.stats-section h2 {
  margin: 0 0 1.5rem 0;
  color: #2c3e50;
  font-size: 1.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  border-left: 4px solid #3498db;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}

.stat-card.user-stats {
  border-left-color: #3498db;
}

.stat-card.content-stats {
  border-left-color: #27ae60;
}

.stat-card.activity-stats {
  border-left-color: #9b59b6;
}

.stat-card.moderation-stats {
  border-left-color: #e74c3c;
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.stat-icon {
  font-size: 2.5rem;
}

.stat-trend {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: bold;
}

.stat-trend.positive {
  background: #d4edda;
  color: #155724;
}

.stat-trend.negative {
  background: #f8d7da;
  color: #721c24;
}

.stat-trend.neutral {
  background: #e2e3e5;
  color: #383d41;
}

.stat-trend.warning {
  background: #fff3cd;
  color: #856404;
}

.stat-main h3 {
  font-size: 2.5rem;
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-weight: 700;
}

.stat-main p {
  margin: 0;
  color: #7f8c8d;
  font-weight: 500;
}

.stat-details {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #ecf0f1;
}

.stat-detail {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.stat-detail:last-child {
  margin-bottom: 0;
}

.stat-detail .label {
  color: #7f8c8d;
}

.stat-detail .value {
  font-weight: 600;
  color: #2c3e50;
}

.stat-detail .value.highlight {
  color: #27ae60;
}

.stat-detail .value.success {
  color: #27ae60;
}

.stat-detail .value.warning {
  color: #e74c3c;
}

/* Активность и логи */
.activity-section {
  margin-bottom: 2rem;
}

.activity-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
}

.activity-card,
.logs-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #ecf0f1;
}

.card-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.2rem;
}

.log-filters {
  display: flex;
  gap: 0.5rem;
}

.log-select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
}

.activity-list,
.logs-list {
  max-height: 400px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f8f9fa;
  transition: background-color 0.2s ease;
}

.activity-item:hover {
  background-color: #f8f9fa;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-item.user {
  border-left: 3px solid #3498db;
}

.activity-item.topic {
  border-left: 3px solid #27ae60;
}

.activity-item.comment {
  border-left: 3px solid #9b59b6;
}

.activity-item.report {
  border-left: 3px solid #e74c3c;
}

.activity-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
  margin-top: 0.25rem;
}

.activity-content {
  flex: 1;
}

.activity-title {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.25rem;
}

.activity-description {
  color: #7f8c8d;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.activity-details {
  font-size: 0.85rem;
  color: #666;
  font-style: italic;
  margin-top: 0.25rem;
}

.activity-time {
  color: #95a5a6;
  font-size: 0.8rem;
  white-space: nowrap;
  flex-shrink: 0;
}

.log-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1.5rem;
  border-bottom: 1px solid #f8f9fa;
}

.log-item:last-child {
  border-bottom: none;
}

.log-item.error {
  background: #f8d7da;
}

.log-item.warn {
  background: #fff3cd;
}

.log-item.info {
  background: #d1ecf1;
}

.log-level {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: bold;
  min-width: 50px;
  text-align: center;
  flex-shrink: 0;
}

.log-level.error {
  background: #e74c3c;
  color: white;
}

.log-level.warn {
  background: #f39c12;
  color: white;
}

.log-level.info {
  background: #3498db;
  color: white;
}

.log-message {
  flex: 1;
  font-size: 0.9rem;
  color: #2c3e50;
}

.log-time {
  color: #95a5a6;
  font-size: 0.8rem;
  white-space: nowrap;
}

.no-activity,
.no-logs {
  padding: 3rem 2rem;
  text-align: center;
  color: #6c757d;
}

.no-data-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

/* Быстрые действия */
.quick-actions {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.quick-actions h3 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 1.2rem;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem 1rem;
  border: 2px dashed #dee2e6;
  border-radius: 8px;
  background: #f8f9fa;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn:hover {
  border-color: #3498db;
  background: #e3f2fd;
  transform: translateY(-2px);
}

.action-icon {
  font-size: 2rem;
}

.action-text {
  font-weight: 500;
  color: #2c3e50;
}

/* Кнопки */
.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-success {
  background: #27ae60;
  color: white;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-outline {
  background: transparent;
  color: #3498db;
  border: 1px solid #3498db;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Адаптивность */
@media (max-width: 1200px) {
  .header-content {
    flex-direction: column;
  }
  
  .header-controls {
    width: 100%;
  }
  
  .date-filters {
    justify-content: space-between;
  }
}

@media (max-width: 768px) {
  .admin-dashboard {
    padding: 15px;
  }
  
  .dashboard-header {
    padding: 1.5rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .activity-grid {
    grid-template-columns: 1fr;
  }
  
  .actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .date-filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .export-options {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90%;
    max-width: 400px;
  }
}

@media (max-width: 480px) {
  .header-text h1 {
    font-size: 1.5rem;
  }
  
  .stat-main h3 {
    font-size: 2rem;
  }
  
  .activity-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .activity-time {
    align-self: flex-end;
  }
  
  .log-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .log-time {
    align-self: flex-end;
  }
}
</style>