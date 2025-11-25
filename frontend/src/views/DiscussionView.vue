<template>
  <div class="discussion-view" v-if="discussionStore.currentDiscussion">
    <!-- Заголовок -->
    <div class="discussion-header">
      <h1>{{ discussionStore.currentDiscussion.title }}</h1>
      <div class="discussion-meta">
        <span class="author">👤 {{ discussionStore.currentDiscussion.author?.username }}</span>
        <span class="date">{{ formatDate(discussionStore.currentDiscussion.created_at) }}</span>
        <div class="discussion-stats">
          <span class="views">👁️ {{ discussionStore.currentDiscussion.views }}</span>
          <span class="likes">👍 {{ discussionStore.currentDiscussion.likes }}</span>
          <button @click="likeDiscussion(discussionStore.currentDiscussion.id)" class="like-btn">
            ❤️
          </button>
        </div>
      </div>
    </div>

    <!-- Контент -->
    <div class="discussion-content">
      <p>{{ discussionStore.currentDiscussion.content }}</p>
      <div class="tags" v-if="discussionStore.currentDiscussion.tags && discussionStore.currentDiscussion.tags.length">
        <span v-for="tag in discussionStore.currentDiscussion.tags" :key="tag" class="tag">#{{ tag }}</span>
      </div>
    </div>

    <!-- Действия для обсуждения -->
    <div class="discussion-actions" v-if="canModifyContent(discussionStore.currentDiscussion)">
      <button @click="startEditDiscussion" class="edit-btn">
        ✏️ Редактировать обсуждение
      </button>
      <button @click="deleteDiscussion" class="delete-btn">
        🗑️ Удалить обсуждение
      </button>
    </div>

    <!-- Комментарии -->
    <div class="comments-section">
      <h3>💬 Комментарии ({{ getTotalCommentsCount() }})</h3>
      
      <!-- Форма комментария -->
      <div v-if="authStore.isAuthenticated" class="comment-form">
        <textarea v-model="newComment" placeholder="Напишите ваш комментарий..." rows="4"></textarea>
        <button @click="addComment" class="submit-btn" :disabled="!newComment.trim()">
          💬 Добавить комментарий
        </button>
      </div>

      <!-- Список комментариев -->
      <div v-if="discussionStore.currentDiscussion.comments && discussionStore.currentDiscussion.comments.length" class="comments-list">
        <div v-for="comment in discussionStore.currentDiscussion.comments" :key="comment.id" class="comment">
          
          <div class="comment-main">
            <div class="comment-header">
              <span class="comment-author">{{ comment.author?.username }}</span>
              <span class="comment-date">{{ formatDate(comment.created_at) }}</span>
            </div>
            <div class="comment-content">{{ comment.content }}</div>
            
            <!-- Действия с комментарием -->
            <div class="comment-actions">
              <button @click="likeComment(comment.id)" class="like-btn">👍 {{ comment.likes || 0 }}</button>
              <button @click="toggleReply(comment.id)" class="reply-btn">💬 Ответить</button>
              <button @click="reportContent('comment', comment.id)" class="report-btn">🚩 Пожаловаться</button>
              
              <button v-if="canModifyContent(comment)" @click="startEditComment(comment)" class="edit-btn">
                ✏️ Редактировать
              </button>
              <button v-if="canModifyContent(comment)" @click="deleteComment(comment.id)" class="delete-btn">
                🗑️ Удалить
              </button>
            </div>

            <!-- Форма ответа -->
            <div v-if="replyingTo === comment.id" class="reply-form">
              <textarea v-model="replyContent" placeholder="Введите ваш ответ..." rows="3"></textarea>
              <div class="reply-actions">
                <button @click="submitReply(comment.id)" class="submit-btn">Отправить</button>
                <button @click="cancelReply" class="cancel-btn">Отмена</button>
              </div>
            </div>
          </div>

          <!-- Ответы -->
          <div v-if="comment.replies && comment.replies.length > 0" class="replies">
            <div v-for="reply in comment.replies" :key="reply.id" class="comment reply">
              <div class="comment-main">
                <div class="comment-header">
                  <span class="comment-author">{{ reply.author?.username }}</span>
                  <span class="comment-date">{{ formatDate(reply.created_at) }}</span>
                </div>
                <div class="comment-content">{{ reply.content }}</div>
                <div class="comment-actions">
                  <button @click="likeComment(reply.id)" class="like-btn">👍 {{ reply.likes || 0 }}</button>
                  <button @click="reportContent('comment', reply.id)" class="report-btn">🚩 Пожаловаться</button>
                  
                  <button v-if="canModifyContent(reply)" @click="startEditComment(reply)" class="edit-btn">
                    ✏️ Редактировать
                  </button>
                  <button v-if="canModifyContent(reply)" @click="deleteComment(reply.id)" class="delete-btn">
                    🗑️ Удалить
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Кнопка жалобы на обсуждение -->
    <div class="report-section" v-if="authStore.isAuthenticated && !isDiscussionAuthor(discussionStore.currentDiscussion)">
      <button @click="reportContent('topic', discussionStore.currentDiscussion.id)" class="report-btn-large">
        🚩 Пожаловаться на обсуждение
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDiscussionsStore } from '../stores/discussionsStore';
import { useAuthStore } from '../stores/auth';
import api from '../services/api';

const route = useRoute();
const router = useRouter();
const discussionStore = useDiscussionsStore();
const authStore = useAuthStore();

const newComment = ref('');
const replyingTo = ref(null);
const replyContent = ref('');

// Функция для получения текущего пользователя
const getCurrentUser = () => {
  try {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  } catch {
    return null;
  }
};

onMounted(async () => {
  await discussionStore.fetchDiscussion(route.params.id);
});

onUnmounted(() => {
  discussionStore.clearCurrentDiscussion();
});

const formatDate = (dateString) => {
  try {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'неизвестно';
  }
};

const isDiscussionAuthor = (discussion) => {
  return discussionStore.isCurrentUserAuthor(discussion);
};

const isCommentAuthor = (comment) => {
  return discussionStore.isCurrentUserAuthor(comment);
};

const getTotalCommentsCount = () => {
  if (!discussionStore.currentDiscussion?.comments) return 0;
  let count = 0;
  discussionStore.currentDiscussion.comments.forEach(comment => {
    count++;
    if (comment.replies) count += comment.replies.length;
  });
  return count;
};

const likeDiscussion = async (id) => {
  try {
    await discussionStore.likeDiscussion(id);
  } catch (error) {
    console.error('Ошибка при лайке:', error);
  }
};

const addComment = async () => {
  if (!newComment.value.trim()) return;
  try {
    await discussionStore.addComment(route.params.id, { content: newComment.value.trim() });
    newComment.value = '';
  } catch (error) {
    console.error('Ошибка при добавлении комментария:', error);
  }
};

const toggleReply = (id) => {
  replyingTo.value = replyingTo.value === id ? null : id;
  replyContent.value = '';
};

const cancelReply = () => {
  replyingTo.value = null;
  replyContent.value = '';
};

const submitReply = async (id) => {
  if (!replyContent.value.trim()) return;
  try {
    await discussionStore.addReply(id, { content: replyContent.value.trim() });
    cancelReply();
  } catch (error) {
    console.error('Ошибка при отправке ответа:', error);
  }
};

const likeComment = async (id) => {
  try {
    await discussionStore.likeComment(id);
  } catch (error) {
    console.error('Ошибка при лайке комментария:', error);
  }
};

// Функции редактирования и удаления комментариев
const startEditComment = (comment) => {
  const newContent = prompt('Редактировать комментарий:', comment.content);
  if (newContent && newContent.trim() && newContent !== comment.content) {
    discussionStore.updateComment(comment.id, { content: newContent.trim() });
  }
};

const deleteComment = async (id) => {
  if (confirm('Вы уверены, что хотите удалить этот комментарий?')) {
    try {
      await discussionStore.deleteComment(id);
    } catch (error) {
      console.error('Ошибка при удалении комментария:', error);
      alert('Ошибка при удалении комментария');
    }
  }
};

const startEditDiscussion = () => {
  const newTitle = prompt('Редактировать заголовок:', discussionStore.currentDiscussion.title);
  const newContent = prompt('Редактировать содержание:', discussionStore.currentDiscussion.content);
  
  if (newTitle && newContent && (newTitle !== discussionStore.currentDiscussion.title || newContent !== discussionStore.currentDiscussion.content)) {
    discussionStore.updateDiscussion(route.params.id, {
      title: newTitle.trim(),
      content: newContent.trim(),
      tags: discussionStore.currentDiscussion.tags
    });
  }
};

const deleteDiscussion = async () => {
  if (confirm('Вы уверены, что хотите удалить это обсуждение?')) {
    try {
      await discussionStore.deleteDiscussion(route.params.id);
      router.push('/discussions');
    } catch (error) {
      console.error('Ошибка при удалении обсуждения:', error);
      alert('Ошибка при удалении обсуждения');
    }
  }
};

const canModifyContent = (item) => {
  const currentUser = getCurrentUser();
  if (!currentUser) return false;
  
  // 1. Автор всегда может редактировать свой контент
  if (discussionStore.isCurrentUserAuthor(item)) return true;
  
  // 2. Админы и модераторы могут редактировать любой контент
  if (currentUser.role === 'admin' || currentUser.role === 'moderator') return true;
  
  return false;
};

// Функция жалобы
const reportContent = async (contentType, contentId) => {
  const reasons = [
    '🚫 Спам',
    '💢 Оскорбления', 
    '🔞 Нецензурная лексика',
    '📵 Неподобающий контент',
    '⚖️ Нарушение правил',
    '❓ Другое'
  ];
  
  let reason = prompt(
    `Пожаловаться на ${contentType === 'topic' ? 'обсуждение' : 'комментарий'}:\n\n` +
    reasons.join('\n') +
    '\n\nВведите причину жалобы:'
  );
  
  if (reason && reason.trim()) {
    try {
      const response = await api.post('/reports', {
        content_type: contentType,
        content_id: contentId,
        reason: reason.trim()
      });
      
      if (response.data.success) {
        alert('✅ Жалоба отправлена модераторам. Спасибо за вашу бдительность!');
      } else {
        alert('❌ Ошибка при отправке жалобы: ' + response.data.error);
      }
    } catch (error) {
      console.error('❌ Report error:', error);
      
      if (error.response?.status === 400 && error.response?.data?.error?.includes('already reported')) {
        alert('⚠️ Вы уже жаловались на этот контент ранее.');
      } else {
        alert('❌ Ошибка при отправке жалобы. Попробуйте позже.');
      }
    }
  }
};
</script>

<style scoped>
.discussion-view { 
  max-width: 800px; 
  margin: 0 auto; 
  padding: 20px; 
}

.discussion-header { 
  margin-bottom: 2rem; 
  padding-bottom: 1rem; 
  border-bottom: 2px solid #e10600; 
}

.discussion-header h1 { 
  margin: 0 0 1rem 0; 
  color: #333; 
}

.discussion-meta { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  flex-wrap: wrap; 
  gap: 1rem; 
  color: #666; 
}

.discussion-stats { 
  display: flex; 
  align-items: center; 
  gap: 1rem; 
}

.like-btn { 
  background: transparent; 
  border: 1px solid #e10600; 
  color: #e10600; 
  padding: 0.5rem 1rem; 
  border-radius: 6px; 
  cursor: pointer; 
}

.discussion-content { 
  background: white; 
  padding: 2rem; 
  border-radius: 10px; 
  box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
  margin-bottom: 2rem; 
}

.tags { 
  display: flex; 
  gap: 0.5rem; 
  margin-top: 1rem; 
  flex-wrap: wrap; 
}

.tag { 
  background: #f0f0f0; 
  color: #666; 
  padding: 0.25rem 0.5rem; 
  border-radius: 4px; 
  font-size: 0.8rem; 
}

/* Стили для кнопок действий */
.discussion-actions {
  background: #e7f3ff;
  padding: 1rem;
  margin: 1rem 0;
  border-radius: 8px;
  border-left: 4px solid #007bff;
  display: flex;
  gap: 1rem;
}

.edit-btn, .delete-btn { 
  padding: 0.5rem 1rem; 
  border: none; 
  border-radius: 6px; 
  cursor: pointer; 
  font-weight: 500;
}

.edit-btn { 
  background: #007bff; 
  color: white; 
}

.delete-btn { 
  background: #dc3545; 
  color: white; 
}

.edit-btn:hover {
  background: #0056b3;
}

.delete-btn:hover {
  background: #c82333;
}

.comments-section { 
  background: white; 
  padding: 2rem; 
  border-radius: 10px; 
  box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
}

.comment-form { 
  margin-bottom: 2rem; 
}

.comment-form textarea { 
  width: 100%; 
  padding: 1rem; 
  border: 1px solid #ddd; 
  border-radius: 6px; 
  resize: vertical; 
}

.submit-btn { 
  background: #e10600; 
  color: white; 
  border: none; 
  padding: 0.75rem 1.5rem; 
  border-radius: 6px; 
  cursor: pointer; 
  margin-top: 1rem; 
}

.comment { 
  margin-bottom: 1rem; 
  padding: 1rem; 
  border: 1px solid #e0e0e0; 
  border-radius: 8px; 
}

.comment.reply { 
  margin-left: 2rem; 
  border-left: 3px solid #e10600; 
  background: #f9f9f9; 
}

.comment-header { 
  display: flex; 
  justify-content: space-between; 
  margin-bottom: 0.5rem; 
}

.comment-author { 
  font-weight: bold; 
  color: #e10600; 
}

.comment-date { 
  color: #666; 
  font-size: 0.8rem; 
}

.comment-content { 
  margin-bottom: 0.5rem; 
}

.comment-actions { 
  display: flex; 
  gap: 0.5rem; 
  flex-wrap: wrap; 
}

.comment-actions button { 
  background: none; 
  border: 1px solid #ddd; 
  padding: 0.25rem 0.5rem; 
  border-radius: 4px; 
  cursor: pointer; 
  font-size: 0.8rem; 
}

.reply-btn {
  background: #3f4bb6 !important;
  color: white !important;
  border: 1px solid #4a28a7 !important;
}

.report-btn {
  background: #ffc107 !important;
  color: #212529 !important;
  border: 1px solid #ffc107 !important;
}

.replies { 
  margin-top: 1rem; 
  border-left: 2px solid #ddd; 
  padding-left: 1rem; 
}

.reply-form { 
  margin-top: 1rem; 
  padding: 1rem; 
  background: #f8f9fa; 
  border-radius: 4px; 
}

.reply-form textarea { 
  width: 100%; 
  padding: 0.5rem; 
  border: 1px solid #ddd; 
  border-radius: 4px; 
  resize: vertical; 
}

.reply-actions { 
  margin-top: 0.5rem; 
  display: flex; 
  gap: 0.5rem; 
}

.cancel-btn { 
  background: #6c757d; 
  color: white; 
  border: none; 
  padding: 0.5rem 1rem; 
  border-radius: 4px; 
  cursor: pointer; 
}

.report-section {
  text-align: center;
  margin: 2rem 0;
  padding: 1rem;
}

.report-btn-large {
  background: #ffc107;
  color: #212529;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
}

.report-btn-large:hover {
  background: #e0a800;
}
</style>