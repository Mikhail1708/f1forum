<!-- frontend/src/views/admin/UserManagement.vue -->
<template>
  <div class="user-management">
    <div class="page-header">
      <h1>Управление пользователями</h1>
      <div class="header-stats">
        <div class="stat-item">
          <span class="stat-number">{{ adminStore.totalUsers }}</span>
          <span class="stat-label">Всего пользователей</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">{{ adminStore.adminCount }}</span>
          <span class="stat-label">Администраторов</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">{{ adminStore.moderatorCount }}</span>
          <span class="stat-label">Модераторов</span>
        </div>
      </div>
    </div>

    <!-- Поиск и фильтры -->
    <div class="filters-section">
      <div class="search-box">
        <input
          v-model="searchInput"
          type="text"
          placeholder="Поиск по имени или email..."
          @input="handleSearch"
          class="search-input"
        >
        <button @click="clearSearch" class="clear-btn" v-if="searchInput">
          ✕
        </button>
      </div>
    </div>

    <!-- Таблица пользователей -->
    <div class="users-table-container">
      <div v-if="adminStore.usersLoading" class="loading">Загрузка пользователей...</div>
      
      <div v-else-if="adminStore.users.length === 0" class="empty-state">
        <p>Пользователи не найдены</p>
      </div>

      <table v-else class="users-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Имя пользователя</th>
            <th>Email</th>
            <th>Роль</th>
            <th>Статус</th>
            <th>Дата регистрации</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in adminStore.users" :key="user.id">
            <td>{{ user.id }}</td>
            <td>
              <div class="user-info">
                <span class="username">{{ user.username }}</span>
                <div v-if="user.favorite_team" class="user-meta">
                  Команда: {{ user.favorite_team }}
                </div>
              </div>
            </td>
            <td>{{ user.email }}</td>
            <td>
              <select 
                :value="user.role" 
                @change="updateUserRole(user.id, $event.target.value)"
                class="role-select"
                :disabled="user.id === authStore.user?.id"
              >
                <option value="user">Пользователь</option>
                <option value="moderator">Модератор</option>
                <option value="admin">Администратор</option>
              </select>
            </td>
            <td>
              <select 
                :value="user.status" 
                @change="updateUserStatus(user.id, $event.target.value)"
                class="status-select"
                :disabled="user.id === authStore.user?.id"
              >
                <option value="active">Активен</option>
                <option value="suspended">Заблокирован</option>
                <option value="banned">Забанен</option>
              </select>
            </td>
            <td>{{ formatDate(user.created_at) }}</td>
            <td>
              <div class="actions">
                <button 
                  @click="showUserDetails(user)"
                  class="btn-info"
                  title="Подробности"
                >
                  👁️
                </button>
                <button 
                  @click="confirmDeleteUser(user)"
                  class="btn-danger"
                  :disabled="user.id === authStore.user?.id"
                  title="Удалить"
                >
                  🗑️
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Пагинация -->
    <div class="pagination" v-if="adminStore.totalPages > 1">
      <button 
        @click="changePage(adminStore.currentPage - 1)"
        :disabled="adminStore.currentPage === 1"
        class="pagination-btn"
      >
        ← Назад
      </button>
      
      <span class="page-info">
        Страница {{ adminStore.currentPage }} из {{ adminStore.totalPages }}
      </span>
      
      <button 
        @click="changePage(adminStore.currentPage + 1)"
        :disabled="adminStore.currentPage === adminStore.totalPages"
        class="pagination-btn"
      >
        Вперед →
      </button>
    </div>

    <!-- Модальное окно подтверждения удаления -->
    <div v-if="showDeleteModal" class="modal-overlay">
      <div class="modal">
        <h3>Подтверждение удаления</h3>
        <p>Вы уверены, что хотите удалить пользователя <strong>{{ userToDelete?.username }}</strong>?</p>
        <p class="warning-text">Это действие нельзя отменить!</p>
        
        <div class="modal-actions">
          <button @click="showDeleteModal = false" class="btn-cancel">Отмена</button>
          <button @click="deleteUser" class="btn-danger">Удалить</button>
        </div>
      </div>
    </div>

    <!-- Модальное окно деталей пользователя -->
    <div v-if="showDetailsModal" class="modal-overlay">
      <div class="modal modal-large">
        <h3>Детали пользователя</h3>
        
        <div v-if="selectedUser" class="user-details">
          <div class="detail-row">
            <label>ID:</label>
            <span>{{ selectedUser.id }}</span>
          </div>
          <div class="detail-row">
            <label>Имя пользователя:</label>
            <span>{{ selectedUser.username }}</span>
          </div>
          <div class="detail-row">
            <label>Email:</label>
            <span>{{ selectedUser.email }}</span>
          </div>
          <div class="detail-row">
            <label>Роль:</label>
            <span>{{ getRoleText(selectedUser.role) }}</span>
          </div>
          <div class="detail-row">
            <label>Статус:</label>
            <span :class="`status-${selectedUser.status}`">
              {{ getStatusText(selectedUser.status) }}
            </span>
          </div>
          <div class="detail-row">
            <label>Дата регистрации:</label>
            <span>{{ formatDate(selectedUser.created_at) }}</span>
          </div>
          <div class="detail-row" v-if="selectedUser.favorite_team">
            <label>Любимая команда:</label>
            <span>{{ selectedUser.favorite_team }}</span>
          </div>
          <div class="detail-row" v-if="selectedUser.favorite_driver">
            <label>Любимый пилот:</label>
            <span>{{ selectedUser.favorite_driver }}</span>
          </div>
        </div>
        
        <div class="modal-actions">
          <button @click="showDetailsModal = false" class="btn-cancel">Закрыть</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAdminStore } from '../../stores/admin';
import { useAuthStore } from '../../stores/auth';

const adminStore = useAdminStore();
const authStore = useAuthStore();

const searchInput = ref('');
const showDeleteModal = ref(false);
const showDetailsModal = ref(false);
const userToDelete = ref(null);
const selectedUser = ref(null);

// Загрузка данных при монтировании - БЕЗ API ДЛЯ ТЕСТА
onMounted(async () => {
  console.log('🔄 UserManagement mounted - TEST WITHOUT API');
  
  // ВРЕМЕННО ЗАКОММЕНТИРОВАНО ДЛЯ ТЕСТА
  
  try {
    console.log('🚀 Making API calls...');
    await adminStore.fetchUsers();
    await adminStore.fetchUserStats();
    console.log('✅ Users loaded successfully');
  } catch (error) {
    console.error('❌ Error loading users:', error);
    console.log('Error details:', {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
  }
  
});

// Обработка поиска
const handleSearch = async () => {
  try {
    await adminStore.fetchUsers(1, 20, searchInput.value);
  } catch (error) {
    console.error('❌ Search error:', error);
  }
};

// Очистка поиска
const clearSearch = async () => {
  searchInput.value = '';
  await adminStore.fetchUsers();
};

// Смена страницы
const changePage = async (page) => {
  if (page < 1 || page > adminStore.totalPages) return;
  
  try {
    await adminStore.fetchUsers(page, 20, searchInput.value);
  } catch (error) {
    console.error('❌ Page change error:', error);
  }
};

// Обновление роли пользователя
const updateUserRole = async (userId, newRole) => {
  try {
    console.log(`🔄 Updating user ${userId} role to: ${newRole}`);
    await adminStore.updateUserRole(userId, newRole);
    console.log('✅ User role updated');
  } catch (error) {
    console.error('❌ Update role error:', error);
    // Возвращаем предыдущее значение
    await adminStore.fetchUsers();
  }
};

// Обновление статуса пользователя
const updateUserStatus = async (userId, newStatus) => {
  try {
    console.log(`🔄 Updating user ${userId} status to: ${newStatus}`);
    await adminStore.updateUserStatus(userId, newStatus);
    console.log('✅ User status updated');
  } catch (error) {
    console.error('❌ Update status error:', error);
    // Возвращаем предыдущее значение
    await adminStore.fetchUsers();
  }
};

// Подтверждение удаления
const confirmDeleteUser = (user) => {
  userToDelete.value = user;
  showDeleteModal.value = true;
};

// Удаление пользователя
const deleteUser = async () => {
  if (!userToDelete.value) return;
  
  try {
    console.log(`🔄 Deleting user: ${userToDelete.value.id}`);
    await adminStore.deleteUser(userToDelete.value.id);
    console.log('✅ User deleted');
    showDeleteModal.value = false;
    userToDelete.value = null;
  } catch (error) {
    console.error('❌ Delete user error:', error);
  }
};

// Показать детали пользователя
const showUserDetails = (user) => {
  selectedUser.value = user;
  showDetailsModal.value = true;
};

// Вспомогательные функции
const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const getRoleText = (role) => {
  const roles = {
    'user': 'Пользователь',
    'moderator': 'Модератор',
    'admin': 'Администратор'
  };
  return roles[role] || role;
};

const getStatusText = (status) => {
  const statuses = {
    'active': 'Активен',
    'suspended': 'Заблокирован',
    'banned': 'Забанен'
  };
  return statuses[status] || status;
};
</script>

<style scoped>
.user-management {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.page-header h1 {
  margin: 0;
  color: #333;
}

.header-stats {
  display: flex;
  gap: 20px;
}

.stat-item {
  text-align: center;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  min-width: 120px;
}

.stat-number {
  display: block;
  font-size: 24px;
  font-weight: bold;
  color: #e10600;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 12px;
  color: #666;
  text-transform: uppercase;
}

.filters-section {
  margin-bottom: 20px;
}

.search-box {
  position: relative;
  max-width: 400px;
}

.search-input {
  width: 100%;
  padding: 10px 40px 10px 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.clear-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
}

.clear-btn:hover {
  color: #333;
}

.users-table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.loading, .empty-state {
  padding: 40px;
  text-align: center;
  color: #666;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th,
.users-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.users-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #333;
}

.user-info .username {
  font-weight: 500;
  color: #333;
}

.user-meta {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.role-select, .status-select {
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
}

.role-select:disabled, .status-select:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.actions {
  display: flex;
  gap: 8px;
}

.btn-info, .btn-danger {
  padding: 6px 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-info {
  background: #17a2b8;
  color: white;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
  padding: 20px;
}

.pagination-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
}

.pagination-btn:disabled {
  background: #f5f5f5;
  color: #999;
  cursor: not-allowed;
}

.page-info {
  color: #666;
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
}

.modal {
  background: white;
  padding: 30px;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
}

.modal-large {
  max-width: 600px;
}

.modal h3 {
  margin: 0 0 20px 0;
  color: #333;
}

.warning-text {
  color: #dc3545;
  font-weight: bold;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}

.btn-cancel {
  padding: 10px 20px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
}

/* Детали пользователя */
.user-details {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.detail-row label {
  font-weight: 600;
  color: #333;
}

.detail-row span {
  color: #666;
}

.status-active {
  color: #28a745;
}

.status-suspended {
  color: #ffc107;
}

.status-banned {
  color: #dc3545;
}
</style>