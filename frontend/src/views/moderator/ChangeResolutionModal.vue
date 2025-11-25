<!-- frontend/src/components/moderator/ChangeResolutionModal.vue -->
<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h2>✏️ Изменить решение по жалобе #{{ report.id }}</h2>
        <button @click="$emit('close')" class="close-btn">×</button>
      </div>
      
      <div class="modal-content">
        <div class="form-group">
          <label>Статус жалобы:</label>
          <select v-model="formData.status" class="form-select">
            <option value="pending">🔄 Ожидает решения</option>
            <option value="resolved">✅ Решена</option>
          </select>
        </div>

        <div class="form-group">
          <label>Решение:</label>
          <select v-model="formData.resolution" class="form-select">
            <option value="approved">✅ Контент одобрен</option>
            <option value="removed">🗑️ Контент удален</option>
            <option value="dismiss">❌ Жалоба отклонена</option>
            <option value="warn_user">⚠️ Пользователь предупрежден</option>
            <option value="edited">✏️ Контент отредактирован</option>
          </select>
        </div>

        <div class="form-group">
          <label>Комментарий модератора:</label>
          <textarea 
            v-model="formData.moderator_notes" 
            placeholder="Опишите причину изменения решения..." 
            class="form-textarea"
            rows="4"
          ></textarea>
        </div>

        <div class="current-resolution" v-if="report.resolution">
          <h4>Текущее решение:</h4>
          <p><strong>Статус:</strong> {{ getStatusText(report.status) }}</p>
          <p><strong>Решение:</strong> {{ report.resolution }}</p>
          <p v-if="report.moderator_notes"><strong>Комментарий:</strong> {{ report.moderator_notes }}</p>
        </div>
      </div>

      <div class="modal-actions">
        <button @click="updateResolution" class="btn btn-primary" :disabled="!isFormValid">
          💾 Сохранить изменения
        </button>
        <button @click="$emit('close')" class="btn btn-secondary">
          Отмена
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  report: Object
});

const emit = defineEmits(['close', 'update']);

const formData = ref({
  status: props.report.status,
  resolution: props.report.resolution || 'dismiss',
  moderator_notes: props.report.moderator_notes || ''
});

const isFormValid = computed(() => {
  return formData.value.status && formData.value.resolution;
});

watch(() => formData.value.status, (newStatus) => {
  if (newStatus === 'pending') {
    formData.value.resolution = '';
  }
});

const getStatusText = (status) => {
  return status === 'pending' ? 'Ожидает' : 'Решена';
};

const updateResolution = () => {
  emit('update', formData.value);
};
</script>

<style scoped>
.modal {
  max-width: 500px;
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
  font-size: 1.25rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
}

.modal-content {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
  color: #2c3e50;
}

.form-select,
.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
  font-size: 1rem;
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.current-resolution {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
  border-left: 4px solid #3498db;
  margin-top: 1rem;
}

.current-resolution h4 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.current-resolution p {
  margin: 0.25rem 0;
  font-size: 0.9rem;
}

.modal-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  padding: 1.5rem;
  border-top: 1px solid #e0e0e0;
  background: #f8f9fa;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
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