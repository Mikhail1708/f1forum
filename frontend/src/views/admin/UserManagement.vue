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
            <th>Роль</th>
            <th>Статус</th>
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
              <select 
                v-model="user.role" 
                @change="updateUserRole(user)"
                class="role-select"
                :disabled="user.id === currentUserId"
              >
                <option value="user">Пользователь</option>
                <option value="moderator">Модератор</option>
                <option value="admin">Администратор</option>
              </select>
            </td>
            <td>
              <span class="status-badge" :class="user.status">
                {{ getStatusText(user.status) }}
              </span>
            </td>
            <td>{{ formatDate(user.created_at) }}</td>
            <td>
              <div class="action-buttons">
                <button 
                  v-if="user.status === 'active' && user.id !== currentUserId" 
                  @click="banUser(user.id)"
                  class="btn btn-warning"
                  :disabled="actionLoading"
                >
                  {{ actionLoading ? '...' : 'Забанить' }}
                </button>
                <button 
                  v-if="user.status === 'banned' && user.id !== currentUserId" 
                  @click="unbanUser(user.id)"
                  class="btn btn-success"
                  :disabled="actionLoading"
                >
                  {{ actionLoading ? '...' : 'Разбанить' }}
                </button>
                <button 
                  v-if="user.id !== currentUserId"
                  @click="deleteUser(user.id)"
                  class="btn btn-danger"
                  :disabled="actionLoading"
                >
                  {{ actionLoading ? '...' : 'Удалить' }}
                </button>
                <span v-if="user.id === currentUserId" class="current-user-hint">Это вы</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Модальное окно подтверждения -->
    <div v-if="showConfirmModal" class="modal-overlay">
      <div class="modal">
        <h3>{{ confirmTitle }}</h3>
        <p>{{ confirmMessage }}</p>
        <div class="modal-actions">
          <button @click="confirmAction" class="btn btn-danger" :disabled="actionLoading">
            {{ actionLoading ? 'Выполнение...' : 'Подтвердить' }}
          </button>
          <button @click="cancelAction" class="btn btn-secondary">Отмена</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../../stores/auth';
import api from '../../services/api';

const authStore = useAuthStore();
const users = ref([]);
const searchQuery = ref('');
const loading = ref(false);
const actionLoading = ref(false);
const error = ref('');
const currentUserId = ref(authStore.user?.id);

// Модальное окно подтверждения
const showConfirmModal = ref(false);
const confirmTitle = ref('');
const confirmMessage = ref('');
let pendingAction = null;

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
    const response = await api.get('/admin/users');
    if (response.data.success) {
      users.value = response.data.users;
    } else {
      error.value = response.data.error || 'Ошибка загрузки пользователей';
    }
  } catch (error) {
    console.error('Ошибка загрузки пользователей:', error);
    error.value = 'Не удалось загрузить список пользователей';
  } finally {
    loading.value = false;
  }
};

const updateUserRole = async (user) => {
  actionLoading.value = true;
  try {
    const response = await api.put(`/admin/users/${user.id}/role`, { 
      role: user.role 
    });
    
    if (response.data.success) {
      console.log('Роль пользователя обновлена');
    } else {
      error.value = response.data.error || 'Ошибка обновления роли';
      // Откатываем изменение
      await loadUsers();
    }
  } catch (error) {
    console.error('Ошибка обновления роли:', error);
    error.value = 'Ошибка обновления роли пользователя';
    // Откатываем изменение
    await loadUsers();
  } finally {
    actionLoading.value = false;
  }
};

const banUser = (userId) => {
  confirmTitle.value = 'Блокировка пользователя';
  confirmMessage.value = 'Вы уверены, что хотите заблокировать этого пользователя?';
  pendingAction = async () => {
    await updateUserStatus(userId, 'banned');
  };
  showConfirmModal.value = true;
};

const unbanUser = (userId) => {
  confirmTitle.value = 'Разблокировка пользователя';
  confirmMessage.value = 'Вы уверены, что хотите разблокировать этого пользователя?';
  pendingAction = async () => {
    await updateUserStatus(userId, 'active');
  };
  showConfirmModal.value = true;
};

const deleteUser = (userId) => {
  confirmTitle.value = 'Удаление пользователя';
  confirmMessage.value = 'ВНИМАНИЕ: Это действие нельзя отменить. Вы уверены, что хотите удалить этого пользователя?';
  pendingAction = async () => {
    await performDeleteUser(userId);
  };
  showConfirmModal.value = true;
};

const updateUserStatus = async (userId, status) => {
  actionLoading.value = true;
  try {
    const response = await api.put(`/admin/users/${userId}/status`, { 
      status: status 
    });
    
    if (response.data.success) {
      // Обновляем статус локально без перезагрузки всего списка
      const userIndex = users.value.findIndex(u => u.id === userId);
      if (userIndex !== -1) {
        users.value[userIndex].status = status;
      }
    } else {
      error.value = response.data.error || 'Ошибка обновления статуса';
    }
  } catch (error) {
    console.error('Ошибка обновления статуса:', error);
    error.value = 'Ошибка обновления статуса пользователя';
  } finally {
    actionLoading.value = false;
  }
};

const performDeleteUser = async (userId) => {
  actionLoading.value = true;
  try {
    // Используем эндпоинт для удаления пользователя
    const response = await api.delete(`/admin/users/${userId}`);
    
    if (response.data.success) {
      // Удаляем пользователя из списка
      users.value = users.value.filter(u => u.id !== userId);
    } else {
      error.value = response.data.error || 'Ошибка удаления пользователя';
    }
  } catch (error) {
    console.error('Ошибка удаления пользователя:', error);
    error.value = 'Ошибка удаления пользователя';
  } finally {
    actionLoading.value = false;
  }
};

const confirmAction = async () => {
  if (pendingAction) {
    await pendingAction();
  }
  showConfirmModal.value = false;
  pendingAction = null;
};

const cancelAction = () => {
  showConfirmModal.value = false;
  pendingAction = null;
};

const getStatusText = (status) => {
  const statusMap = {
    active: 'Активен',
    banned: 'Заблокирован',
    suspended: 'Приостановлен'
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

.role-select {
  padding: 0.4rem 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  font-size: 13px;
  cursor: pointer;
}

.role-select:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
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

.status-badge.banned {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.status-badge.suspended {
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

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
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

.current-user-hint {
  font-size: 0.8rem;
  color: #6c757d;
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
  border: 1px solid #f5c6cb;
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
  font-size: 1.3rem;
}

.modal p {
  margin: 0 0 1.5rem 0;
  color: #7f8c8d;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

/* Адаптивность */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-input {
    width: 100%;
  }
  
  .users-table-container {
    border-radius: 0;
    margin: 0 -20px;
  }
  
  .action-buttons {
    flex-direction: column;
    align-items: stretch;
  }
  
  .btn {
    width: 100%;
  }
}
</style>