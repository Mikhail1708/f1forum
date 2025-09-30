<template>
  <div class="discussion-view">
    <div v-if="discussionsStore.loading" class="loading">Загрузка обсуждения...</div>
    
    <div v-else-if="discussionsStore.currentDiscussion" class="discussion-content">
      <!-- Кнопка назад -->
      <button @click="$router.push('/discussions')" class="back-btn">← Назад к обсуждениям</button>
      
      <!-- Основное обсуждение -->
      <article class="discussion-main">
        <header class="discussion-header">
          <h1>{{ discussionsStore.currentDiscussion.title }}</h1>
          <div class="discussion-meta">
            <span class="author">👤 {{ discussionsStore.currentDiscussion.author.username }}</span>
            <span class="date">{{ formatDate(discussionsStore.currentDiscussion.createdAt) }}</span>
            <span class="views">👁️ {{ discussionsStore.currentDiscussion.views }} просмотров</span>
          </div>
          <div class="tags">
            <span 
              v-for="tag in discussionsStore.currentDiscussion.tags" 
              :key="tag" 
              class="tag"
            >
              #{{ tag }}
            </span>
          </div>
        </header>
        
        <div class="discussion-body">
          <p>{{ discussionsStore.currentDiscussion.content }}</p>
        </div>
      </article>

      <!-- Комментарии -->
      <section class="comments-section">
        <h2>💬 Комментарии ({{ discussionsStore.currentDiscussion.comments.length }})</h2>
        
        <!-- Форма добавления комментария -->
        <div v-if="authStore.isAuthenticated" class="comment-form">
          <h3>Добавить комментарий</h3>
          <form @submit.prevent="addNewComment">
            <textarea 
              v-model="newComment" 
              placeholder="Напишите ваш комментарий..." 
              rows="4"
              required
            ></textarea>
            <button type="submit" :disabled="!newComment.trim()" class="submit-comment-btn">
              Отправить комментарий
            </button>
          </form>
        </div>
        <div v-else class="auth-required">
          <p>Чтобы оставить комментарий, <router-link to="/login">войдите</router-link> в систему</p>
        </div>

        <!-- Список комментариев -->
        <div class="comments-list">
          <div 
            v-for="comment in discussionsStore.currentDiscussion.comments" 
            :key="comment.id" 
            class="comment"
          >
            <div class="comment-header">
              <span class="comment-author">👤 {{ comment.author.username }}</span>
              <span class="comment-date">{{ formatDate(comment.createdAt) }}</span>
            </div>
            <div class="comment-body">
              <p>{{ comment.content }}</p>
            </div>
            <div class="comment-footer">
              <button @click="likeComment(comment.id)" class="like-btn">
                👍 {{ comment.likes }}
              </button>
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

onMounted(async () => {
  const discussionId = route.params.id;
  await discussionsStore.fetchDiscussion(discussionId);
});

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const addNewComment = async () => {
  if (!newComment.value.trim()) return;

  try {
    await discussionsStore.addComment(
      route.params.id, 
      { content: newComment.value }
    );
    newComment.value = '';
  } catch (error) {
    alert('Ошибка при добавлении комментария: ' + error.message);
  }
};

const likeComment = (commentId) => {
  // TODO: Реализовать лайки через API
  alert('Лайк для комментария ' + commentId);
};
</script>

<style scoped>
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

.discussion-header {
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 1rem;
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
}

.comments-section {
  background: white;
  border-radius: 10px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.comments-section h2 {
  margin: 0 0 1.5rem 0;
  color: #333;
}

.comment-form {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.comment-form h3 {
  margin: 0 0 1rem 0;
  color: #333;
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

.submit-comment-btn {
  background: #e10600;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
}

.submit-comment-btn:disabled {
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
  display: grid;
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
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.comment-author {
  font-weight: 600;
  color: #333;
}

.comment-date {
  color: #666;
}

.comment-body {
  margin-bottom: 1rem;
  line-height: 1.5;
}

.comment-footer {
  display: flex;
  justify-content: flex-end;
}

.like-btn {
  background: transparent;
  border: 1px solid #e0e0e0;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.like-btn:hover {
  background: #f0f0f0;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.error {
  text-align: center;
  padding: 3rem;
  color: #e10600;
}

@media (max-width: 768px) {
  .discussion-meta {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .comment-header {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>