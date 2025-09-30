<template>
  <div class="discussions-view">
    <div class="discussions-header">
      <h1>🏁 Обсуждения Формулы 1</h1>
      <p>Обсуждайте гонки, команды, пилотов и многое другое</p>
    </div>

    <div class="discussions-actions">
      <div class="search-box">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Поиск обсуждений..."
          @input="handleSearch"
        />
        <button @click="handleSearch" class="search-btn">🔍</button>
      </div>
      <button 
        v-if="authStore.isAuthenticated"
        @click="showCreateForm = true" 
        class="create-discussion-btn"
      >
        📝 Создать обсуждение
      </button>
      <router-link 
        v-else 
        to="/login" 
        class="create-discussion-btn"
      >
        📝 Войдите чтобы создать обсуждение
      </router-link>
    </div>

    <!-- Создание обсуждения -->
    <div v-if="showCreateForm" class="create-discussion-form">
      <h3>Создать новое обсуждение</h3>
      <form @submit.prevent="createNewDiscussion">
        <div class="form-group">
          <label>Заголовок:</label>
          <input 
            v-model="newDiscussion.title" 
            type="text" 
            required 
            maxlength="100"
            placeholder="Введите заголовок обсуждения"
          />
          <span class="char-count">{{ newDiscussion.title.length }}/100</span>
        </div>

        <div class="form-group">
          <label>Содержание:</label>
          <textarea 
            v-model="newDiscussion.content" 
            required 
            rows="6"
            placeholder="Опишите ваше обсуждение..."
          ></textarea>
        </div>

        <div class="form-group">
          <label>Теги (через запятую):</label>
          <input 
            v-model="newDiscussion.tagsInput" 
            type="text" 
            placeholder="гонка, стратегия, команда..."
          />
        </div>

        <div class="form-actions">
          <button type="submit" :disabled="discussionsStore.loading" class="submit-btn">
            {{ discussionsStore.loading ? 'Создание...' : 'Создать обсуждение' }}
          </button>
          <button type="button" @click="cancelCreate" class="cancel-btn">Отмена</button>
        </div>
      </form>
    </div>

    <!-- Отладочная информация -->
    <div v-if="debug" style="background: #f8f9fa; padding: 10px; margin: 10px 0; border-radius: 5px;">
      <strong>Отладка:</strong> 
      Всего обсуждений: {{ discussionsStore.discussions.length }} |
      Поиск: "{{ searchQuery }}" |
      Показано: {{ filteredDiscussions.length }}
    </div>

    <!-- Список обсуждений -->
    <div class="discussions-list">
      <div v-if="discussionsStore.loading" class="loading">Загрузка обсуждений...</div>
      
      <div v-else-if="filteredDiscussions.length === 0" class="no-discussions">
        <p>Обсуждений не найдено</p>
        <button 
          v-if="authStore.isAuthenticated"
          @click="showCreateForm = true" 
          class="create-first-btn"
        >
          Создать первое обсуждение
        </button>
      </div>

      <div v-else class="discussion-cards">
        <div 
          v-for="discussion in filteredDiscussions" 
          :key="discussion.id" 
          class="discussion-card"
          @click="openDiscussion(discussion.id)"
        >
          <div class="discussion-header">
            <h3>{{ discussion.title }}</h3>
            <div class="discussion-meta">
              <span class="author">👤 {{ discussion.author.username }}</span>
              <span class="date">{{ formatDate(discussion.createdAt) }}</span>
            </div>
          </div>
          
          <p class="discussion-content">{{ truncateContent(discussion.content) }}</p>
          
          <div class="discussion-footer">
            <div class="tags">
              <span 
                v-for="tag in discussion.tags" 
                :key="tag" 
                class="tag"
              >
                #{{ tag }}
              </span>
            </div>
            <div class="stats">
              <span class="comments">💬 {{ discussion.commentsCount || 0 }}</span>
              <span class="views">👁️ {{ discussion.views || 0 }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useDiscussionsStore } from '../stores/discussionsStore';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const discussionsStore = useDiscussionsStore();
const authStore = useAuthStore();

const showCreateForm = ref(false);
const searchQuery = ref('');
const debug = ref(true); // Включить отладку
const newDiscussion = ref({
  title: '',
  content: '',
  tagsInput: ''
});

const filteredDiscussions = computed(() => {
  if (!searchQuery.value) {
    return discussionsStore.discussions;
  }
  
  const query = searchQuery.value.toLowerCase();
  return discussionsStore.discussions.filter(discussion => 
    discussion.title.toLowerCase().includes(query) ||
    discussion.content.toLowerCase().includes(query) ||
    (discussion.tags && discussion.tags.some(tag => tag.toLowerCase().includes(query)))
  );
});

onMounted(async () => {
  await discussionsStore.fetchDiscussions();
});

const formatDate = (dateString) => {
  try {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return 'неизвестно';
  }
};

const truncateContent = (content, length = 150) => {
  if (!content) return '';
  return content.length > length ? content.substring(0, length) + '...' : content;
};

const openDiscussion = (id) => {
  router.push(`/discussions/${id}`);
};

const createNewDiscussion = async () => {
  try {
    // Валидация
    if (!newDiscussion.value.title.trim()) {
      alert('Введите заголовок обсуждения');
      return;
    }
    
    if (!newDiscussion.value.content.trim()) {
      alert('Введите содержание обсуждения');
      return;
    }

    const discussionData = {
      title: newDiscussion.value.title.trim(),
      content: newDiscussion.value.content.trim(),
      tags: newDiscussion.value.tagsInput
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
    };

    console.log('Отправка данных:', discussionData);
    
    await discussionsStore.createDiscussion(discussionData);
    
    console.log('Обсуждения после создания:', discussionsStore.discussions);
    
    // Сброс формы
    newDiscussion.value = { title: '', content: '', tagsInput: '' };
    showCreateForm.value = false;
    searchQuery.value = ''; // Сбрасываем поиск
    
    // Показываем успешное сообщение
    setTimeout(() => {
      alert('Обсуждение успешно создано!');
    }, 100);
    
  } catch (error) {
    console.error('Ошибка создания:', error);
    alert('Ошибка при создании обсуждения: ' + error.message);
  }
};

const cancelCreate = () => {
  showCreateForm.value = false;
  newDiscussion.value = { title: '', content: '', tagsInput: '' };
};

const handleSearch = () => {
  // Поиск уже реализован в computed свойстве
};
</script>

<style scoped>
/* Стили остаются такими же как в предыдущей версии */
.discussions-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.discussions-header {
  text-align: center;
  margin-bottom: 2rem;
  background: linear-gradient(135deg, #e10600, #b30500);
  color: white;
  padding: 2rem;
  border-radius: 10px;
}

.discussions-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
}

.search-box {
  display: flex;
  flex: 1;
  max-width: 400px;
}

.search-box input {
  flex: 1;
  padding: 10px;
  border: 2px solid #e10600;
  border-radius: 6px 0 0 6px;
  font-size: 16px;
}

.search-btn {
  background: #e10600;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 0 6px 6px 0;
  cursor: pointer;
}

.create-discussion-btn {
  background: #006f62;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 6px;
  text-decoration: none;
  cursor: pointer;
  font-weight: 500;
}

.create-discussion-form {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.form-group input:focus,
.form-group textarea:focus {
  border-color: #e10600;
  outline: none;
}

.char-count {
  display: block;
  text-align: right;
  font-size: 12px;
  color: #666;
  margin-top: 0.25rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
}

.submit-btn {
  background: #e10600;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.cancel-btn {
  background: #666;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
}

.discussion-cards {
  display: grid;
  gap: 1.5rem;
}

.discussion-card {
  background: white;
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
  border-left: 4px solid #e10600;
}

.discussion-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}

.discussion-header {
  margin-bottom: 1rem;
}

.discussion-header h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.25rem;
}

.discussion-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  color: #666;
}

.discussion-content {
  color: #555;
  line-height: 1.5;
  margin-bottom: 1rem;
}

.discussion-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.stats {
  display: flex;
  gap: 1rem;
  color: #666;
  font-size: 0.9rem;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.no-discussions {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.create-first-btn {
  background: #e10600;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 1rem;
}

@media (max-width: 768px) {
  .discussions-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-box {
    max-width: none;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
</style>