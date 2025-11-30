frontend/src/components/NotificationBell.vue
<template>
  <div class="notification-bell" @click="toggleDropdown">
    <div class="bell-icon">
      🔔
      <span v-if="unreadCount > 0" class="notification-count">{{ unreadCount }}</span>
    </div>
    
    <div v-if="showDropdown" class="notification-dropdown">
      <div class="dropdown-header">
        <h4>Уведомления</h4>
        <button v-if="unreadCount > 0" @click="markAllAsRead" class="mark-all-read">
          Отметить все как прочитанные
        </button>
      </div>
      
      <div class="notifications-list">
        <div v-if="notifications.length === 0" class="empty-notifications">
          Нет уведомлений
        </div>
        
        <div v-else>
          <div v-for="notification in notifications.slice(0, 5)" :key="notification.id" 
               :class="['notification-item', { unread: !notification.is_read }]"
               @click="handleNotificationClick(notification)">
            <div class="notification-content">
              <h5>{{ notification.title }}</h5>
              <p>{{ notification.message }}</p>
              <span class="notification-time">{{ formatTime(notification.created_at) }}</span>
            </div>
            <button v-if="!notification.is_read" 
                    @click.stop="markAsRead(notification.id)"
                    class="read-btn">
              ✓
            </button>
          </div>
        </div>
      </div>
      
      <div class="dropdown-footer">
        <router-link to="/profile?tab=settings" class="view-all-link">
          Все уведомления
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useProfileStore } from '../stores/profile';
import { useRouter } from 'vue-router';

const profileStore = useProfileStore();
const router = useRouter();

const showDropdown = ref(false);
const unreadCount = ref(0);
const notifications = ref([]);

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value;
  if (showDropdown.value) {
    loadNotifications();
  }
};

const loadNotifications = async () => {
  try {
    await profileStore.fetchNotifications(5, 0);
    unreadCount.value = profileStore.unreadNotificationsCount;
    notifications.value = profileStore.notifications;
  } catch (error) {
    console.error('Error loading notifications:', error);
  }
};

const markAsRead = async (notificationId) => {
  try {
    await profileStore.markNotificationAsRead(notificationId);
    unreadCount.value = profileStore.unreadNotificationsCount;
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};

const markAllAsRead = async () => {
  try {
    await profileStore.markAllNotificationsAsRead();
    unreadCount.value = 0;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
};

const handleNotificationClick = (notification) => {
  markAsRead(notification.id);
  
  // Закрываем dropdown
  showDropdown.value = false;
  
  // Навигация если есть связанная сущность
  if (notification.related_entity_type === 'topic' && notification.related_entity_id) {
    router.push(`/discussion/${notification.related_entity_id}`);
  } else if (notification.related_entity_type === 'warning') {
    router.push('/profile?tab=warnings');
  }
};

const formatTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'только что';
  if (diffMins < 60) return `${diffMins} мин назад`;
  if (diffHours < 24) return `${diffHours} ч назад`;
  if (diffDays < 7) return `${diffDays} дн назад`;
  
  return date.toLocaleDateString('ru-RU');
};

// Закрытие dropdown при клике вне компонента
const handleClickOutside = (event) => {
  if (!event.target.closest('.notification-bell')) {
    showDropdown.value = false;
  }
};

// Периодическая проверка новых уведомлений
let notificationInterval;

onMounted(() => {
  loadNotifications();
  document.addEventListener('click', handleClickOutside);
  
  // Проверяем новые уведомления каждые 30 секунд
  notificationInterval = setInterval(loadNotifications, 30000);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  clearInterval(notificationInterval);
});
</script>

<style scoped>
.notification-bell {
  position: relative;
  cursor: pointer;
}

.bell-icon {
  position: relative;
  font-size: 20px;
  padding: 8px;
}

.notification-count {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #e10600;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.notification-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  width: 350px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 1000;
}

.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #eee;
}

.dropdown-header h4 {
  margin: 0;
  color: #333;
}

.mark-all-read {
  background: none;
  border: none;
  color: #007bff;
  cursor: pointer;
  font-size: 12px;
  text-decoration: underline;
}

.notifications-list {
  max-height: 300px;
  overflow-y: auto;
}

.empty-notifications {
  padding: 20px;
  text-align: center;
  color: #666;
}

.notification-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px 15px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item:hover {
  background: #f8f9fa;
}

.notification-item.unread {
  background: #f0f8ff;
}

.notification-content {
  flex: 1;
}

.notification-content h5 {
  margin: 0 0 5px 0;
  font-size: 14px;
  color: #333;
}

.notification-content p {
  margin: 0 0 5px 0;
  font-size: 12px;
  color: #666;
  line-height: 1.3;
}

.notification-time {
  font-size: 11px;
  color: #999;
}

.read-btn {
  background: #28a745;
  color: white;
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  margin-left: 10px;
}

.dropdown-footer {
  padding: 10px 15px;
  border-top: 1px solid #eee;
  text-align: center;
}

.view-all-link {
  color: #007bff;
  text-decoration: none;
  font-size: 14px;
}

.view-all-link:hover {
  text-decoration: underline;
}
</style>