<template>
  <div class="discussion-view">
    <div v-if="discussionsStore.loading" class="loading">Загрузка обсуждения...</div>
    
    <div v-else-if="discussionsStore.currentDiscussion" class="discussion-content">
      <button @click="$router.push('/discussions')" class="back-btn">← Назад</button>
      
      <article class="discussion-main">
        <header class="discussion-header">
          <h1>{{ discussionsStore.currentDiscussion.title }}</h1>
          <div class="discussion-meta">
            <span class="author">👤 {{ discussionsStore.currentDiscussion.author?.username || 'Unknown' }}</span>
            <span class="date">{{ formatDate(discussionsStore.currentDiscussion.created_at) }}</span>
            <span class="views">👁️ {{ discussionsStore.currentDiscussion.views }}</span>
          </div>
          <div class="tags">
            <span v-for="tag in discussionsStore.currentDiscussion.tags" :key="tag" class="tag">#{{ tag }}</span>
          </div>
        </header>
        
        <div class="discussion-body">
          <p>{{ discussionsStore.currentDiscussion.content }}</p>
        </div>
        
        <div class="discussion-actions">
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
            <div class="comment-header">
              <span class="comment-author">👤 {{ comment.author?.username || 'Unknown' }}</span>
              <span class="comment-date">{{ formatDate(comment.created_at) }}</span>
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

            <!-- Ответы -->
            <div v-if="comment.replies && comment.replies.length" class="replies">
              <div v-for="reply in comment.replies" :key="reply.id" class="comment reply">
                <div class="comment-header">
                  <span class="comment-author">👤 {{ reply.author?.username || 'Unknown' }}</span>
                  <span class="comment-date">{{ formatDate(reply.created_at) }}</span>
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
      </section>
    </div>
    
    <div v-else class="error">
      Обсуждение не найдено
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
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

onMounted(() => {
  const discussionId = route.params.id;
  if (discussionId) {
    discussionsStore.fetchDiscussion(discussionId);
  }
});

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
/* Стили остаются такими же как в предыдущей версии */
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

.discussion-header h1 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.75rem;
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

.cancel-btn {
  background: #666;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
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

.reply {
  margin-left: 2rem;
  background: #f8f9fa;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
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

.loading, .error {
  text-align: center;
  padding: 3rem;
}

.error {
  color: #e10600;
}
</style>