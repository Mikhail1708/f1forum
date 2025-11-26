<!-- frontend/src/views/moderator/ReportsManagement.vue -->
<template>
  <div class="reports-management">
    <div class="page-header">
      <h1>🚨 Управление жалобами</h1>
      <div class="header-controls">
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
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Загрузка жалоб...</p>
    </div>

    <div v-else class="reports-content">
      <!-- Список жалоб -->
      <div class="reports-list">
        <div v-if="currentReports.length === 0" class="no-reports">
          <p>🎉 Нет жалоб для отображения</p>
        </div>

        <div v-else class="reports-container">
          <div 
            v-for="report in currentReports" 
            :key="report.id" 
            class="report-card"
            :class="{ resolved: report.status === 'resolved' }"
          >
            <div class="report-header">
              <div class="report-type-badge">
                <span class="type-icon">{{ getContentTypeIcon(report.content_type) }}</span>
                <span class="type-text">{{ getContentTypeText(report.content_type) }}</span>
              </div>
              
              <div class="report-meta">
                <span class="report-id">#{{ report.id }}</span>
                <span class="report-date">{{ formatDate(report.created_at) }}</span>
              </div>
            </div>
            
            <div class="report-content">
              <div class="reason-section">
                <h4>Причина жалобы:</h4>
                <p class="report-reason">{{ report.reason }}</p>
              </div>

              <div class="content-section">
                <h4>Содержание:</h4>
                <div class="content-preview">
                  <p>{{ report.content_preview || 'Содержание не доступно' }}</p>
                </div>
              </div>

              <div class="users-section">
                <div class="user-info">
                  <span class="user-label">👤 Жалоба от:</span>
                  <span class="user-name">{{ report.reporter_name }}</span>
                </div>
                <div class="user-info">
                  <span class="user-label">🎯 Автор контента:</span>
                  <span class="user-name">{{ report.author_name }}</span>
                </div>
              </div>
            </div>

            <!-- Действия для ожидающих жалоб -->
            <div class="report-actions" v-if="report.status === 'pending'">
              <button @click="quickResolve(report.id, 'dismiss')" class="btn btn-success">
                ✅ Отклонить жалобу
              </button>
              <button @click="quickResolve(report.id, 'remove_content')" class="btn btn-danger">
                🗑️ Удалить контент
              </button>
              <button @click="quickResolve(report.id, 'warn_user')" class="btn btn-warning">
                ⚠️ Предупредить
              </button>
            </div>

            <!-- Информация о решении -->
            <div v-else class="report-resolution">
              <h4>Решение модератора:</h4>
              <p><strong>Действие:</strong> {{ getResolutionText(report.resolution) }}</p>
              <p v-if="report.moderator_notes"><strong>Комментарий:</strong> {{ report.moderator_notes }}</p>
              <p><strong>Модератор:</strong> {{ report.moderator_name || 'Система' }}</p>
              <p><strong>Дата решения:</strong> {{ formatDate(report.resolved_at) }}</p>
              <button @click="reopenReport(report.id)" class="btn btn-outline">
                🔄 Переоткрыть
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../services/api'

export default {
  name: 'ReportsManagement',
  setup() {
    const router = useRouter()

    // Состояние
    const activeTab = ref('pending')
    const reports = ref({
      pending: [],
      resolved: []
    })
    const loading = ref(false)

    // Computed
    const currentReports = computed(() => {
      return reports.value[activeTab.value] || []
    })

    const pendingReports = computed(() => reports.value.pending || [])
    const resolvedReports = computed(() => reports.value.resolved || [])

    // Методы
    onMounted(async () => {
      await loadReports()
    })

    const loadReports = async () => {
      loading.value = true
      try {
        // Загрузка ожидающих жалоб
        const pendingResponse = await api.get('/moderator/reports?status=pending')
        if (pendingResponse.data.success) {
          reports.value.pending = pendingResponse.data.reports
        }

        // Загрузка решенных жалоб
        const resolvedResponse = await api.get('/moderator/reports?status=resolved')
        if (resolvedResponse.data.success) {
          reports.value.resolved = resolvedResponse.data.reports
        }

      } catch (error) {
        console.error('❌ Ошибка загрузки жалоб:', error)
        
        // Заглушки для демонстрации
        reports.value.pending = getMockReports('pending')
        reports.value.resolved = getMockReports('resolved')
      } finally {
        loading.value = false
      }
    }

    const quickResolve = async (reportId, action) => {
      const actionText = getActionText(action)
      if (!confirm(`Вы уверены, что хотите ${actionText}?`)) return

      try {
        const response = await api.post(`/moderator/reports/${reportId}/resolve`, {
          action,
          moderator_notes: `Быстрое решение: ${actionText}`
        })

        if (response.data.success) {
          await loadReports()
          alert('Жалоба успешно обработана')
        }
      } catch (error) {
        console.error('❌ Ошибка обработки жалобы:', error)
        alert('Ошибка обработки жалобы')
      }
    }

    const reopenReport = async (reportId) => {
      if (!confirm('Переоткрыть эту жалобу?')) return

      try {
        const response = await api.put(`/moderator/reports/${reportId}/resolution`, {
          status: 'pending',
          resolution: '',
          moderator_notes: 'Жалоба переоткрыта'
        })

        if (response.data.success) {
          await loadReports()
          alert('Жалоба переоткрыта')
        }
      } catch (error) {
        console.error('❌ Ошибка переоткрытия жалобы:', error)
        alert('Ошибка переоткрытия жалобы')
      }
    }

  const viewOriginalContent = async (report) => {
  console.log('🔍 Viewing original content for report:', report);
  
  try {
    if (report.content_type === 'topic') {
      // Для темы
      try {
        await discussionsStore.fetchDiscussion(report.content_id);
        
        if (discussionsStore.currentDiscussion) {
          router.push(`/discussion/${report.content_id}`);
        } else {
          throw new Error('Topic not found');
        }
      } catch (error) {
        console.error('❌ Topic not found:', error);
        alert('❌ Обсуждение не найдено. Возможно оно было удалено при обработке жалобы.');
      }
    } 
    else if (report.content_type === 'comment') {
      // Для комментария - используем прямой подход
      try {
        // Пробуем загрузить все комментарии темы чтобы найти наш
        const topicsResponse = await api.get('/topics');
        const topics = topicsResponse.data.topics || topicsResponse.data;
        
        let targetTopicId = null;
        
        // Ищем тему которая содержит этот комментарий
        for (const topic of topics) {
          try {
            const topicResponse = await api.get(`/topics/${topic.id}`);
            const topicData = topicResponse.data.topic || topicResponse.data;
            
            if (topicData.comments) {
              // Проверяем все комментарии и ответы
              const checkComments = (comments) => {
                for (const comment of comments) {
                  if (comment.id == report.content_id) {
                    return true;
                  }
                  if (comment.replies && comment.replies.some(reply => reply.id == report.content_id)) {
                    return true;
                  }
                }
                return false;
              };
              
              if (checkComments(topicData.comments)) {
                targetTopicId = topic.id;
                break;
              }
            }
          } catch (topicError) {
            console.log(`❌ Could not check topic ${topic.id}:`, topicError.message);
          }
        }
        
        if (targetTopicId) {
          await discussionsStore.fetchDiscussion(targetTopicId);
          router.push(`/discussion/${targetTopicId}?comment=${report.content_id}`);
        } else {
          throw new Error('Comment not found in any topic');
        }
      } catch (error) {
        console.error('❌ Error finding comment:', error);
        alert('❌ Комментарий не найден в системе.');
      }
    }
  } catch (error) {
    console.error('❌ Error viewing content:', error);
    alert('❌ Не удалось открыть контент.');
  }
};

    // Вспомогательные функции
    const getContentTypeIcon = (type) => {
      return type === 'topic' ? '📝' : '💬'
    }

    const getContentTypeText = (type) => {
      return type === 'topic' ? 'Тема' : 'Комментарий'
    }

    const getResolutionText = (resolution) => {
      const resolutions = {
        'removed': 'Контент удален',
        'dismiss': 'Жалоба отклонена',
        'warn_user': 'Пользователь предупрежден',
        'approved': 'Контент одобрен'
      }
      return resolutions[resolution] || resolution
    }

    const getActionText = (action) => {
      const actions = {
        'remove_content': 'удалить контент',
        'dismiss': 'отклонить жалобу',
        'warn_user': 'предупредить пользователя'
      }
      return actions[action] || action
    }

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleString('ru-RU')
    }

    // Заглушки для демонстрации
    const getMockReports = (status) => {
      if (status === 'pending') {
        return [
          {
            id: 1,
            content_type: 'topic',
            reason: 'Спам сообщение',
            content_preview: 'Это тестовое спам сообщение...',
            reporter_name: 'user1',
            author_name: 'spammer',
            created_at: new Date().toISOString(),
            status: 'pending',
            content_id: 1
          },
          {
            id: 2,
            content_type: 'comment',
            reason: 'Оскорбления',
            content_preview: 'Неуместный комментарий...',
            reporter_name: 'user2',
            author_name: 'author123',
            created_at: new Date(Date.now() - 3600000).toISOString(),
            status: 'pending',
            content_id: 2
          }
        ]
      } else {
        return [
          {
            id: 3,
            content_type: 'comment',
            reason: 'Нецензурная лексика',
            content_preview: 'Этот комментарий был удален...',
            reporter_name: 'user3',
            author_name: 'author456',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            resolved_at: new Date().toISOString(),
            resolution: 'removed',
            moderator_name: 'moderator',
            moderator_notes: 'Нарушение правил сообщества',
            status: 'resolved',
            content_id: 3
          }
        ]
      }
    }

    return {
      activeTab,
      reports,
      loading,
      currentReports,
      pendingReports,
      resolvedReports,
      loadReports,
      quickResolve,
      reopenReport,
      viewOriginalContent,
      getContentTypeIcon,
      getContentTypeText,
      getResolutionText,
      formatDate
    }
  }
}
</script>

<style scoped>
.reports-management {
  padding: 20px;
}

.page-header {
  margin-bottom: 2rem;
}

.header-controls {
  margin-top: 1rem;
}

.header-tabs {
  display: flex;
  gap: 0.5rem;
}

.tab-btn {
  padding: 0.75rem 1.5rem;
  border: 1px solid #ddd;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.tab-btn.active {
  background: #3498db;
  color: white;
  border-color: #3498db;
}

/* Список жалоб */
.reports-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  overflow: hidden;
}

.reports-container {
  padding: 1.5rem;
}

.report-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  background: #fafafa;
  transition: all 0.3s ease;
}

.report-card:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
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

.report-type-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: bold;
}

.type-icon {
  font-size: 1.2rem;
}

.report-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.9rem;
  color: #666;
}

.report-id {
  font-weight: bold;
  color: #2c3e50;
}

/* Контент жалобы */
.report-content {
  margin-bottom: 1rem;
}

.reason-section,
.content-section,
.users-section {
  margin-bottom: 1rem;
}

.reason-section h4,
.content-section h4 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 1rem;
}

.report-reason {
  margin: 0;
  padding: 0.75rem;
  background: white;
  border-radius: 4px;
  border-left: 4px solid #e74c3c;
}

.content-preview {
  background: white;
  padding: 1rem;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.content-preview p {
  margin: 0;
  font-style: italic;
  color: #666;
}

.users-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.user-label {
  font-size: 0.9rem;
  color: #666;
}

.user-name {
  font-weight: 500;
}

/* Действия */
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

.report-resolution h4 {
  margin: 0 0 0.5rem 0;
  color: #27ae60;
}

.report-resolution p {
  margin: 0.25rem 0;
}

/* Кнопки */
.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.btn-info {
  background: #3498db;
  color: white;
}

.btn-success {
  background: #27ae60;
  color: white;
}

.btn-danger {
  background: #e74c3c;
  color: white;
}

.btn-warning {
  background: #f39c12;
  color: white;
}

.btn-outline {
  background: transparent;
  color: #3498db;
  border: 1px solid #3498db;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

/* Загрузка */
.loading {
  text-align: center;
  padding: 3rem;
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

.no-reports {
  text-align: center;
  padding: 3rem;
  color: #666;
}

/* Адаптивность */
@media (max-width: 768px) {
  .header-tabs {
    flex-direction: column;
  }
  
  .users-section {
    grid-template-columns: 1fr;
  }
  
  .report-actions {
    flex-direction: column;
  }
  
  .report-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>