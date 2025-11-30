frontend/src/views/ProfileView.vue
<template>
  <div class="profile-view">
    <div class="profile-header">
      <h1>Профиль пользователя</h1>
      <div class="notification-badge" v-if="profileStore.hasUnreadNotifications">
        {{ profileStore.unreadNotificationsCount }}
      </div>
    </div>

    <div v-if="loading" class="loading">Загрузка профиля...</div>
    
    <div v-else-if="profileStore.userProfile" class="profile-content">
      <!-- Основная информация -->
      <div class="profile-card">
        <div class="profile-header-info">
          <div class="avatar-section">
            <div class="avatar">
              {{ getInitials(profileStore.userProfile.user.username) }}
            </div>
            <button @click="editProfile" class="edit-btn">Редактировать</button>
          </div>
          <div class="user-info">
            <h2>{{ profileStore.userProfile.user.username }}</h2>
            <p class="email">
              {{ profileStore.userProfile.user.email }}
              <span v-if="!profileStore.userProfile.user.email_verified" class="verification-badge unverified">
                Не подтвержден
                <button @click="verifyEmail" class="verify-link">Подтвердить</button>
              </span>
              <span v-else class="verification-badge verified">✓ Подтвержден</span>
            </p>
            <p class="role">Роль: {{ getRoleText(profileStore.userProfile.user.role) }}</p>
            <p class="member-since">Участник с: {{ formatDate(profileStore.userProfile.user.created_at) }}</p>
          </div>
        </div>

        <!-- Статистика -->
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-number">{{ profileStore.getUserStats.topics_count || 0 }}</div>
            <div class="stat-label">Постов</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ profileStore.getUserStats.comments_count || 0 }}</div>
            <div class="stat-label">Комментариев</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ profileStore.getUserStats.warnings_count || 0 }}</div>
            <div class="stat-label">Предупреждений</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ profileStore.userProfile.user.login_count || 0 }}</div>
            <div class="stat-label">Входов</div>
          </div>
        </div>
      </div>

      <!-- Навигация по разделам -->
      <div class="profile-tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          :class="['tab-btn', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          {{ tab.name }}
          <span v-if="tab.badge" class="tab-badge">{{ tab.badge }}</span>
        </button>
      </div>

      <!-- Содержимое вкладок -->
      <div class="tab-content">
        <!-- Мои посты -->
        <div v-if="activeTab === 'topics'" class="tab-panel">
          <h3>Мои посты</h3>
          <div v-if="profileStore.userTopics.length === 0" class="empty-state">
            <p>У вас пока нет постов</p>
            <router-link to="/discussions/create" class="create-link">Создать первый пост</router-link>
          </div>
          <div v-else class="topics-list">
            <div v-for="topic in profileStore.userTopics" :key="topic.id" class="topic-item">
              <div class="topic-header">
                <h4>{{ topic.title }}</h4>
                <span class="topic-date">{{ formatDate(topic.created_at) }}</span>
              </div>
              <div class="topic-meta">
                <span class="meta-item">👁️ {{ topic.views }} просмотров</span>
                <span class="meta-item">💬 {{ topic.comments_count }} комментариев</span>
                <span class="meta-item">❤️ {{ topic.likes_count }} лайков</span>
              </div>
              <div class="topic-status" :class="topic.status">
                {{ getStatusText(topic.status) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Мои комментарии -->
        <div v-if="activeTab === 'comments'" class="tab-panel">
          <h3>Мои комментарии</h3>
          <div v-if="profileStore.userComments.length === 0" class="empty-state">
            <p>У вас пока нет комментариев</p>
          </div>
          <div v-else class="comments-list">
            <div v-for="comment in profileStore.userComments" :key="comment.id" class="comment-item">
              <div class="comment-content">
                <p>{{ comment.content }}</p>
              </div>
              <div class="comment-meta">
                <span>В теме: 
                  <router-link :to="`/discussion/${comment.topic_id}`" class="topic-link">
                    {{ comment.topic_title }}
                  </router-link>
                </span>
                <span class="comment-date">{{ formatDate(comment.created_at) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Предупреждения -->
        <div v-if="activeTab === 'warnings'" class="tab-panel">
          <h3>Мои предупреждения</h3>
          <div v-if="profileStore.userWarnings.length === 0" class="empty-state">
            <p>У вас нет предупреждений</p>
          </div>
          <div v-else class="warnings-list">
            <div v-for="warning in profileStore.userWarnings" :key="warning.id" class="warning-item">
              <div class="warning-header">
                <h4>Предупреждение от модератора</h4>
                <span class="warning-date">{{ formatDate(warning.created_at) }}</span>
              </div>
              <div class="warning-content">
                <p><strong>Причина:</strong> {{ warning.reason }}</p>
                <p><strong>Выдал:</strong> {{ warning.moderator_username }}</p>
                <p v-if="warning.expires_at" class="expires">
                  <strong>Действует до:</strong> {{ formatDate(warning.expires_at) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Настройки -->
        <div v-if="activeTab === 'settings'" class="tab-panel">
          <h3>Настройки аккаунта</h3>
          
          <!-- Смена пароля -->
          <div class="settings-section">
            <h4>Смена пароля</h4>
            <form @submit.prevent="changePassword" class="password-form">
              <div class="form-group">
                <label>Текущий пароль:</label>
                <input 
                  v-model="passwordData.currentPassword" 
                  type="password" 
                  required
                  :class="{ 'error': passwordErrors.currentPassword }"
                >
                <div v-if="passwordErrors.currentPassword" class="error-text">
                  {{ passwordErrors.currentPassword }}
                </div>
              </div>
              
              <div class="form-group">
                <label>Новый пароль:</label>
                <input 
                  v-model="passwordData.newPassword" 
                  type="password" 
                  required
                  :class="{ 'error': passwordErrors.newPassword }"
                >
                <div v-if="passwordErrors.newPassword" class="error-text">
                  {{ passwordErrors.newPassword }}
                </div>
              </div>
              
              <div class="form-group">
                <label>Подтвердите новый пароль:</label>
                <input 
                  v-model="passwordData.confirmPassword" 
                  type="password" 
                  required
                  :class="{ 'error': passwordErrors.confirmPassword }"
                >
                <div v-if="passwordErrors.confirmPassword" class="error-text">
                  {{ passwordErrors.confirmPassword }}
                </div>
              </div>
              
              <button type="submit" :disabled="changingPassword" class="save-btn">
                {{ changingPassword ? 'Смена пароля...' : 'Сменить пароль' }}
              </button>
              
              <div v-if="passwordMessage" :class="['message', passwordSuccess ? 'success' : 'error']">
                {{ passwordMessage }}
              </div>
            </form>
          </div>

          <!-- Уведомления -->
          <div class="settings-section">
            <h4>Уведомления</h4>
            <div class="notifications-settings">
              <button @click="markAllNotificationsAsRead" class="mark-read-btn">
                Отметить все как прочитанные
              </button>
              <div class="notifications-list">
                <div v-for="notification in profileStore.notifications" :key="notification.id" 
                     :class="['notification-item', { unread: !notification.is_read }]">
                  <div class="notification-content">
                    <h5>{{ notification.title }}</h5>
                    <p>{{ notification.message }}</p>
                    <span class="notification-date">{{ formatDate(notification.created_at) }}</span>
                  </div>
                  <button v-if="!notification.is_read" 
                          @click="markNotificationAsRead(notification.id)"
                          class="read-btn">
                    ✓
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно редактирования профиля -->
    <div v-if="showEditModal" class="modal-overlay">
      <div class="modal">
        <h3>Редактирование профиля</h3>
        <form @submit.prevent="updateProfile">
          <div class="form-group">
            <label>Имя пользователя:</label>
            <input v-model="editForm.username" type="text" required>
          </div>
          <div class="form-group">
            <label>Любимая команда:</label>
            <select v-model="editForm.favorite_team">
              <option value="">Выберите команду</option>
              <option value="Ferrari">Ferrari</option>
              <option value="Red Bull">Red Bull</option>
              <option value="Mercedes">Mercedes</option>
              <option value="McLaren">McLaren</option>
              <option value="Aston Martin">Aston Martin</option>
            </select>
          </div>
          <div class="form-group">
            <label>Любимый пилот:</label>
            <input v-model="editForm.favorite_driver" type="text">
          </div>
          <div class="modal-actions">
            <button type="button" @click="showEditModal = false" class="cancel-btn">Отмена</button>
            <button type="submit" :disabled="updatingProfile" class="save-btn">
              {{ updatingProfile ? 'Сохранение...' : 'Сохранить' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<!-- frontend/src/views/ProfileView.vue - КЛЮЧЕВЫЕ ИСПРАВЛЕНИЯ -->
<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useProfileStore } from '../stores/profile';
import { useAuthStore } from '../stores/auth';

const profileStore = useProfileStore();
const authStore = useAuthStore();

const loading = ref(true);
const activeTab = ref('topics');
const showEditModal = ref(false);
const changingPassword = ref(false);
const updatingProfile = ref(false);

const passwordData = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const passwordErrors = ref({});
const passwordMessage = ref('');
const passwordSuccess = ref(false);

const editForm = ref({
  username: '',
  favorite_team: '',
  favorite_driver: ''
});

const tabs = computed(() => [
  { id: 'topics', name: 'Мои посты', badge: profileStore.getUserStats.topics_count || 0 },
  { id: 'comments', name: 'Мои комментарии', badge: profileStore.getUserStats.comments_count || 0 },
  { id: 'warnings', name: 'Предупреждения', badge: profileStore.getUserStats.warnings_count || 0 },
  { id: 'settings', name: 'Настройки' }
]);

// Вспомогательные функции
const getInitials = (username) => {
  return username ? username.charAt(0).toUpperCase() : 'U';
};

const getRoleText = (role) => {
  const roles = {
    'user': 'Пользователь',
    'moderator': 'Модератор',
    'admin': 'Администратор'
  };
  return roles[role] || role;
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getStatusText = (status) => {
  const statuses = {
    'pending': 'На модерации',
    'approved': 'Одобрено',
    'rejected': 'Отклонено'
  };
  return statuses[status] || status;
};

// Методы
const loadProfileData = async () => {
  try {
    loading.value = true;
    console.log('🔄 Loading profile data...');
    await profileStore.fetchUserProfile();
    await profileStore.fetchNotifications();
    console.log('✅ Profile data loaded');
  } catch (error) {
    console.error('Error loading profile:', error);
  } finally {
    loading.value = false;
  }
};

// Загружаем данные для активной вкладки
const loadTabData = async () => {
  try {
    console.log('🔄 Loading data for tab:', activeTab.value);
    
    switch (activeTab.value) {
      case 'topics':
        await profileStore.fetchUserTopics();
        break;
      case 'comments':
        await profileStore.fetchUserComments();
        break;
      case 'warnings':
        await profileStore.fetchUserWarnings();
        break;
    }
    console.log('✅ Tab data loaded');
  } catch (error) {
    console.error('Error loading tab data:', error);
  }
};

// Следим за изменением активной вкладки
watch(activeTab, (newTab) => {
  console.log('📁 Tab changed to:', newTab);
  loadTabData();
});

const editProfile = () => {
  if (profileStore.userProfile) {
    editForm.value = { ...profileStore.userProfile.user };
    showEditModal.value = true;
  }
};

const updateProfile = async () => {
  try {
    updatingProfile.value = true;
    await profileStore.updateProfile(editForm.value);
    showEditModal.value = false;
  } catch (error) {
    console.error('Error updating profile:', error);
  } finally {
    updatingProfile.value = false;
  }
};

const changePassword = async () => {
  // Валидация
  passwordErrors.value = {};
  
  if (!passwordData.value.currentPassword) {
    passwordErrors.value.currentPassword = 'Введите текущий пароль';
  }
  
  if (!passwordData.value.newPassword) {
    passwordErrors.value.newPassword = 'Введите новый пароль';
  } else if (passwordData.value.newPassword.length < 6) {
    passwordErrors.value.newPassword = 'Пароль должен быть не менее 6 символов';
  }
  
  if (passwordData.value.newPassword !== passwordData.value.confirmPassword) {
    passwordErrors.value.confirmPassword = 'Пароли не совпадают';
  }
  
  if (Object.keys(passwordErrors.value).length > 0) {
    return;
  }

  try {
    changingPassword.value = true;
    const result = await profileStore.changePassword({
      currentPassword: passwordData.value.currentPassword,
      newPassword: passwordData.value.newPassword
    });
    
    passwordSuccess.value = true;
    passwordMessage.value = result.message;
    
    // Очищаем форму
    passwordData.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
  } catch (error) {
    passwordSuccess.value = false;
    passwordMessage.value = error.response?.data?.error || 'Ошибка при смене пароля';
  } finally {
    changingPassword.value = false;
  }
};

const verifyEmail = async () => {
  try {
    await profileStore.verifyEmail();
  } catch (error) {
    console.error('Error verifying email:', error);
  }
};

const markNotificationAsRead = async (notificationId) => {
  try {
    await profileStore.markNotificationAsRead(notificationId);
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};

const markAllNotificationsAsRead = async () => {
  try {
    await profileStore.markAllNotificationsAsRead();
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
};

// Загрузка данных при монтировании
onMounted(async () => {
  console.log('🏠 Profile mounted, loading data...');
  await loadProfileData();
  await loadTabData(); // Загружаем данные для активной вкладки
});
</script>
<!-- Продолжение frontend/src/views/ProfileView.vue - стили -->
<style scoped>
.profile-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.profile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30px;
}

.profile-header h1 {
  color: #333;
  margin: 0;
}

.notification-badge {
  background: #e10600;
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.loading {
  text-align: center;
  padding: 40px;
  font-size: 18px;
  color: #666;
}

.profile-card {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  margin-bottom: 30px;
}

.profile-header-info {
  display: flex;
  align-items: flex-start;
  gap: 30px;
  margin-bottom: 30px;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e10600, #b30500);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 32px;
  font-weight: bold;
}

.edit-btn {
  background: #006f62;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.edit-btn:hover {
  background: #00574e;
}

.user-info h2 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 28px;
}

.email {
  color: #666;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.verification-badge {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
}

.verification-badge.unverified {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.verification-badge.verified {
  background: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

.verify-link {
  background: none;
  border: none;
  color: #007bff;
  cursor: pointer;
  text-decoration: underline;
  font-size: 12px;
}

.role, .member-since {
  color: #666;
  margin: 4px 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
  border-top: 1px solid #eee;
  padding-top: 20px;
}

.stat-item {
  text-align: center;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #e10600;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.profile-tabs {
  display: flex;
  background: white;
  border-radius: 12px 12px 0 0;
  overflow-x: auto;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.tab-btn {
  flex: 1;
  padding: 15px 20px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  color: #666;
  border-bottom: 3px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  white-space: nowrap;
}

.tab-btn.active {
  color: #e10600;
  border-bottom-color: #e10600;
  background: #fff5f5;
}

.tab-badge {
  background: #e10600;
  color: white;
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 12px;
  min-width: 20px;
  text-align: center;
}

.tab-content {
  background: white;
  border-radius: 0 0 12px 12px;
  padding: 30px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  margin-bottom: 30px;
}

.tab-panel h3 {
  margin: 0 0 20px 0;
  color: #333;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 10px;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
}

.create-link {
  color: #e10600;
  text-decoration: none;
  font-weight: bold;
}

.create-link:hover {
  text-decoration: underline;
}

/* Стили для списка постов */
.topics-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.topic-item {
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
  transition: box-shadow 0.3s;
}

.topic-item:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.topic-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.topic-header h4 {
  margin: 0;
  color: #333;
  flex: 1;
}

.topic-date {
  color: #666;
  font-size: 14px;
  white-space: nowrap;
}

.topic-meta {
  display: flex;
  gap: 15px;
  margin-bottom: 10px;
}

.meta-item {
  color: #666;
  font-size: 14px;
}

.topic-status {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.topic-status.pending {
  background: #fff3cd;
  color: #856404;
}

.topic-status.approved {
  background: #d1ecf1;
  color: #0c5460;
}

.topic-status.rejected {
  background: #f8d7da;
  color: #721c24;
}

/* Стили для списка комментариев */
.comments-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.comment-item {
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 8px;
  background: #fafafa;
}

.comment-content p {
  margin: 0 0 10px 0;
  line-height: 1.5;
}

.comment-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #666;
}

.topic-link {
  color: #e10600;
  text-decoration: none;
}

.topic-link:hover {
  text-decoration: underline;
}

/* Стили для предупреждений */
.warnings-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.warning-item {
  padding: 20px;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  background: #fffbf0;
}

.warning-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.warning-header h4 {
  margin: 0;
  color: #856404;
}

.warning-date {
  color: #666;
  font-size: 14px;
}

.warning-content p {
  margin: 5px 0;
  color: #666;
}

.expires {
  color: #e10600 !important;
  font-weight: bold;
}

/* Стили для настроек */
.settings-section {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.settings-section h4 {
  margin: 0 0 15px 0;
  color: #333;
}

.password-form {
  max-width: 400px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #333;
}

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group input.error {
  border-color: #e10600;
}

.error-text {
  color: #e10600;
  font-size: 12px;
  margin-top: 5px;
}

.save-btn {
  background: #e10600;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.save-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.cancel-btn {
  background: #6c757d;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.mark-read-btn {
  background: #006f62;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  margin-bottom: 15px;
}

.message {
  padding: 10px;
  border-radius: 4px;
  margin-top: 10px;
}

.message.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

/* Стили для уведомлений */
.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.notification-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 8px;
  background: white;
}

.notification-item.unread {
  background: #f0f8ff;
  border-color: #007bff;
}

.notification-content h5 {
  margin: 0 0 5px 0;
  color: #333;
}

.notification-content p {
  margin: 0 0 5px 0;
  color: #666;
  line-height: 1.4;
}

.notification-date {
  color: #999;
  font-size: 12px;
}

.read-btn {
  background: #28a745;
  color: white;
  border: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
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
  padding: 30px;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal h3 {
  margin: 0 0 20px 0;
  color: #333;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}

/* Адаптивность */
@media (max-width: 768px) {
  .profile-view {
    padding: 10px;
  }

  .profile-header-info {
    flex-direction: column;
    text-align: center;
    gap: 20px;
  }

  .profile-tabs {
    flex-direction: column;
  }

  .tab-btn {
    justify-content: flex-start;
    border-bottom: none;
    border-left: 3px solid transparent;
  }

  .tab-btn.active {
    border-left-color: #e10600;
    border-bottom: none;
  }

  .topic-header {
    flex-direction: column;
    gap: 10px;
  }

  .comment-meta {
    flex-direction: column;
    gap: 5px;
    align-items: flex-start;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .modal {
    margin: 20px;
    width: calc(100% - 40px);
  }
}
</style>