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

    <div class="users-table-container">
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
                  v-if="user.status === 'active'" 
                  @click="banUser(user.id)"
                  class="btn btn-warning"
                >
                  Забанить
                </button>
                <button 
                  v-if="user.status === 'banned'" 
                  @click="unbanUser(user.id)"
                  class="btn btn-success"
                >
                  Разбанить
                </button>
                <button 
                  @click="deleteUser(user.id)"
                  class="btn btn-danger"
                  :disabled="user.id === currentUserId"
                >
                  Удалить
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="loading" class="loading">Загрузка...</div>
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
const currentUserId = ref(authStore.user?.id);

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
  try {
    const response = await api.get('/admin/users');
    if (response.data.success) {
      users.value = response.data.users;
    }
  } catch (error) {
    console.error('Ошибка загрузки пользователей:', error);
  } finally {
    loading.value = false;
  }
};

const updateUserRole = async (user) => {
  try {
    const response = await api.put(`/admin/users/${user.id}/role`, { role: user.role });
    if (response.data.success) {
      console.log('Роль пользователя обновлена');
    }
  } catch (error) {
    console.error('Ошибка обновления роли:', error);
    // Откатываем изменение в UI если ошибка
    await loadUsers();
  }
};

const banUser = async (userId) => {
  if (confirm('Забанить пользователя?')) {
    try {
      await api.put(`/admin/users/${userId}/status`, { status: 'banned' });
      await loadUsers(); // Перезагружаем список
    } catch (error) {
      console.error('Ошибка бана пользователя:', error);
    }
  }
};

const unbanUser = async (userId) => {
  try {
    await api.put(`/admin/users/${userId}/status`, { status: 'active' });
    await loadUsers(); // Перезагружаем список
  } catch (error) {
    console.error('Ошибка разбана пользователя:', error);
  }
};

const deleteUser = async (userId) => {
  if (confirm('Удалить пользователя? Это действие нельзя отменить.')) {
    try {
      // TODO: Добавить API для удаления пользователей если нужно
      console.log('Удаление пользователя:', userId);
      users.value = users.value.filter(u => u.id !== userId);
    } catch (error) {
      console.error('Ошибка удаления пользователя:', error);
    }
  }
};

const getStatusText = (status) => {
  const statusMap = {
    active: 'Активен',
    banned: 'Забанен',
    suspended: 'Приостановлен'
  };
  return statusMap[status] || status;
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('ru-RU');
};
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.search-input {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 300px;
}

.users-table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.users-table {
  width: 100%;
  border-collapse: collapse;
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
}

.user-info {
  display: flex;
  flex-direction: column;
}

.username {
  font-weight: 500;
}

.user-team {
  font-size: 0.8rem;
  color: #7f8c8d;
}

.role-select {
  padding: 0.25rem 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
}

.status-badge.active {
  background: #d4edda;
  color: #155724;
}

.status-badge.banned {
  background: #f8d7da;
  color: #721c24;
}

.status-badge.suspended {
  background: #fff3cd;
  color: #856404;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn {
  padding: 0.25rem 0.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.btn-warning {
  background: #fff3cd;
  color: #856404;
}

.btn-success {
  background: #d4edda;
  color: #155724;
}

.btn-danger {
  background: #f8d7da;
  color: #721c24;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #7f8c8d;
}
</style>