<template>
  <div class="discussion-view" v-if="discussionStore.currentDiscussion">
    <!-- Кнопка назад -->
    <button @click="$router.push('/discussions')" class="back-btn">← Назад к обсуждениям</button>
    
    <!-- Режим редактирования обсуждения -->
    <div v-if="editingDiscussion" class="edit-discussion-modal">
      <div class="edit-modal-content">
        <h2>✏️ Редактировать обсуждение</h2>
        
        <form @submit.prevent="saveDiscussion" class="edit-form">
          <div class="form-group">
            <label>Заголовок:</label>
            <input 
              v-model="editDiscussionData.title" 
              type="text" 
              class="edit-title"
              placeholder="Введите заголовок"
              required
            >
          </div>

          <div class="form-group">
            <label>Содержание:</label>
            <textarea 
              v-model="editDiscussionData.content" 
              class="edit-content"
              placeholder="Введите содержание"
              rows="8"
              required
            ></textarea>
          </div>

          <div class="form-group">
            <label>Теги (через запятую):</label>
            <input 
              v-model="editDiscussionData.tagsInput" 
              type="text" 
              class="edit-tags"
              placeholder="гонка, стратегия, команда"
            >
          </div>

          <div class="form-actions">
            <button type="submit" :disabled="saving" class="save-btn">
              {{ saving ? '💾 Сохранение...' : '💾 Сохранить' }}
            </button>
            <button type="button" @click="cancelEditDiscussion" class="cancel-btn">
              ❌ Отмена
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Основной контент обсуждения -->
    <div class="discussion-main" v-if="!editingDiscussion">
      <!-- Заголовок -->
      <div class="discussion-header">
        <div class="discussion-header-top">
          <h1>{{ discussionStore.currentDiscussion.title }}</h1>
          <div v-if="isDiscussionAuthor" class="discussion-actions-menu">
            <button @click="startEditDiscussion" class="edit-btn" title="Редактировать">
              ✏️ Редактировать
            </button>
            <button @click="deleteDiscussion" class="delete-btn" title="Удалить">
              🗑️ Удалить
            </button>
          </div>
        </div>
        
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
        
        <div class="tags" v-if="discussionStore.currentDiscussion.tags && discussionStore.currentDiscussion.tags.length">
          <span v-for="tag in discussionStore.currentDiscussion.tags" :key="tag" class="tag">#{{ tag }}</span>
        </div>
      </div>

      <!-- Контент -->
      <div class="discussion-content">
        <p>{{ discussionStore.currentDiscussion.content }}</p>
      </div>
    </div>

    <!-- Комментарии -->
    <div class="comments-section" v-if="!editingDiscussion">
      <h3>💬 Комментарии ({{ getTotalCommentsCount() }})</h3>
      
      <!-- Форма добавления комментария -->
      <div v-if="authStore.isAuthenticated" class="comment-form">
        <textarea 
          v-model="newComment" 
          placeholder="Напишите ваш комментарий..." 
          rows="4"
        ></textarea>
        <button @click="addComment" class="submit-btn" :disabled="!newComment.trim()">
          💬 Добавить комментарий
        </button>
      </div>

      <!-- Список комментариев -->
      <div v-if="discussionStore.currentDiscussion.comments && discussionStore.currentDiscussion.comments.length" class="comments-list">
        
        <!-- Модальное окно редактирования комментария -->
        <div v-if="editingComment" class="edit-comment-modal">
          <div class="edit-modal-content">
            <h3>✏️ Редактировать комментарий</h3>
            <textarea 
              v-model="editCommentData.content" 
              class="edit-comment-text"
              placeholder="Введите текст комментария"
              rows="6"
              required
            ></textarea>
            <div class="edit-comment-actions">
              <button @click="saveComment(editingComment.id)" :disabled="savingComment" class="save-btn">
                {{ savingComment ? '💾 Сохранение...' : '💾 Сохранить' }}
              </button>
              <button @click="cancelEditComment" class="cancel-btn">❌ Отмена</button>
            </div>
          </div>
        </div>

        <!-- Комментарии -->
        <div 
          v-for="comment in discussionStore.currentDiscussion.comments" 
          :key="comment.id" 
          class="comment"
          :class="{ 'editing': editingComment?.id === comment.id }"
        >
          <div class="comment-main">
            <div class="comment-header">
              <span class="comment-author">{{ comment.author?.username }}</span>
              <span class="comment-date">{{ formatDate(comment.created_at) }}</span>
              <div v-if="isCommentAuthor(comment)" class="comment-actions">
                <button @click="startEditComment(comment)" class="edit-btn" title="Редактировать">
                  ✏️
                </button>
                <button @click="deleteComment(comment.id)" class="delete-btn" title="Удалить">
                  🗑️
                </button>
              </div>
            </div>
            
            <div class="comment-content">
              <p>{{ comment.content }}</p>
            </div>
            
            <div class="comment-footer">
              <button @click="likeComment(comment.id)" class="like-btn">
                👍 {{ comment.likes || 0 }}
              </button>
              <button @click="toggleReply(comment.id)" class="reply-btn">
                💬 Ответить
              </button>
              <button @click="reportContent('comment', comment.id)" class="report-btn">
                🚩 Пожаловаться
              </button>
            </div>

            <!-- Форма ответа -->
            <div v-if="replyingTo === comment.id" class="reply-form">
              <textarea 
                v-model="replyContent" 
                placeholder="Введите ваш ответ..." 
                rows="3"
              ></textarea>
              <div class="reply-actions">
                <button @click="submitReply(comment.id)" class="submit-btn">💬 Отправить</button>
                <button @click="cancelReply" class="cancel-btn">❌ Отмена</button>
              </div>
            </div>
          </div>

          <!-- Ответы -->
          <div v-if="comment.replies && comment.replies.length > 0" class="replies">
            <div 
              v-for="reply in comment.replies" 
              :key="reply.id" 
              class="comment reply"
              :class="{ 'editing': editingComment?.id === reply.id }"
            >
              <div class="comment-main">
                <div class="comment-header">
                  <span class="comment-author">{{ reply.author?.username }}</span>
                  <span class="comment-date">{{ formatDate(reply.created_at) }}</span>
                  <div v-if="isCommentAuthor(reply)" class="comment-actions">
                    <button @click="startEditComment(reply)" class="edit-btn" title="Редактировать">
                      ✏️
                    </button>
                    <button @click="deleteComment(reply.id)" class="delete-btn" title="Удалить">
                      🗑️
                    </button>
                  </div>
                </div>
                
                <div class="comment-content">
                  <p>{{ reply.content }}</p>
                </div>
                
                <div class="comment-footer">
                  <button @click="likeComment(reply.id)" class="like-btn">
                    👍 {{ reply.likes || 0 }}
                  </button>
                  <button @click="reportContent('comment', reply.id)" class="report-btn">
                    🚩 Пожаловаться
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Кнопка жалобы на обсуждение -->
    <div class="report-section" v-if="authStore.isAuthenticated && !isDiscussionAuthor && !editingDiscussion">
      <button @click="reportContent('topic', discussionStore.currentDiscussion.id)" class="report-btn-large">
        🚩 Пожаловаться на обсуждение
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
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

// Редактирование обсуждения
const editingDiscussion = ref(false);
const editDiscussionData = ref({
  title: '',
  content: '',
  tagsInput: ''
});
const saving = ref(false);

// Редактирование комментариев
const editingComment = ref(null);
const editCommentData = ref({
  content: ''
});
const savingComment = ref(false);

// Проверка авторства
const isDiscussionAuthor = computed(() => {
  const discussion = discussionStore.currentDiscussion;
  const user = authStore.user;
  return discussion?.author?.id === user?.id;
});

const isCommentAuthor = (comment) => {
  const user = authStore.user;
  return comment.author?.id === user?.id;
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

const getTotalCommentsCount = () => {
  if (!discussionStore.currentDiscussion?.comments) return 0;
  let count = 0;
  discussionStore.currentDiscussion.comments.forEach(comment => {
    count++;
    if (comment.replies) count += comment.replies.length;
  });
  return count;
};

// Редактирование обсуждения
const startEditDiscussion = () => {
  editingDiscussion.value = true;
  editDiscussionData.value = {
    title: discussionStore.currentDiscussion.title,
    content: discussionStore.currentDiscussion.content,
    tagsInput: discussionStore.currentDiscussion.tags?.join(', ') || ''
  };
};

const cancelEditDiscussion = () => {
  editingDiscussion.value = false;
  editDiscussionData.value = { title: '', content: '', tagsInput: '' };
};

const saveDiscussion = async () => {
  if (!editDiscussionData.value.title.trim() || !editDiscussionData.value.content.trim()) {
    alert('Заполните заголовок и содержание');
    return;
  }

  saving.value = true;
  try {
    const discussionData = {
      title: editDiscussionData.value.title.trim(),
      content: editDiscussionData.value.content.trim(),
      tags: editDiscussionData.value.tagsInput
        ? editDiscussionData.value.tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag)
        : []
    };

    await discussionStore.updateDiscussion(discussionStore.currentDiscussion.id, discussionData);
    editingDiscussion.value = false;
  } catch (error) {
    alert('Ошибка: ' + (error.response?.data?.error || error.message));
  } finally {
    saving.value = false;
  }
};

// Редактирование комментариев
const startEditComment = (comment) => {
  editingComment.value = comment;
  editCommentData.value = {
    content: comment.content
  };
};

const cancelEditComment = () => {
  editingComment.value = null;
  editCommentData.value = { content: '' };
};

const saveComment = async (commentId) => {
  if (!editCommentData.value.content.trim()) {
    alert('Введите текст комментария');
    return;
  }

  savingComment.value = true;
  try {
    await discussionStore.updateComment(commentId, {
      content: editCommentData.value.content.trim()
    });
    editingComment.value = null;
    editCommentData.value = { content: '' };
  } catch (error) {
    alert('Ошибка: ' + (error.response?.data?.error || error.message));
  } finally {
    savingComment.value = false;
  }
};

// Удаление
const deleteDiscussion = async () => {
  if (confirm('Вы уверены, что хотите удалить это обсуждение?')) {
    try {
      await discussionStore.deleteDiscussion(discussionStore.currentDiscussion.id);
      router.push('/discussions');
    } catch (error) {
      alert('Ошибка при удалении: ' + (error.response?.data?.error || error.message));
    }
  }
};

const deleteComment = async (commentId) => {
  if (confirm('Вы уверены, что хотите удалить этот комментарий?')) {
    try {
      await discussionStore.deleteComment(commentId);
    } catch (error) {
      alert('Ошибка при удалении: ' + (error.response?.data?.error || error.message));
    }
  }
};

// Остальные функции (лайки, ответы, жалобы) остаются без изменений
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
      }
    } catch (error) {
      console.error('❌ Report error:', error);
      alert('❌ Ошибка при отправке жалобы. Попробуйте позже.');
    }
  }
};
</script>

<style scoped>
.discussion-view { 
  max-width: 800px; 
  margin: 0 auto; 
  padding: 20px; 
  position: relative;
}

.back-btn {
  background: #666;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 2rem;
}

/* Модальные окна редактирования */
.edit-discussion-modal,
.edit-comment-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.edit-modal-content {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.edit-modal-content h2,
.edit-modal-content h3 {
  margin-top: 0;
  color: #333;
  border-bottom: 2px solid #e10600;
  padding-bottom: 0.5rem;
}

/* Формы редактирования */
.edit-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #333;
}

.edit-title,
.edit-tags {
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.edit-title:focus,
.edit-tags:focus,
.edit-content:focus,
.edit-comment-text:focus {
  border-color: #e10600;
  outline: none;
}

.edit-content,
.edit-comment-text {
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 16px;
  resize: vertical;
  min-height: 120px;
  font-family: inherit;
  transition: border-color 0.3s;
}

.form-actions,
.edit-comment-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.save-btn {
  background: #4caf50;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.save-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.cancel-btn {
  background: #666;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
}

/* Основной контент */
.discussion-main {
  background: white;
  border-radius: 10px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.discussion-header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.discussion-header h1 {
  margin: 0;
  color: #333;
  font-size: 1.75rem;
  flex: 1;
}

.discussion-actions-menu {
  display: flex;
  gap: 0.5rem;
  margin-left: 1rem;
}

.edit-btn, .delete-btn {
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.edit-btn {
  background: #007bff;
  color: white;
}

.edit-btn:hover {
  background: #0056b3;
}

.delete-btn {
  background: #dc3545;
  color: white;
}

.delete-btn:hover {
  background: #c82333;
}

.discussion-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  color: #666;
  margin-bottom: 1rem;
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

.tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tag {
  background: #f0f0f0;
  color: #666;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
}

.discussion-content {
  line-height: 1.6;
  color: #333;
  font-size: 1.1rem;
}

/* Комментарии */
.comments-section {
  background: white;
  border-radius: 10px;
  padding: 2rem;
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

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.comment {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.5rem;
  background: #fafafa;
  transition: all 0.3s;
}

.comment.editing {
  border-color: #007bff;
  background: #e7f3ff;
}

.comment.reply {
  margin-left: 2rem;
  border-left: 3px solid #e10600;
  background: #f8f9fa;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.comment-actions {
  display: flex;
  gap: 0.5rem;
}

.comment-actions .edit-btn,
.comment-actions .delete-btn {
  padding: 4px 8px;
  font-size: 0.8rem;
}

.comment-author {
  font-weight: bold;
  color: #e10600;
}

.comment-date {
  color: #666;
}

.comment-content {
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

.comment-footer {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.reply-btn,
.report-btn {
  background: none;
  border: 1px solid #ddd;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.reply-btn {
  background: #3f4bb6;
  color: white;
  border: 1px solid #4a28a7;
}

.report-btn {
  background: #ffc107;
  color: #212529;
  border: 1px solid #ffc107;
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

/* Адаптивность */
@media (max-width: 768px) {
  .discussion-view {
    padding: 10px;
  }
  
  .discussion-header-top {
    flex-direction: column;
    gap: 1rem;
  }
  
  .discussion-actions-menu {
    margin-left: 0;
    width: 100%;
    justify-content: flex-end;
  }
  
  .discussion-meta {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .edit-modal-content {
    margin: 1rem;
    width: calc(100% - 2rem);
  }
  
  .form-actions,
  .edit-comment-actions {
    flex-direction: column;
  }
}
</style>