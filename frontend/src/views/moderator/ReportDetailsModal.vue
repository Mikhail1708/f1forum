<!-- frontend/src/components/moderator/ReportDetailsModal.vue -->
<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal modal-large">
      <div class="modal-header">
        <h2>📋 Детали жалобы #{{ report.id }}</h2>
        <button @click="$emit('close')" class="close-btn">×</button>
      </div>
      
      <div class="modal-content">
        <!-- Основная информация -->
        <div class="info-section">
          <h3>Основная информация</h3>
          <div class="info-grid">
            <div class="info-item">
              <label>Тип контента:</label>
              <span>{{ getContentTypeText(report.content_type) }}</span>
            </div>
            <div class="info-item">
              <label>Статус:</label>
              <span class="status-badge" :class="report.status">
                {{ getStatusText(report.status) }}
              </span>
            </div>
            <div class="info-item">
              <label>Дата создания:</label>
              <span>{{ formatDate(report.created_at) }}</span>
            </div>
            <div class="info-item">
              <label>Жалоба от:</label>
              <span>{{ report.reporter_name }} ({{ report.reporter_email }})</span>
            </div>
            <div class="info-item">
              <label>Автор контента:</label>
              <span>{{ report.author_name }} ({{ report.author_email }})</span>
            </div>
          </div>
        </div>

        <!-- Причина жалобы -->
        <div class="reason-section">
          <h3>Причина жалобы</h3>
          <div class="reason-content">
            {{ report.reason }}
          </div>
        </div>

        <!-- Содержание -->
        <div class="content-section">
          <h3>Содержание</h3>
          <div class="content-preview">
            <pre>{{ report.content_full }}</pre>
          </div>
          <button @click="viewOriginalContent" class="btn btn-outline">
            👁️ Просмотреть оригинал
          </button>
        </div>

        <!-- Комментарии модераторов -->
        <div class="notes-section">
          <h3>Комментарии модераторов ({{ notes.length }})</h3>
          <div class="notes-list">
            <div v-for="note in notes" :key="note.id" class="note-item">
              <div class="note-header">
                <span class="note-author">{{ note.moderator_name }}</span>
                <span class="note-date">{{ formatDate(note.created_at) }}</span>
              </div>
              <div class="note-content">{{ note.note }}</div>
            </div>
            <div v-if="notes.length === 0" class="no-notes">
              Комментариев пока нет
            </div>
          </div>
          
          <div class="add-note-form">
            <textarea 
              v-model="newNote" 
              placeholder="Добавить комментарий..." 
              class="note-textarea"
            ></textarea>
            <button 
              @click="addNote" 
              :disabled="!newNote.trim()" 
              class="btn btn-primary"
            >
              💬 Добавить комментарий
            </button>
          </div>
        </div>

        <!-- История действий -->
        <div class="history-section" v-if="history.length > 0">
          <h3>История действий</h3>
          <div class="history-list">
            <div v-for="item in history" :key="item.id" class="history-item">
              <span class="history-desc">{{ item.description }}</span>
              <span class="history-date">{{ formatDate(item.created_at) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Действия -->
      <div class="modal-actions" v-if="report.status === 'pending'">
        <h3>Действия с жалобой</h3>
        <div class="action-buttons">
          <button @click="resolveReport('dismiss')" class="btn btn-success">
            ✅ Отклонить жалобу
          </button>
          <button @click="resolveReport('remove_content')" class="btn btn-danger">
            🗑️ Удалить контент
          </button>
          <button @click="resolveReport('warn_user')" class="btn btn-warning">
            ⚠️ Предупредить пользователя
          </button>
          <button @click="showCustomResolution = true" class="btn btn-info">
            ⚙️ Другое действие
          </button>
        </div>

        <!-- Кастомное решение -->
        <div v-if="showCustomResolution" class="custom-resolution">
          <h4>Другое действие</h4>
          <textarea 
            v-model="customResolution" 
            placeholder="Опишите действие и причину..." 
            class="resolution-textarea"
          ></textarea>
          <div class="resolution-actions">
            <button @click="resolveWithCustom" class="btn btn-primary">
              Применить
            </button>
            <button @click="cancelCustomResolution" class="btn btn-secondary">
              Отмена
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const props = defineProps({
  report: Object,
  notes: Array,
  history: Array
});

const emit = defineEmits(['close', 'resolve', 'add-note']);

const newNote = ref('');
const showCustomResolution = ref(false);
const customResolution = ref('');

const getContentTypeText = (type) => {
  return type === 'topic' ? 'Тема' : 'Комментарий';
};

const getStatusText = (status) => {
  return status === 'pending' ? 'Ожидает' : 'Решена';
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('ru-RU');
};

const viewOriginalContent = () => {
  if (props.report.content_type === 'topic') {
    router.push(`/discussion/${props.report.content_id}`);
  }
  emit('close');
};

const addNote = () => {
  if (newNote.value.trim()) {
    emit('add-note', newNote.value.trim());
    newNote.value = '';
  }
};

const resolveReport = (action) => {
  emit('resolve', {
    action,
    moderator_notes: `Стандартное действие: ${action}`
  });
};

const resolveWithCustom = () => {
  if (customResolution.value.trim()) {
    emit('resolve', {
      action: 'other',
      moderator_notes: customResolution.value.trim()
    });
    showCustomResolution.value = false;
    customResolution.value = '';
  }
};

const cancelCustomResolution = () => {
  showCustomResolution.value = false;
  customResolution.value = '';
};
</script>

<style scoped>
.modal-large {
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
}

.modal-header h2 {
  margin: 0;
  color: #2c3e50;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #666;
}

.modal-content {
  padding: 1.5rem;
}

.info-section,
.reason-section,
.content-section,
.notes-section,
.history-section {
  margin-bottom: 2rem;
}

.info-section h3,
.reason-section h3,
.content-section h3,
.notes-section h3,
.history-section h3 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  border-bottom: 2px solid #3498db;
  padding-bottom: 0.5rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-item label {
  font-weight: bold;
  color: #666;
  font-size: 0.9rem;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
}

.status-badge.pending {
  background: #fff3cd;
  color: #856404;
}

.status-badge.resolved {
  background: #d4edda;
  color: #155724;
}

.reason-content {
  background: #fff5f5;
  padding: 1rem;
  border-radius: 4px;
  border-left: 4px solid #e74c3c;
  font-weight: 500;
}

.content-preview {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  max-height: 200px;
  overflow-y: auto;
}

.content-preview pre {
  margin: 0;
  white-space: pre-wrap;
  font-family: inherit;
}

.notes-list {
  margin-bottom: 1rem;
  max-height: 200px;
  overflow-y: auto;
}

.note-item {
  background: white;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  border: 1px solid #e0e0e0;
}

.note-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.note-author {
  font-weight: bold;
  color: #3498db;
}

.note-date {
  color: #666;
}

.note-content {
  color: #333;
}

.no-notes {
  text-align: center;
  padding: 2rem;
  color: #666;
  font-style: italic;
}

.add-note-form {
  border-top: 1px solid #e0e0e0;
  padding-top: 1rem;
}

.note-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  min-height: 80px;
  margin-bottom: 0.5rem;
  font-family: inherit;
}

.history-list {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.history-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e0e0e0;
  font-size: 0.9rem;
}

.history-item:last-child {
  border-bottom: none;
}

.history-desc {
  flex: 1;
}

.history-date {
  color: #666;
  min-width: 150px;
  text-align: right;
}

.modal-actions {
  background: #f8f9fa;
  padding: 1.5rem;
  border-top: 1px solid #e0e0e0;
}

.modal-actions h3 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.custom-resolution {
  background: white;
  padding: 1rem;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.custom-resolution h4 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.resolution-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  min-height: 100px;
  margin-bottom: 0.5rem;
  font-family: inherit;
}

.resolution-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
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
}

.btn-primary {
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

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-outline {
  background: transparent;
  color: #3498db;
  border: 1px solid #3498db;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}
</style>