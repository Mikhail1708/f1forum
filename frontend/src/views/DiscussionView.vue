<!-- frontend/src/views/DiscussionView.vue -->
<template>
  <div class="discussion-view" v-if="discussionStore.currentDiscussion">
    <div class="discussion-header">
      <h1>{{ discussionStore.currentDiscussion.title }}</h1>
      <div class="discussion-meta">
        <span class="author">👤 {{ discussionStore.currentDiscussion.author?.username }}</span>
        <span class="date">{{ formatDate(discussionStore.currentDiscussion.created_at) }}</span>
        <div class="discussion-stats">
          <span class="views">👁️ {{ discussionStore.currentDiscussion.views }}</span>
          <span class="likes">👍 {{ discussionStore.currentDiscussion.likes }}</span>
          <button 
            @click="likeDiscussion(discussionStore.currentDiscussion.id)" 
            class="like-btn"
            :class="{ 'liked': discussionStore.currentDiscussion.liked }"
          >
            ❤️
          </button>
        </div>
      </div>
    </div>

    <div class="discussion-content">
      <p>{{ discussionStore.currentDiscussion.content }}</p>
      <div class="tags" v-if="discussionStore.currentDiscussion.tags && discussionStore.currentDiscussion.tags.length">
        <span v-for="tag in discussionStore.currentDiscussion.tags" :key="tag" class="tag">#{{ tag }}</span>
      </div>
    </div>

    <!-- Действия с обсуждением -->
    <div class="discussion-actions" v-if="authStore.isAuthenticated">
      <button 
        v-if="isDiscussionAuthor(discussionStore.currentDiscussion)"
        @click="editDiscussion" 
        class="edit-btn"
      >
        ✏️ Редактировать
      </button>
      <button 
        v-if="isDiscussionAuthor(discussionStore.currentDiscussion)"
        @click="deleteDiscussion" 
        class="delete-btn"
      >
        🗑️ Удалить
      </button>
    </div>

    <!-- Комментарии -->
    <div class="comments-section">
      <h3>Комментарии ({{ getTotalCommentsCount() }})</h3>
      
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
      <div v-else class="login-prompt">
        <router-link to="/login" class="login-link">
          🔑 Войдите, чтобы оставить комментарий
        </router-link>
      </div>

      <!-- Список комментариев -->
      <div v-if="discussionStore.currentDiscussion.comments && discussionStore.currentDiscussion.comments.length" class="comments-list">
        <div 
          v-for="comment in discussionStore.currentDiscussion.comments" 
          :key="comment.id"
          class="comment"
        >
          <!-- Основной комментарий -->
          <div class="comment-main">
            <div class="comment-header">
              <span class="comment-author">{{ comment.author?.username }}</span>
              <span class="comment-date">{{ formatDate(comment.created_at) }}</span>
            </div>
            <div class="comment-content">{{ comment.content }}</div>
            <div class="comment-actions">
              <button @click="likeComment(comment.id)" class="like-btn">
                👍 {{ comment.likes || 0 }}
              </button>
              <button @click="toggleReply(comment.id)" class="reply-btn">
                💬 Ответить
              </button>
              <button 
                v-if="isCommentAuthor(comment)"
                @click="editComment(comment)"
                class="edit-btn"
              >
                ✏️
              </button>
              <button 
                v-if="isCommentAuthor(comment)"
                @click="deleteComment(comment.id)"
                class="delete-btn"
              >
                🗑️
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
                <button @click="submitReply(comment.id)" class="submit-btn">
                  Отправить
                </button>
                <button @click="cancelReply" class="cancel-btn">
                  Отмена
                </button>
              </div>
            </div>
          </div>

          <!-- Вложенные ответы -->
          <div v-if="comment.replies && comment.replies.length > 0" class="replies">
            <div 
              v-for="reply in comment.replies" 
              :key="reply.id"
              class="comment reply"
            >
              <div class="comment-main">
                <div class="comment-header">
                  <span class="comment-author">{{ reply.author?.username }}</span>
                  <span class="comment-date">{{ formatDate(reply.created_at) }}</span>
                </div>
                <div class="comment-content">{{ reply.content }}</div>
                <div class="comment-actions">
                  <button @click="likeComment(reply.id)" class="like-btn">
                    👍 {{ reply.likes || 0 }}
                  </button>
                  <button 
                    v-if="isCommentAuthor(reply)"
                    @click="editComment(reply)"
                    class="edit-btn"
                  >
                    ✏️
                  </button>
                  <button 
                    v-if="isCommentAuthor(reply)"
                    @click="deleteComment(reply.id)"
                    class="delete-btn"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="no-comments">
        <p>Пока нет комментариев. Будьте первым!</p>
      </div>
    </div>

    <!-- Загрузка -->
    <div v-if="discussionStore.loading" class="loading">
      Загрузка...
    </div>
  </div>

  <div v-else-if="discussionStore.loading" class="loading">
    Загрузка обсуждения...
  </div>

  <div v-else class="error">
    Обсуждение не найдено
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDiscussionsStore } from '../stores/discussionsStore';
import { useAuthStore } from '../stores/auth';

const route = useRoute();
const router = useRouter();
const discussionStore = useDiscussionsStore();
const authStore = useAuthStore();

const newComment = ref('');
const replyingTo = ref(null);
const replyContent = ref('');
const editingComment = ref(null);
const editContent = ref('');

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
    count++; // основной комментарий
    if (comment.replies) {
      count += comment.replies.length; // ответы
    }
  });
  return count;
};

const likeDiscussion = async (discussionId) => {
  try {
    await discussionStore.likeDiscussion(discussionId);
  } catch (error) {
    console.error('Ошибка при лайке:', error);
  }
};

const addComment = async () => {
  if (!newComment.value.trim()) return;
  
  try {
    await discussionStore.addComment(route.params.id, {
      content: newComment.value.trim()
    });
    newComment.value = '';
  } catch (error) {
    console.error('Ошибка при добавлении комментария:', error);
  }
};

const toggleReply = (commentId) => {
  replyingTo.value = replyingTo.value === commentId ? null : commentId;
  replyContent.value = '';
};

const cancelReply = () => {
  replyingTo.value = null;
  replyContent.value = '';
};

const submitReply = async (commentId) => {
  if (!replyContent.value.trim()) return;
  
  try {
    await discussionStore.addReply(commentId, {
      content: replyContent.value.trim()
    });
    cancelReply();
  } catch (error) {
    console.error('Ошибка при отправке ответа:', error);
  }
};

const likeComment = async (commentId) => {
  try {
    await discussionStore.likeComment(commentId);
  } catch (error) {
    console.error('Ошибка при лайке комментария:', error);
  }
};

const editComment = (comment) => {
  editingComment.value = comment;
  editContent.value = comment.content;
};

const updateComment = async () => {
  if (!editContent.value.trim()) return;
  
  try {
    await discussionStore.updateComment(editingComment.value.id, {
      content: editContent.value.trim()
    });
    editingComment.value = null;
    editContent.value = '';
  } catch (error) {
    console.error('Ошибка при редактировании комментария:', error);
  }
};

const cancelEdit = () => {
  editingComment.value = null;
  editContent.value = '';
};

const deleteComment = async (commentId) => {
  if (!confirm('Вы уверены, что хотите удалить этот комментарий?')) return;
  
  try {
    await discussionStore.deleteComment(commentId);
  } catch (error) {
    console.error('Ошибка при удалении комментария:', error);
  }
};

const editDiscussion = () => {
  // Реализация редактирования обсуждения
  console.log('Редактирование обсуждения');
};

const deleteDiscussion = async () => {
  if (!confirm('Вы уверены, что хотите удалить это обсуждение?')) return;
  
  try {
    await discussionStore.deleteDiscussion(route.params.id);
    router.push('/discussions');
  } catch (error) {
    console.error('Ошибка при удалении обсуждения:', error);
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
  font-size: 2rem;
}

.discussion-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  color: #666;
  font-size: 0.9rem;
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
  transition: all 0.3s;
}

.like-btn:hover, .like-btn.liked {
  background: #e10600;
  color: white;
}

.discussion-content {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
  line-height: 1.6;
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

.discussion-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.edit-btn, .delete-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
}

.edit-btn {
  background: #007bff;
  color: white;
}

.delete-btn {
  background: #dc3545;
  color: white;
}

.comments-section {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.comment-form, .login-prompt {
  margin-bottom: 2rem;
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.comment-form textarea {
  width: 100%;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  resize: vertical;
  font-family: inherit;
  font-size: 1rem;
}

.submit-btn {
  background: #e10600;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 1rem;
  font-size: 1rem;
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.login-link {
  color: #e10600;
  text-decoration: none;
  font-weight: 500;
}

/* Стили для комментариев */
.comment {
  margin-bottom: 1rem;
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
}

.comment.reply {
  margin-left: 2rem;
  margin-top: 0.5rem;
  border-left: 3px solid #e10600;
  background: #f9f9f9;
}

.replies {
  margin-top: 1rem;
  border-left: 2px solid #ddd;
  padding-left: 1rem;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
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
  line-height: 1.4;
}

.comment-actions {
  display: flex;
  gap: 0.5rem;
}

.comment-actions button {
  background: none;
  border: 1px solid #ddd;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.comment-actions .like-btn:hover,
.comment-actions .reply-btn:hover {
  background: #f0f0f0;
}

.comment-actions .edit-btn {
  color: #007bff;
  border-color: #007bff;
}

.comment-actions .delete-btn {
  color: #dc3545;
  border-color: #dc3545;
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

.loading, .error, .no-comments {
  text-align: center;
  padding: 3rem;
  color: #666;
}

@media (max-width: 768px) {
  .discussion-view {
    padding: 10px;
  }
  
  .discussion-meta {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .comment.reply {
    margin-left: 1rem;
  }
  
  .comment-actions {
    flex-wrap: wrap;
  }
}
</style>