<!-- frontend/src/views/moderator/ReportsManagement.vue -->
<template>
  <div class="reports-management">
    <div class="page-header">
      <h1>Управление жалобами</h1>
      <div class="header-tabs">
        <button 
          @click="activeTab = 'pending'" 
          :class="['tab-btn', { active: activeTab === 'pending' }]"
        >
          Ожидающие ({{ pendingReports.length }})
        </button>
        <button 
          @click="activeTab = 'resolved'" 
          :class="['tab-btn', { active: activeTab === 'resolved' }]"
        >
          Решенные ({{ resolvedReports.length }})
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading">Загрузка жалоб...</div>

    <div v-else class="reports-list">
      <div v-if="activeTab === 'pending' && pendingReports.length === 0" class="no-reports">
        <p>Нет ожидающих жалоб 🎉</p>
      </div>

      <div v-else-if="activeTab === 'resolved' && resolvedReports.length === 0" class="no-reports">
        <p>Нет решенных жалоб</p>
      </div>

      <div v-else class="reports-container">
        <div 
          v-for="report in currentReports" 
          :key="report.id" 
          class="report-card"
          :class="{ resolved: report.status === 'resolved' }"
        >
          <div class="report-header">
            <span class="report-type">{{ getReportTypeText(report.type) }}</span>
            <span class="report-date">{{ formatDate(report.created_at) }}</span>
          </div>
          
          <div class="report-content">
            <p class="report-reason"><strong>Причина:</strong> {{ report.reason }}</p>
            
            <div class="reported-content">
              <h4>Содержание:</h4>
              <p>{{ report.content_preview }}</p>
            </div>

            <div class="report-meta">
              <span>👤 Жалоба от: {{ report.reporter_name }}</span>
              <span>🎯 Автор: {{ report.author_name }}</span>
            </div>
          </div>

          <div class="report-actions" v-if="report.status === 'pending'">
            <button @click="resolveReport(report.id, 'approved')" class="btn btn-success">
              ✅ Одобрить контент
            </button>
            <button @click="resolveReport(report.id, 'removed')" class="btn btn-danger">
              🗑️ Удалить контент
            </button>
            <button @click="viewContent(report.content_type, report.content_id)" class="btn btn-secondary">
              👁️ Просмотр
            </button>
          </div>

          <div v-else class="report-resolution">
            <p><strong>Решение:</strong> {{ getResolutionText(report.resolution) }}</p>
            <p><strong>Модератор:</strong> {{ report.moderator_name }}</p>
            <p><strong>Дата:</strong> {{ formatDate(report.resolved_at) }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../../services/api';

const router = useRouter();
const activeTab = ref('pending');
const pendingReports = ref([]);
const resolvedReports = ref([]);
const loading = ref(false);

const currentReports = computed(() => {
  return activeTab.value === 'pending' ? pendingReports.value : resolvedReports.value;
});

onMounted(async () => {
  await loadReports();
});

const loadReports = async () => {
  try {
    loading.value = true;
    
    // Загрузка ожидающих жалоб
    const pendingResponse = await api.get('/moderator/reports/pending');
    if (pendingResponse.data.success) {
      pendingReports.value = pendingResponse.data.reports;
    }

    // Загрузка решенных жалоб
    const resolvedResponse = await api.get('/moderator/reports/resolved');
    if (resolvedResponse.data.success) {
      resolvedReports.value = resolvedResponse.data.reports;
    }

  } catch (error) {
    console.error('Ошибка загрузки жалоб:', error);
    
    // Заглушки для демонстрации
    pendingReports.value = [
      {
        id: 1,
        type: 'spam',
        reason: 'Спам сообщение',
        content_preview: 'Это тестовое спам сообщение...',
        reporter_name: 'user1',
        author_name: 'spammer',
        created_at: new Date().toISOString(),
        content_type: 'comment',
        content_id: 1,
        status: 'pending'
      }
    ];
    
    resolvedReports.value = [
      {
        id: 2,
        type: 'inappropriate',
        reason: 'Неуместный контент',
        content_preview: 'Этот контент был удален...',
        reporter_name: 'user2',
        author_name: 'author',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        resolved_at: new Date().toISOString(),
        resolution: 'removed',
        moderator_name: 'moderator',
        status: 'resolved'
      }
    ];
  } finally {
    loading.value = false;
  }
};

const resolveReport = async (reportId, resolution) => {
  try {
    const response = await api.post(`/moderator/reports/${reportId}/resolve`, {
      resolution: resolution
    });
    
    if (response.data.success) {
      // Обновляем список жалоб
      await loadReports();
      alert('Жалоба успешно обработана');
    } else {
      alert('Ошибка обработки жалобы: ' + response.data.error);
    }
  } catch (error) {
    console.error('Ошибка обработки жалобы:', error);
    alert('Ошибка обработки жалобы: ' + error.message);
  }
};

const viewContent = (contentType, contentId) => {
  if (contentType === 'topic') {
    router.push(`/discussion/${contentId}`);
  } else if (contentType === 'comment') {
    // Находим тему для комментария
    router.push(`/discussion/${contentId}`); // В реальном приложении нужно получить ID темы
  }
};

const getReportTypeText = (type) => {
  const types = {
    spam: '🚫 Спам',
    inappropriate: '🔞 Неуместный контент',
    harassment: '⚖️ Оскорбления',
    copyright: '©️ Нарушение авторских прав',
    other: '❓ Другое'
  };
  return types[type] || type;
};

const getResolutionText = (resolution) => {
  const resolutions = {
    approved: 'Контент одобрен',
    removed: 'Контент удален',
    warned: 'Пользователь предупрежден'
  };
  return resolutions[resolution] || resolution;
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('ru-RU');
};
</script>

<style scoped>
.reports-management {
  padding: 20px;
}

.page-header {
  margin-bottom: 2rem;
}

.header-tabs {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.tab-btn {
  padding: 0.75rem 1.5rem;
  border: 1px solid #ddd;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-btn.active {
  background: #3498db;
  color: white;
  border-color: #3498db;
}

.reports-list {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  padding: 1.5rem;
}

.reports-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.report-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.5rem;
  background: #fafafa;
}

.report-card.resolved {
  background: #f8fff8;
  border-color: #d4edda;
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.report-type {
  font-weight: bold;
  color: #e74c3c;
}

.report-card.resolved .report-type {
  color: #27ae60;
}

.report-date {
  color: #7f8c8d;
  font-size: 0.9rem;
}

.report-content {
  margin-bottom: 1rem;
}

.report-reason {
  margin: 0 0 1rem 0;
  font-weight: 500;
}

.reported-content {
  background: white;
  padding: 1rem;
  border-radius: 4px;
  border-left: 4px solid #3498db;
  margin-bottom: 1rem;
}

.reported-content h4 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.report-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  color: #7f8c8d;
}

.report-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.report-resolution {
  background: #e8f5e8;
  padding: 1rem;
  border-radius: 4px;
  border-left: 4px solid #27ae60;
}

.report-resolution p {
  margin: 0.25rem 0;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s;
}

.btn-success {
  background: #27ae60;
  color: white;
}

.btn-success:hover {
  background: #219a52;
}

.btn-danger {
  background: #e74c3c;
  color: white;
}

.btn-danger:hover {
  background: #c0392b;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background: #7f8c8d;
}

.no-reports {
  text-align: center;
  padding: 3rem;
  color: #7f8c8d;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #7f8c8d;
}
</style>