<template>
  <div class="discussion-view">
    <div v-if="discussionsStore.loading" class="loading">Загрузка обсуждения...</div>
    
    <div v-else-if="discussionsStore.currentDiscussion" class="discussion-content">
      <button @click="$router.push('/discussions')" class="back-btn">← Назад</button>
      
      <article class="discussion-main">
        <header class="discussion-header">
          <!-- Режим редактирования обсуждения -->
          <div v-if="editingDiscussion" class="edit-form">
            <input v-model="editDiscussionData.title" class="edit-title" placeholder="Заголовок">
            <textarea v-model="editDiscussionData.content" class="edit-content" placeholder="Содержание"></textarea>
            <input v-model="editDiscussionData.tagsInput" class="edit-tags" placeholder="Теги через запятую">
            <div class="edit-actions">
              <button @click="saveDiscussion" class="save-btn" :disabled="saving">💾 Сохранить</button>
              <button @click="cancelEditDiscussion" class="cancel-btn">❌ Отмена</button>
            </div>
          </div>
          
          <!-- Режим просмотра обсуждения -->
          <div v-else>
            <div class="discussion-header-actions">
              <h1>{{ discussionsStore.currentDiscussion.title }}</h1>
              <div v-if="canEditDiscussion" class="discussion-actions-menu">
                <button @click="startEditDiscussion" class="edit-btn">✏️</button>
                <button @click="deleteDiscussion" class="delete-btn">🗑️ УДАЛИТЬ</button>
              </div>
            </div>
            
            <div class="discussion-meta">
              <span class="author">👤 {{ discussionsStore.currentDiscussion.author?.username || 'Unknown' }}</span>
              <span class="date">{{ formatDate(discussionsStore.currentDiscussion.created_at) }}</span>
              <span class="views">👁️ {{ discussionsStore.currentDiscussion.views }}</span>
            </div>
            
            <div class="tags">
              <span v-for="tag in discussionsStore.currentDiscussion.tags" :key="tag" class="tag">#{{ tag }}</span>
            </div>
          </div>
        </header>
        
        <div class="discussion-body" v-if="!editingDiscussion">
          <p>{{ discussionsStore.currentDiscussion.content }}</p>
        </div>
        
        <div class="discussion-actions" v-if="!editingDiscussion">
          <button @click="likeDiscussion" class="like-btn" :disabled="liking">
            👍 {{ discussionsStore.currentDiscussion.likes || 0 }}
          </button>
        </div>
      </article>

      <section class="comments-section">
        <h2>💬 Комментарии ({{ getTotalComments() }})</h2>
        
        <!-- Форма комментария -->
        <div v-if="authStore.isAuthenticated" class="comment-form">
          <h3>{{ replyingTo ? `Ответ ${replyingTo.author?.username}` : 'Добавить комментарий' }}</h3>
          <form @submit.prevent="submitComment">
            <textarea v-model="newComment" placeholder="Введите комментарий..." rows="4" required></textarea>
            <div class="form-actions">
              <button type="submit" :disabled="!newComment.trim() || submitting" class="submit-btn">
                {{ submitting ? 'Отправка...' : (replyingTo ? 'Ответить' : 'Отправить') }}
              </button>
              <button v-if="replyingTo" type="button" @click="cancelReply" class="cancel-btn">Отмена</button>
            </div>
          </form>
        </div>
        <div v-else class="auth-required">
          <p>🔑 <router-link to="/login">Войдите</router-link>, чтобы оставить комментарий</p>
        </div>

        <!-- Список комментариев -->
        <div class="comments-list">
          <div v-for="comment in discussionsStore.currentDiscussion.comments || []" :key="comment.id" class="comment">
            <!-- Режим редактирования комментария -->
            <div v-if="editingComment === comment.id" class="edit-comment-form">
              <textarea v-model="editCommentData.content" class="edit-comment-text" placeholder="Текст комментария"></textarea>
              <div class="edit-comment-actions">
                <button @click="saveComment(comment.id)" class="save-btn" :disabled="savingComment">💾 Сохранить</button>
                <button @click="cancelEditComment" class="cancel-btn">❌ Отмена</button>
              </div>
            </div>
            
            <!-- Режим просмотра комментария -->
            <div v-else>
              <div class="comment-header">
                <span class="comment-author">👤 {{ comment.author?.username || 'Unknown' }}</span>
                <span class="comment-date">{{ formatDate(comment.created_at) }}</span>
                <div v-if="canEditComment(comment)" class="comment-actions">
                  <button @click="startEditComment(comment)" class="edit-btn">✏️</button>
                  <button @click="deleteComment(comment.id)" class="delete-btn">🗑️ УДАЛИТЬ</button>
                </div>
              </div>
              
              <div class="comment-body">
                <p>{{ comment.content }}</p>
              </div>
              
              <div class="comment-footer">
                <button @click="likeComment(comment.id)" class="like-btn" :disabled="likingComment === comment.id">
                  👍 {{ comment.likes || 0 }}
                </button>
                <button @click="startReply(comment)" class="reply-btn">💬 Ответить</button>
              </div>
            </div>

            <!-- Ответы -->
            <div v-if="comment.replies && comment.replies.length" class="replies">
              <div v-for="reply in comment.replies" :key="reply.id" class="comment reply">
                <!-- Режим редактирования ответа -->
                <div v-if="editingComment === reply.id" class="edit-comment-form">
                  <textarea v-model="editCommentData.content" class="edit-comment-text" placeholder="Текст ответа"></textarea>
                  <div class="edit-comment-actions">
                    <button @click="saveComment(reply.id)" class="save-btn" :disabled="savingComment">💾 Сохранить</button>
                    <button @click="cancelEditComment" class="cancel-btn">❌ Отмена</button>
                  </div>
                </div>
                
                <!-- Режим просмотра ответа -->
                <div v-else>
                  <div class="comment-header">
                    <span class="comment-author">👤 {{ reply.author?.username || 'Unknown' }}</span>
                    <span class="comment-date">{{ formatDate(reply.created_at) }}</span>
                    <div v-if="canEditComment(reply)" class="comment-actions">
                      <button @click="startEditComment(reply)" class="edit-btn">✏️</button>
                      <button @click="deleteComment(reply.id)" class="delete-btn">🗑️ УДАЛИТЬ</button>
                    </div>
                  </div>
                  
                  <div class="comment-body">
                    <p>{{ reply.content }}</p>
                  </div>
                  
                  <div class="comment-footer">
                    <button @click="likeComment(reply.id)" class="like-btn" :disabled="likingComment === reply.id">
                      👍 {{ reply.likes || 0 }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
    
    <div v-else class="error">
      Обсуждение не найдено
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDiscussionsStore } from '../stores/discussionsStore';
import { useAuthStore } from '../stores/auth';

const route = useRoute();
const router = useRouter();
const discussionsStore = useDiscussionsStore();
const authStore = useAuthStore();

const newComment = ref('');
const replyingTo = ref(null);
const submitting = ref(false);
const liking = ref(false);
const likingComment = ref(null);

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

onMounted(() => {
  const discussionId = route.params.id;
  if (discussionId) {
    discussionsStore.fetchDiscussion(discussionId);
  }
});

// Проверка прав на редактирование обсуждения
const canEditDiscussion = computed(() => {
  return discussionsStore.isCurrentUserAuthor(discussionsStore.currentDiscussion);
});

// Проверка прав на редактирование комментария
const canEditComment = (comment) => {
  return discussionsStore.isCurrentUserAuthor(comment);
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '';
  }
};

const getTotalComments = () => {
  const discussion = discussionsStore.currentDiscussion;
  if (!discussion?.comments) return 0;
  
  let total = discussion.comments.length;
  discussion.comments.forEach(comment => {
    if (comment.replies) {
      total += comment.replies.length;
    }
  });
  return total;
};

// Редактирование обсуждения
const startEditDiscussion = () => {
  editingDiscussion.value = true;
  editDiscussionData.value = {
    title: discussionsStore.currentDiscussion.title,
    content: discussionsStore.currentDiscussion.content,
    tagsInput: discussionsStore.currentDiscussion.tags?.join(', ') || ''
  };
};

const cancelEditDiscussion = () => {
  editingDiscussion.value = false;
  editDiscussionData.value = { title: '', content: '', tagsInput: '' };
};

const saveDiscussion = async () => {
  if (!editDiscussionData.value.title.trim() || !editDiscussionData.value.content.trim()) {
    alert('Заполните все поля');
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

    await discussionsStore.updateDiscussion(discussionsStore.currentDiscussion.id, discussionData);
    editingDiscussion.value = false;
  } catch (error) {
    alert('Ошибка: ' + (error.response?.data?.error || error.message));
  } finally {
    saving.value = false;
  }
};

// УДАЛЕНИЕ ОБСУЖДЕНИЯ - БЕЗ CONFIRM
const deleteDiscussion = async () => {
  console.log('🗑️ deleteDiscussion вызвана');

  try {
    console.log('🗑️ Deleting discussion from component...');
    await discussionsStore.deleteDiscussion(discussionsStore.currentDiscussion.id);
    console.log('✅ Discussion deleted successfully');
    router.push('/discussions');
  } catch (error) {
    console.error('❌ Delete discussion error in component:', error);
    alert('Ошибка при удалении: ' + (error.response?.data?.error || error.message));
  }
};

// Редактирование комментариев
const startEditComment = (comment) => {
  editingComment.value = comment.id;
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
    await discussionsStore.updateComment(commentId, {
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

// УДАЛЕНИЕ КОММЕНТАРИЯ - БЕЗ CONFIRM
const deleteComment = async (commentId) => {
  console.log('🗑️ deleteComment вызвана для комментария:', commentId);

  try {
    console.log('🗑️ Deleting comment from component:', commentId);
    await discussionsStore.deleteComment(commentId);
    console.log('✅ Comment deleted successfully');
  } catch (error) {
    console.error('❌ Delete comment error in component:', error);
    alert('Ошибка при удалении: ' + (error.response?.data?.error || error.message));
  }
};

const startReply = (comment) => {
  replyingTo.value = comment;
};

const cancelReply = () => {
  replyingTo.value = null;
};

const submitComment = async () => {
  if (!newComment.value.trim() || submitting.value) return;

  submitting.value = true;
  try {
    if (replyingTo.value) {
      await discussionsStore.addReply(replyingTo.value.id, { content: newComment.value });
    } else {
      await discussionsStore.addComment(discussionsStore.currentDiscussion.id, { content: newComment.value });
    }
    
    newComment.value = '';
    replyingTo.value = null;
  } catch (error) {
    alert('Ошибка: ' + (error.response?.data?.error || error.message));
  } finally {
    submitting.value = false;
  }
};

const likeDiscussion = async () => {
  if (liking.value) return;
  
  liking.value = true;
  try {
    await discussionsStore.likeDiscussion(discussionsStore.currentDiscussion.id);
  } catch (error) {
    alert('Ошибка: ' + (error.response?.data?.error || error.message));
  } finally {
    liking.value = false;
  }
};

const likeComment = async (commentId) => {
  if (likingComment.value === commentId) return;
  
  likingComment.value = commentId;
  try {
    await discussionsStore.likeComment(commentId);
  } catch (error) {
    alert('Ошибка: ' + (error.response?.data?.error || error.message));
  } finally {
    setTimeout(() => {
      likingComment.value = null;
    }, 500);
  }
};
</script>

<style scoped>
/* Стили остаются такими же как в предыдущем коде */
.discussion-view {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
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

.discussion-main {
  background: white;
  border-radius: 10px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.discussion-header-actions {
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
  background: transparent;
  border: 1px solid #e0e0e0;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
}

.edit-btn:hover {
  background: #e3f2fd;
  border-color: #2196f3;
}

.delete-btn:hover {
  background: #ffebee;
  border-color: #f44336;
  transform: scale(1.1);
}

.discussion-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  color: #666;
  font-size: 0.9rem;
}

.tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tag {
  background: #e10600;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
}

.discussion-body {
  line-height: 1.6;
  color: #333;
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
}

.discussion-actions {
  display: flex;
  gap: 1rem;
}

.like-btn {
  background: transparent;
  border: 1px solid #e0e0e0;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.like-btn:hover:not(:disabled) {
  background: #f0f0f0;
}

.like-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Формы редактирования */
.edit-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.edit-title {
  font-size: 1.5rem;
  font-weight: bold;
  padding: 0.5rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
}

.edit-content {
  min-height: 120px;
  padding: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  resize: vertical;
  font-family: inherit;
}

.edit-tags {
  padding: 0.5rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
}

.edit-actions {
  display: flex;
  gap: 1rem;
}

.save-btn {
  background: #4caf50;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}

.save-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.cancel-btn {
  background: #666;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
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
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.comment-form textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 16px;
  margin-bottom: 1rem;
  resize: vertical;
}

.form-actions {
  display: flex;
  gap: 1rem;
}

.submit-btn {
  background: #e10600;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.auth-required {
  text-align: center;
  padding: 1rem;
  background: #fff3cd;
  border-radius: 6px;
  margin-bottom: 2rem;
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

.comment-body {
  margin-bottom: 1rem;
  line-height: 1.5;
}

.comment-footer {
  display: flex;
  gap: 1rem;
}

.reply-btn {
  background: transparent;
  border: 1px solid #e0e0e0;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.reply {
  margin-left: 2rem;
  background: #f8f9fa;
}

/* Форма редактирования комментария */
.edit-comment-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.edit-comment-text {
  min-height: 80px;
  padding: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  resize: vertical;
  font-family: inherit;
}

.edit-comment-actions {
  display: flex;
  gap: 1rem;
}

.loading, .error {
  text-align: center;
  padding: 3rem;
}

.error {
  color: #e10600;
}
</style>