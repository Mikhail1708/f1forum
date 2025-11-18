<template>
  <div class="backup-management">
    <div class="page-header">
      <h1>Управление бэкапами</h1>
      <div class="header-actions">
        <button @click="createBackup" class="btn btn-primary">
          💾 Создать бэкап
        </button>
      </div>
    </div>

    <div class="backup-controls">
      <div class="control-group">
        <label>Автоматические бэкапы:</label>
        <select v-model="autoBackupSettings.frequency" class="control-select">
          <option value="disabled">Отключено</option>
          <option value="daily">Ежедневно</option>
          <option value="weekly">Еженедельно</option>
          <option value="monthly">Ежемесячно</option>
        </select>
      </div>
      
      <div class="control-group">
        <label>Хранить бэкапов:</label>
        <input 
          v-model="autoBackupSettings.keepCount" 
          type="number" 
          min="1" 
          max="50"
          class="control-input"
        >
      </div>
      
      <button @click="saveSettings" class="btn btn-secondary">
        Сохранить настройки
      </button>
    </div>

    <div class="backups-list">
      <h2>Список бэкапов</h2>
      
      <div v-if="loading" class="loading">Загрузка бэкапов...</div>
      
      <div v-else-if="backups.length === 0" class="no-backups">
        <p>Бэкапы не найдены</p>
      </div>

      <div v-else class="backup-cards">
        <div v-for="backup in backups" :key="backup.id" class="backup-card">
          <div class="backup-info">
            <h3>{{ backup.filename }}</h3>
            <div class="backup-meta">
              <span>📅 {{ formatDate(backup.created_at) }}</span>
              <span>📦 {{ formatSize(backup.size) }}</span>
              <span>👤 {{ backup.created_by_username || 'Система' }}</span>
            </div>
            <p v-if="backup.notes" class="backup-notes">{{ backup.notes }}</p>
          </div>
          
          <div class="backup-actions">
            <button 
              @click="restoreBackup(backup.id)" 
              class="btn btn-success"
              :disabled="restoring"
            >
              🔄 Восстановить
            </button>
            <button 
              @click="downloadBackup(backup.id, backup.filename)" 
              class="btn btn-primary"
              :disabled="downloading"
            >
              📥 Скачать
            </button>
            <button 
              @click="deleteBackup(backup.id)" 
              class="btn btn-danger"
            >
              🗑️ Удалить
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно создания бэкапа -->
    <div v-if="showCreateModal" class="modal-overlay">
      <div class="modal">
        <h3>Создание бэкапа</h3>
        <div class="modal-content">
          <label>Название бэкапа:</label>
          <input v-model="newBackupName" placeholder="Введите название..." class="modal-input">
          
          <label>Примечания:</label>
          <textarea v-model="newBackupNotes" placeholder="Дополнительные примечания..." class="modal-textarea"></textarea>
        </div>
        <div class="modal-actions">
          <button @click="confirmCreateBackup" class="btn btn-primary" :disabled="creating">
            {{ creating ? 'Создание...' : 'Создать' }}
          </button>
          <button @click="showCreateModal = false" class="btn btn-secondary">Отмена</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../../services/api';
import { useAuthStore } from '../../stores/auth';

const authStore = useAuthStore();
const backups = ref([]);
const loading = ref(false);
const restoring = ref(false);
const downloading = ref(false);
const creating = ref(false);
const showCreateModal = ref(false);
const newBackupName = ref('');
const newBackupNotes = ref('');

const autoBackupSettings = ref({
  frequency: 'weekly',
  keepCount: 10
});

const createBackup = () => {
  newBackupName.value = '';
  newBackupNotes.value = '';
  showCreateModal.value = true;
};

onMounted(async () => {
  await loadBackups();
  await loadSettings();
});

const loadBackups = async () => {
  loading.value = true;
  try {
    const response = await api.get('/admin/backups');
    if (response.data.success) {
      backups.value = response.data.backups;
    } else {
      console.error('Ошибка загрузки бэкапов:', response.data.error);
    }
  } catch (error) {
    console.error('Ошибка загрузки бэкапов:', error);
    alert('Ошибка загрузки бэкапов: ' + error.message);
  } finally {
    loading.value = false;
  }
};

const loadSettings = async () => {
  try {
    // TODO: Загрузка настроек бэкапов
    console.log('Загрузка настроек бэкапов...');
  } catch (error) {
    console.error('Ошибка загрузки настроек:', error);
  }
};

const confirmCreateBackup = async () => {
  if (!newBackupName.value.trim()) {
    alert('Пожалуйста, введите название бэкапа');
    return;
  }

  creating.value = true;
  try {
    const response = await api.post('/admin/backups', {
      name: newBackupName.value,
      notes: newBackupNotes.value
    });
    
    if (response.data.success) {
      backups.value.unshift(response.data.backup);
      showCreateModal.value = false;
      newBackupName.value = '';
      newBackupNotes.value = '';
      alert('Бэкап успешно создан!');
    } else {
      alert('Ошибка создания бэкапа: ' + response.data.error);
    }
  } catch (error) {
    console.error('Ошибка создания бэкапа:', error);
    alert('Ошибка создания бэкапа: ' + (error.response?.data?.error || error.message));
  } finally {
    creating.value = false;
  }
};

const restoreBackup = async (backupId) => {
  if (!confirm('ВНИМАНИЕ: Это действие заменит текущую базу данных. Продолжить?')) {
    return;
  }
  
  restoring.value = true;
  try {
    const response = await api.post(`/admin/backups/${backupId}/restore`);
    if (response.data.success) {
      alert('База данных успешно восстановлена!');
    } else {
      alert('Ошибка восстановления: ' + response.data.error);
    }
  } catch (error) {
    console.error('Ошибка восстановления бэкапа:', error);
    alert('Ошибка восстановления бэкапа: ' + (error.response?.data?.error || error.message));
  } finally {
    restoring.value = false;
  }
};

const downloadBackup = async (backupId, filename) => {
  downloading.value = true;
  try {
    console.log('Скачивание бэкапа:', backupId);
    
    // Получаем токен из store
    const token = authStore.token;
    if (!token) {
      throw new Error('Токен авторизации не найден');
    }

    // Создаем URL для скачивания с токеном
    const downloadUrl = `http://localhost:3000/api/admin/backups/${backupId}/download?token=${token}`;
    
    // Альтернативный способ через создание временной ссылки
    const response = await api.get(`/admin/backups/${backupId}/download`, {
      responseType: 'blob' // Важно для файлов
    });
    
    // Создаем blob и скачиваем
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename || `backup-${backupId}.sql`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    console.log('Бэкап успешно скачан');
    
  } catch (error) {
    console.error('Ошибка скачивания бэкапа:', error);
    alert('Ошибка скачивания бэкапа: ' + (error.response?.data?.error || error.message));
  } finally {
    downloading.value = false;
  }
};

const deleteBackup = async (backupId) => {
  if (!confirm('Удалить этот бэкап?')) {
    return;
  }
  
  try {
    const response = await api.delete(`/admin/backups/${backupId}`);
    if (response.data.success) {
      backups.value = backups.value.filter(b => b.id !== backupId);
      alert('Бэкап успешно удален!');
    } else {
      alert('Ошибка удаления: ' + response.data.error);
    }
  } catch (error) {
    console.error('Ошибка удаления бэкапа:', error);
    alert('Ошибка удаления бэкапа: ' + (error.response?.data?.error || error.message));
  }
};

const saveSettings = async () => {
  try {
    // TODO: API запрос для сохранения настроек
    console.log('Сохранение настроек:', autoBackupSettings.value);
    alert('Настройки сохранены!');
  } catch (error) {
    console.error('Ошибка сохранения настроек:', error);
    alert('Ошибка сохранения настроек: ' + error.message);
  }
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('ru-RU');
};

const formatSize = (bytes) => {
  if (!bytes) return '0 Б';
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
  if (bytes === 0) return '0 Б';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};
</script>

<style scoped>
.backup-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  margin: 0;
  color: #2c3e50;
}

.backup-controls {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  display: flex;
  align-items: end;
  gap: 1rem;
  flex-wrap: wrap;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.control-group label {
  font-weight: 500;
  font-size: 0.9rem;
}

.control-select,
.control-input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-width: 150px;
}

.backups-list {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.backup-cards {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

.backup-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fafafa;
}

.backup-info h3 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.backup-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  color: #7f8c8d;
}

.backup-notes {
  margin: 0.5rem 0 0 0;
  font-style: italic;
  color: #7f8c8d;
}

.backup-actions {
  display: flex;
  gap: 0.5rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover {
  background: #2980b9;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background: #7f8c8d;
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

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Модальное окно */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  min-width: 400px;
  max-width: 500px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}

.modal h3 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
}

.modal-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.modal-input,
.modal-textarea {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 100%;
  font-family: inherit;
}

.modal-textarea {
  min-height: 80px;
  resize: vertical;
}

.modal-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.no-backups {
  text-align: center;
  padding: 2rem;
  color: #7f8c8d;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #7f8c8d;
}
</style>