<template>
  <div class="backup-management">
    <div class="page-header">
      <h1>Управление бэкапами базы данных</h1>
      <div class="header-actions">
        <button @click="createBackup" class="btn btn-primary" :disabled="creating">
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

    <!-- Статистика бэкапов -->
    <div class="backup-stats">
      <div class="stat-card">
        <div class="stat-value">{{ backups.length }}</div>
        <div class="stat-label">Всего бэкапов</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ totalSize }}</div>
        <div class="stat-label">Общий размер</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ lastBackupDate }}</div>
        <div class="stat-label">Последний бэкап</div>
      </div>
    </div>

    <div class="backups-list">
      <h2>Список бэкапов</h2>
      
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Загрузка бэкапов...</p>
      </div>
      
      <div v-else-if="backups.length === 0" class="no-backups">
        <div class="no-data-icon">📁</div>
        <p>Бэкапы не найдены</p>
        <p class="no-data-hint">Создайте первый бэкап базы данных</p>
      </div>

      <div v-else class="backup-cards">
        <div v-for="backup in backups" :key="backup.id" class="backup-card">
          <div class="backup-info">
            <div class="backup-header">
              <h3>{{ backup.filename }}</h3>
              <span class="backup-id">#{{ backup.id }}</span>
            </div>
            <div class="backup-meta">
              <div class="meta-item">
                <span class="meta-icon">📅</span>
                <span>{{ formatDate(backup.created_at) }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-icon">📦</span>
                <span>{{ formatSize(backup.size) }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-icon">👤</span>
                <span>{{ backup.created_by_username || 'Система' }}</span>
              </div>
            </div>
            <p v-if="backup.notes" class="backup-notes">
              <strong>Примечания:</strong> {{ backup.notes }}
            </p>
          </div>
          
          <div class="backup-actions">
            <button 
              @click="restoreBackup(backup.id)" 
              class="btn btn-warning"
              :disabled="restoring"
              title="Восстановить базу из этого бэкапа"
            >
              🔄 Восстановить
            </button>
            <button 
              @click="downloadBackup(backup.id)" 
              class="btn btn-primary"
              :disabled="downloading"
              title="Скачать файл бэкапа"
            >
              📥 Скачать
            </button>
            <button 
              @click="deleteBackup(backup.id)" 
              class="btn btn-danger"
              title="Удалить бэкап"
            >
              🗑️ Удалить
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно создания бэкапа -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>Создание бэкапа базы данных</h3>
          <button @click="showCreateModal = false" class="modal-close">×</button>
        </div>
        <div class="modal-content">
          <div class="form-group">
            <label>Название бэкапа:</label>
            <input 
              v-model="newBackupName" 
              placeholder="Введите название..." 
              class="modal-input"
              @keyup.enter="confirmCreateBackup"
            >
          </div>
          
          <div class="form-group">
            <label>Примечания:</label>
            <textarea 
              v-model="newBackupNotes" 
              placeholder="Дополнительные примечания..." 
              class="modal-textarea"
              rows="3"
            ></textarea>
          </div>

          <div class="backup-info">
            <h4>Информация о бэкапе:</h4>
            <ul>
              <li>Будет создана полная копия базы данных</li>
              <li>Файл сохранится на сервере</li>
              <li>Бэкап можно будет скачать или восстановить</li>
              <li>Процесс может занять несколько минут</li>
            </ul>
          </div>
        </div>
        <div class="modal-actions">
          <button 
            @click="confirmCreateBackup" 
            class="btn btn-primary" 
            :disabled="creating || !newBackupName.trim()"
          >
            <span v-if="creating" class="creating-spinner"></span>
            {{ creating ? 'Создание...' : 'Создать бэкап' }}
          </button>
          <button @click="showCreateModal = false" class="btn btn-secondary">Отмена</button>
        </div>
      </div>
    </div>

    <!-- Модальное окно восстановления -->
    <div v-if="showRestoreModal" class="modal-overlay" @click.self="showRestoreModal = false">
      <div class="modal modal-warning">
        <div class="modal-header">
          <h3>⚠️ Восстановление базы данных</h3>
          <button @click="showRestoreModal = false" class="modal-close">×</button>
        </div>
        <div class="modal-content">
          <div class="warning-message">
            <p><strong>ВНИМАНИЕ! Это действие:</strong></p>
            <ul>
              <li>Заменит текущую базу данных</li>
              <li>Удалит все данные, созданные после этого бэкапа</li>
              <li>Может занять несколько минут</li>
              <li>Сайт будет временно недоступен</li>
            </ul>
            <p>Вы уверены, что хотите продолжить?</p>
          </div>
        </div>
        <div class="modal-actions">
          <button 
            @click="confirmRestoreBackup" 
            class="btn btn-danger"
            :disabled="restoring"
          >
            <span v-if="restoring" class="creating-spinner"></span>
            {{ restoring ? 'Восстановление...' : 'Да, восстановить' }}
          </button>
          <button @click="showRestoreModal = false" class="btn btn-secondary">Отмена</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import api from '../../services/api';

const backups = ref([]);
const loading = ref(false);
const restoring = ref(false);
const downloading = ref(false);
const creating = ref(false);
const showCreateModal = ref(false);
const showRestoreModal = ref(false);
const newBackupName = ref('');
const newBackupNotes = ref('');
const selectedBackupId = ref(null);

const autoBackupSettings = ref({
  frequency: 'weekly',
  keepCount: 10
});

// Computed свойства
const totalSize = computed(() => {
  const totalBytes = backups.value.reduce((sum, backup) => sum + (backup.size || 0), 0);
  return formatSize(totalBytes);
});

const lastBackupDate = computed(() => {
  if (backups.value.length === 0) return 'Нет бэкапов';
  return formatDate(backups.value[0].created_at);
});

onMounted(async () => {
  await loadBackups();
});

const loadBackups = async () => {
  loading.value = true;
  try {
    const response = await api.get('/admin/backups');
    if (response.data.success) {
      backups.value = response.data.backups;
      console.log('✅ Backups loaded:', backups.value.length);
    } else {
      console.error('Ошибка загрузки бэкапов:', response.data.error);
      alert('Ошибка загрузки бэкапов: ' + response.data.error);
    }
  } catch (error) {
    console.error('❌ Ошибка загрузки бэкапов:', error);
    alert('Ошибка загрузки бэкапов: ' + error.message);
  } finally {
    loading.value = false;
  }
};

const createBackup = () => {
  newBackupName.value = `backup-${new Date().toLocaleDateString('ru-RU')}`;
  newBackupNotes.value = '';
  showCreateModal.value = true;
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
      alert('✅ Бэкап успешно создан!');
    } else {
      alert('❌ Ошибка создания бэкапа: ' + response.data.error);
    }
  } catch (error) {
    console.error('❌ Ошибка создания бэкапа:', error);
    alert('❌ Ошибка создания бэкапа: ' + (error.response?.data?.error || error.message));
  } finally {
    creating.value = false;
  }
};

const restoreBackup = (backupId) => {
  selectedBackupId.value = backupId;
  showRestoreModal.value = true;
};

const confirmRestoreBackup = async () => {
  restoring.value = true;
  try {
    const response = await api.post(`/admin/backups/${selectedBackupId.value}/restore`);
    if (response.data.success) {
      showRestoreModal.value = false;
      selectedBackupId.value = null;
      alert('✅ База данных успешно восстановлена!');
    } else {
      alert('❌ Ошибка восстановления: ' + response.data.error);
    }
  } catch (error) {
    console.error('❌ Ошибка восстановления бэкапа:', error);
    alert('❌ Ошибка восстановления бэкапа: ' + (error.response?.data?.error || error.message));
  } finally {
    restoring.value = false;
  }
};

const downloadBackup = async (backupId) => {
  downloading.value = true;
  try {
    console.log('📥 Downloading backup:', backupId);

    // Используем axios с responseType: 'blob' для скачивания файлов
    const response = await api.get(`/admin/backups/${backupId}/download`, {
      responseType: 'blob' // Важно для файлов!
    });
    
    console.log('✅ Download response received');

    // Создаем blob из ответа
    const blob = new Blob([response.data], { type: 'application/sql' });
    const url = window.URL.createObjectURL(blob);
    
    // Создаем ссылку для скачивания
    const link = document.createElement('a');
    link.href = url;
    
    // Получаем имя файла из заголовков или генерируем
    let filename = `backup-${backupId}.sql`;
    const contentDisposition = response.headers['content-disposition'];
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }
    }
    
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    // Освобождаем URL
    window.URL.revokeObjectURL(url);
    
    console.log('✅ Backup downloaded successfully:', filename);
    
  } catch (error) {
    console.error('❌ Ошибка скачивания бэкапа:', error);
    
    if (error.response?.status === 401) {
      alert('❌ Ошибка авторизации. Пожалуйста, войдите снова.');
    } else {
      alert('❌ Ошибка скачивания бэкапа: ' + (error.response?.data?.error || error.message));
    }
  } finally {
    downloading.value = false;
  }
};
const deleteBackup = async (backupId) => {
  if (!confirm('Удалить этот бэкап? Это действие нельзя отменить.')) {
    return;
  }
  
  try {
    const response = await api.delete(`/admin/backups/${backupId}`);
    if (response.data.success) {
      backups.value = backups.value.filter(b => b.id !== backupId);
      alert('✅ Бэкап успешно удален!');
    } else {
      alert('❌ Ошибка удаления: ' + response.data.error);
    }
  } catch (error) {
    console.error('❌ Ошибка удаления бэкапа:', error);
    alert('❌ Ошибка удаления бэкапа: ' + (error.response?.data?.error || error.message));
  }
};

const saveSettings = async () => {
  try {
    // TODO: API запрос для сохранения настроек
    console.log('Сохранение настроек:', autoBackupSettings.value);
    alert('✅ Настройки сохранены!');
  } catch (error) {
    console.error('❌ Ошибка сохранения настроек:', error);
    alert('❌ Ошибка сохранения настроек: ' + error.message);
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
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.page-header h1 {
  margin: 0;
  color: #2c3e50;
  font-size: 2rem;
}

.backup-controls {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  display: flex;
  align-items: end;
  gap: 2rem;
  flex-wrap: wrap;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.control-group label {
  font-weight: 600;
  font-size: 0.9rem;
  color: #2c3e50;
}

.control-select,
.control-input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  min-width: 150px;
  font-size: 0.9rem;
}

.control-input {
  width: 80px;
}

/* Статистика */
.backup-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #7f8c8d;
  font-size: 0.9rem;
}

.backups-list {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.backups-list h2 {
  margin: 0 0 1.5rem 0;
  color: #2c3e50;
  font-size: 1.5rem;
}

.backup-cards {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.backup-card {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fafafa;
  transition: all 0.3s ease;
}

.backup-card:hover {
  border-color: #3498db;
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.1);
}

.backup-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.backup-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.backup-id {
  background: #e0e0e0;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  color: #666;
}

.backup-meta {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 0.5rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #7f8c8d;
}

.meta-icon {
  font-size: 1rem;
}

.backup-notes {
  margin: 0;
  font-size: 0.9rem;
  color: #666;
  background: #f8f9fa;
  padding: 0.5rem;
  border-radius: 4px;
  border-left: 3px solid #3498db;
}

.backup-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
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

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
  transform: translateY(-1px);
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #7f8c8d;
}

.btn-success {
  background: #27ae60;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #219a52;
}

.btn-warning {
  background: #f39c12;
  color: white;
}

.btn-warning:hover:not(:disabled) {
  background: #e67e22;
}

.btn-danger {
  background: #e74c3c;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c0392b;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

/* Модальные окна */
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
  padding: 20px;
}

.modal {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-warning {
  border-left: 6px solid #e74c3c;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #7f8c8d;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  color: #e74c3c;
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
  font-weight: 600;
  color: #2c3e50;
}

.modal-input,
.modal-textarea {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  width: 100%;
  font-family: inherit;
  font-size: 0.9rem;
}

.modal-textarea {
  min-height: 80px;
  resize: vertical;
}

.modal-input:focus,
.modal-textarea:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.backup-info {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 6px;
  margin-top: 1rem;
}

.backup-info h4 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.backup-info ul {
  margin: 0;
  padding-left: 1.5rem;
  color: #666;
}

.backup-info li {
  margin-bottom: 0.25rem;
}

.warning-message {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 6px;
  padding: 1rem;
  color: #856404;
}

.warning-message ul {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.modal-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  padding: 1.5rem;
  border-top: 1px solid #e0e0e0;
}

/* Спиннер */
.creating-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  display: inline-block;
  margin-right: 0.5rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Состояния загрузки */
.loading {
  text-align: center;
  padding: 3rem;
  color: #7f8c8d;
}

.no-backups {
  text-align: center;
  padding: 3rem;
  color: #7f8c8d;
}

.no-data-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.no-data-hint {
  font-size: 0.9rem;
  margin-top: 0.5rem;
  color: #95a5a6;
}

/* Адаптивность */
@media (max-width: 768px) {
  .backup-management {
    padding: 15px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .backup-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .control-group {
    width: 100%;
  }
  
  .backup-card {
    flex-direction: column;
    gap: 1rem;
  }
  
  .backup-actions {
    width: 100%;
    justify-content: stretch;
  }
  
  .backup-actions .btn {
    flex: 1;
    justify-content: center;
  }
  
  .backup-meta {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .modal {
    margin: 20px;
    width: calc(100% - 40px);
  }
  
  .modal-actions {
    flex-direction: column;
  }
}
</style>