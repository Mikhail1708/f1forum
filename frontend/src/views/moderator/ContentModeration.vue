<!-- frontend/src/views/moderator/ContentModeration.vue -->
<template>
  <div class="content-moderation">
    <div class="page-header">
      <h1>Управление контентом</h1>
      <div class="header-tabs">
        <button 
          @click="activeTab = 'topics'" 
          :class="['tab-btn', { active: activeTab === 'topics' }]"
        >
          Темы ({{ pendingTopics.length }})
        </button>
        <button 
          @click="activeTab = 'comments'" 
          :class="['tab-btn', { active: activeTab === 'comments' }]"
        >
          Комментарии ({{ pendingComments.length }})
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading">Загрузка контента...</div>

    <!-- Модерация тем -->
    <div v-else-if="activeTab === 'topics'" class="content-list">
      <div v-if="pendingTopics.length === 0" class="no-content">
        <p>Нет тем для модерации 🎉</p>
      </div>

      <div v-else class="topics-list">
        <div v-for="topic in pendingTopics" :key="topic.id" class="topic-card">
          <div class="topic-content">
            <h3>{{ topic.title }}</h3>
            <p class="topic-text">{{ topic.content }}</p>
            <div class="topic-meta">
              <span>👤 {{ topic.author_name }}</span>
              <span>📅 {{ formatDate(topic.created_at) }}</span>
              <span v-if="topic.tags" class="tags">
                🏷️ {{ formatTags(topic.tags) }}
              </span>
            </div>
          </div>
          <div class="moderation-actions">
            <button @click="approveTopic(topic.id)" class="btn btn-success">
              ✅ Одобрить
            </button>
            <button @click="rejectTopic(topic.id)" class="btn btn-danger">
              ❌ Отклонить
            </button>
            <button @click="viewTopic(topic.id)" class="btn btn-secondary">
              👁️ Просмотр
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Модерация комментариев -->
    <div v-else-if="activeTab === 'comments'" class="content-list">
      <div v-if="pendingComments.length === 0" class="no-content">
        <p>Нет комментариев для модерации 🎉</p>
      </div>

      <div v-else class="comments-list">
        <div v-for="comment in pendingComments" :key="comment.id" class="comment-card">
          <div class="comment-content">
            <p class="comment-text">{{ comment.content }}</p>
            <div class="comment-meta">
              <span>👤 {{ comment.author_name }}</span>
              <span>📅 {{ formatDate(comment.created_at) }}</span>
              <span>💬 Тема: {{ comment.topic_title }}</span>
            </div>
          </div>
          <div class="moderation-actions">
            <button @click="approveComment(comment.id)" class="btn btn-success">
              ✅ Одобрить
            </button>
            <button @click="deleteComment(comment.id)" class="btn btn-danger">
              🗑️ Удалить
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../../services/api';

const router = useRouter();
const activeTab = ref('topics');
const pendingTopics = ref([]);
const pendingComments = ref([]);
const loading = ref(false);

onMounted(async () => {
  await loadPendingContent();
});

const loadPendingContent = async () => {
  try {
    loading.value = true;
    
    // Загрузка тем на модерации
    const topicsResponse = await api.get('/moderator/topics/pending');
    if (topicsResponse.data.success) {
      pendingTopics.value = topicsResponse.data.topics;
      console.log('📝 Loaded topics:', pendingTopics.value);
    }

    // Загрузка комментариев на модерации
    const commentsResponse = await api.get('/moderator/comments/pending');
    if (commentsResponse.data.success) {
      pendingComments.value = commentsResponse.data.comments;
    }

  } catch (error) {
    console.error('Ошибка загрузки контента:', error);
    
    // Заглушки для демонстрации
    pendingTopics.value = [
      {
        id: 1,
        title: 'Тестовая тема на модерации',
        content: 'Это тестовая тема, которая ожидает проверки модератором...',
        author_name: 'testuser',
        created_at: new Date().toISOString(),
        tags: 'тест,модерация' // Теперь это строка, а не массив
      }
    ];
    
    pendingComments.value = [
      {
        id: 1,
        content: 'Это тестовый комментарий на модерации...',
        author_name: 'testuser',
        created_at: new Date().toISOString(),
        topic_title: 'Обсуждение гонки'
      }
    ];
  } finally {
    loading.value = false;
  }
};

// Функция для форматирования тегов
const formatTags = (tags) => {
  if (!tags) return '';
  
  // Если tags - это массив
  if (Array.isArray(tags)) {
    return tags.join(', ');
  }
  
  // Если tags - это строка
  if (typeof tags === 'string') {
    return tags;
  }
  
  // Если tags - это что-то другое
  return String(tags);
};

const approveTopic = async (topicId) => {
  try {
    const response = await api.post(`/moderator/topics/${topicId}/approve`);
    if (response.data.success) {
      pendingTopics.value = pendingTopics.value.filter(t => t.id !== topicId);
    }
  } catch (error) {
    console.error('Ошибка одобрения темы:', error);
    alert('Ошибка при одобрении темы');
  }
};

const rejectTopic = async (topicId) => {
  if (!confirm('Отклонить эту тему?')) return;
  
  try {
    const response = await api.post(`/moderator/topics/${topicId}/reject`);
    if (response.data.success) {
      pendingTopics.value = pendingTopics.value.filter(t => t.id !== topicId);
    }
  } catch (error) {
    console.error('Ошибка отклонения темы:', error);
    alert('Ошибка при отклонении темы');
  }
};

const approveComment = async (commentId) => {
  try {
    const response = await api.post(`/moderator/comments/${commentId}/approve`);
    if (response.data.success) {
      pendingComments.value = pendingComments.value.filter(c => c.id !== commentId);
    }
  } catch (error) {
    console.error('Ошибка одобрения комментария:', error);
    alert('Ошибка при одобрении комментария');
  }
};

const deleteComment = async (commentId) => {
  if (!confirm('Удалить этот комментарий?')) return;
  
  try {
    const response = await api.delete(`/moderator/comments/${commentId}`);
    if (response.data.success) {
      pendingComments.value = pendingComments.value.filter(c => c.id !== commentId);
    }
  } catch (error) {
    console.error('Ошибка удаления комментария:', error);
    alert('Ошибка при удалении комментария');
  }
};

const viewTopic = (topicId) => {
  router.push(`/discussion/${topicId}`);
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('ru-RU');
};
</script>

<style scoped>
.content-moderation {
  padding: 20px;
}

.page-header {
  margin-bottom: 2rem;
}

.header-tabs {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.tab-btn {
  padding: 0.75rem 1.5rem;
  border: 1px solid #ddd;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-btn.active {
  background: #3498db;
  color: white;
  border-color: #3498db;
}

.content-list {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  padding: 1.5rem;
}

.topic-card, .comment-card {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 1rem;
  background: #fafafa;
}

.topic-content, .comment-content {
  flex: 1;
  margin-right: 1rem;
}

.topic-content h3 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.topic-text, .comment-text {
  margin: 0 0 1rem 0;
  color: #555;
  line-height: 1.5;
}

.topic-meta, .comment-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  color: #7f8c8d;
}

.tags {
  background: #e3f2fd;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.moderation-actions {
  display: flex;
  gap: 0.5rem;
  flex-direction: column;
  min-width: 150px;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s;
  text-align: center;
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

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background: #7f8c8d;
}

.no-content {
  text-align: center;
  padding: 3rem;
  color: #7f8c8d;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #7f8c8d;
}
</style>