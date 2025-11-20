<!-- frontend/src/views/moderator/UserManagement.vue -->
<template>
  <div class="user-management">
    <div class="page-header">
      <h1>Управление пользователями</h1>
      <div class="header-actions">
        <input 
          v-model="searchQuery" 
          placeholder="Поиск пользователей..." 
          class="search-input"
        >
      </div>
    </div>

    <div v-if="loading" class="loading">Загрузка пользователей...</div>
    <div v-else-if="error" class="error-message">{{ error }}</div>

    <div v-else class="users-table-container">
      <table class="users-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Имя</th>
            <th>Email</th>
            <th>Статус</th>
            <th>Предупреждения</th>
            <th>Дата регистрации</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in filteredUsers" :key="user.id">
            <td>{{ user.id }}</td>
            <td>
              <div class="user-info">
                <span class="username">{{ user.username }}</span>
                <span v-if="user.favorite_team" class="user-team">🏎️ {{ user.favorite_team }}</span>
              </div>
            </td>
            <td>{{ user.email }}</td>
            <td>
              <span class="status-badge" :class="user.status">
                {{ getStatusText(user.status) }}
              </span>
            </td>
            <td>
              <span class="warning-badge" :class="{ 'has-warnings': user.warning_count > 0 }">
                {{ user.warning_count || 0 }}
              </span>
            </td>
            <td>{{ formatDate(user.created_at) }}</td>
            <td>
              <div class="action-buttons">
                <button 
                  v-if="user.status === 'active'" 
                  @click="warnUser(user.id)"
                  class="btn btn-warning"
                  :disabled="actionLoading"
                >
                  ⚠️ Предупредить
                </button>
                <button 
                  v-if="user.status === 'active' && user.id !== currentUserId" 
                  @click="suspendUser(user.id)"
                  class="btn btn-danger"
                  :disabled="actionLoading"
                >
                  🔒 Заблокировать
                </button>
                <button 
                  v-if="user.status === 'suspended'" 
                  @click="unsuspendUser(user.id)"
                  class="btn btn-success"
                  :disabled="actionLoading"
                >
                  🔓 Разблокировать
                </button>
                <button 
                  @click="viewUserProfile(user.id)"
                  class="btn btn-secondary"
                >
                  👁️ Профиль
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Модальное окно предупреждения -->
    <div v-if="showWarnModal" class="modal-overlay">
      <div class="modal">
        <h3>Выдать предупреждение</h3>
        <div class="modal-content">
          <label>Причина предупреждения:</label>
          <textarea v-model="warnReason" placeholder="Опишите причину предупреждения..." class="modal-textarea"></textarea>
        </div>
        <div class="modal-actions">
          <button @click="confirmWarn" class="btn btn-warning" :disabled="actionLoading">
            {{ actionLoading ? 'Отправка...' : 'Выдать предупреждение' }}
          </button>
          <button @click="cancelWarn" class="btn btn-secondary">Отмена</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import api from '../../services/api';

const authStore = useAuthStore();
const router = useRouter();
const users = ref([]);
const searchQuery = ref('');
const loading = ref(false);
const actionLoading = ref(false);
const error = ref('');
const currentUserId = ref(authStore.user?.id);

// Модальное окно предупреждения
const showWarnModal = ref(false);
const warnReason = ref('');
let warnUserId = null;

const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value;
  
  const query = searchQuery.value.toLowerCase();
  return users.value.filter(user => 
    user.username.toLowerCase().includes(query) ||
    user.email.toLowerCase().includes(query)
  );
});

onMounted(async () => {
  await loadUsers();
});

const loadUsers = async () => {
  loading.value = true;
  error.value = '';
  try {
    const response = await api.get('/moderator/users');
    if (response.data.success) {
      users.value = response.data.users;
    } else {
      error.value = response.data.error || 'Ошибка загрузки пользователей';
    }
  } catch (error) {
    console.error('Ошибка загрузки пользователей:', error);
    error.value = 'Не удалось загрузить список пользователей';
    
    // Заглушка для демонстрации
    users.value = [
      {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        status: 'active',
        warning_count: 1,
        favorite_team: 'Ferrari',
        created_at: new Date().toISOString()
      }
    ];
  } finally {
    loading.value = false;
  }
};

const warnUser = (userId) => {
  warnUserId = userId;
  warnReason.value = '';
  showWarnModal.value = true;
};

const confirmWarn = async () => {
  if (!warnReason.value.trim()) {
    alert('Пожалуйста, укажите причину предупреждения');
    return;
  }

  actionLoading.value = true;
  try {
    const response = await api.post(`/moderator/users/${warnUserId}/warn`, {
      reason: warnReason.value
    });
    
    if (response.data.success) {
      // Обновляем данные пользователя
      await loadUsers();
      showWarnModal.value = false;
      alert('Предупреждение успешно выдано');
    } else {
      error.value = response.data.error || 'Ошибка выдачи предупреждения';
    }
  } catch (error) {
    console.error('Ошибка выдачи предупреждения:', error);
    alert('Ошибка выдачи предупреждения: ' + error.message);
  } finally {
    actionLoading.value = false;
  }
};

const cancelWarn = () => {
  showWarnModal.value = false;
  warnUserId = null;
  warnReason.value = '';
};

const suspendUser = async (userId) => {
  if (!confirm('Заблокировать этого пользователя?')) return;
  
  actionLoading.value = true;
  try {
    const response = await api.post(`/moderator/users/${userId}/suspend`);
    if (response.data.success) {
      await loadUsers();
      alert('Пользователь заблокирован');
    } else {
      error.value = response.data.error || 'Ошибка блокировки пользователя';
    }
  } catch (error) {
    console.error('Ошибка блокировки пользователя:', error);
    alert('Ошибка блокировки пользователя: ' + error.message);
  } finally {
    actionLoading.value = false;
  }
};

const unsuspendUser = async (userId) => {
  if (!confirm('Разблокировать этого пользователя?')) return;
  
  actionLoading.value = true;
  try {
    const response = await api.post(`/moderator/users/${userId}/unsuspend`);
    if (response.data.success) {
      await loadUsers();
      alert('Пользователь разблокирован');
    } else {
      error.value = response.data.error || 'Ошибка разблокировки пользователя';
    }
  } catch (error) {
    console.error('Ошибка разблокировки пользователя:', error);
    alert('Ошибка разблокировки пользователя: ' + error.message);
  } finally {
    actionLoading.value = false;
  }
};

const viewUserProfile = (userId) => {
  router.push(`/profile/${userId}`);
};

const getStatusText = (status) => {
  const statusMap = {
    active: 'Активен',
    suspended: 'Заблокирован',
    banned: 'Забанен'
  };
  return statusMap[status] || status;
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('ru-RU');
  } catch {
    return '-';
  }
};
</script>

<style scoped>
.user-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.search-input {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 300px;
  font-size: 14px;
}

.users-table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  overflow-x: auto;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
}

.users-table th,
.users-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #ecf0f1;
}

.users-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #2c3e50;
  font-size: 14px;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.username {
  font-weight: 500;
}

.user-team {
  font-size: 0.8rem;
  color: #7f8c8d;
}

.status-badge {
  padding: 0.4rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: bold;
  display: inline-block;
  text-align: center;
  min-width: 100px;
}

.status-badge.active {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status-badge.suspended {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.status-badge.banned {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.warning-badge {
  padding: 0.3rem 0.6rem;
  border-radius: 50%;
  background: #f8f9fa;
  color: #6c757d;
  font-weight: bold;
  display: inline-block;
  min-width: 30px;
  text-align: center;
}

.warning-badge.has-warnings {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
}

.btn {
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-warning {
  background: #ffc107;
  color: #212529;
}

.btn-warning:hover:not(:disabled) {
  background: #e0a800;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #218838;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
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
  max-width: 500px;
  width: 90%;
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

.modal-textarea {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 100%;
  min-height: 100px;
  resize: vertical;
  font-family: inherit;
}

.modal-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
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
  border: 1px solid #f5c6cb;
}
</style>