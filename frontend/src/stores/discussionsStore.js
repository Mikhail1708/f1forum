import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '../services/api';

export const useDiscussionsStore = defineStore('discussions', () => {
  const discussions = ref([]);
  const currentDiscussion = ref(null);
  const loading = ref(false);
  const error = ref(null);

  const getCurrentUser = () => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : { username: 'Anonymous', id: null };
  };

  // Загрузка всех обсуждений
  const fetchDiscussions = async () => {
    loading.value = true;
    try {
      const response = await api.get('/topics');
      discussions.value = response.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Ошибка загрузки обсуждений';
    } finally {
      loading.value = false;
    }
  };

  // Загрузка одного обсуждения
  const fetchDiscussion = async (id) => {
    if (!id) return;
    
    loading.value = true;
    try {
      const response = await api.get(`/topics/${id}`);
      currentDiscussion.value = response.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Ошибка загрузки обсуждения';
    } finally {
      loading.value = false;
    }
  };

  // Создание обсуждения
  const createDiscussion = async (discussionData) => {
    try {
      await api.post('/topics', discussionData);
      await fetchDiscussions();
    } catch (err) {
      error.value = err.response?.data?.error || 'Ошибка создания обсуждения';
      throw err;
    }
  };

  // Лайк обсуждения
  const likeDiscussion = async (discussionId) => {
    try {
      const response = await api.post(`/topics/${discussionId}/like`);
      const { likes } = response.data;

      if (currentDiscussion.value?.id === discussionId) {
        currentDiscussion.value.likes = likes;
      }

      const discussion = discussions.value.find(d => d.id === discussionId);
      if (discussion) {
        discussion.likes = likes;
      }
    } catch (err) {
      error.value = err.response?.data?.error || 'Ошибка при лайке обсуждения';
      throw err;
    }
  };

  // Добавление комментария - УПРОЩЕННАЯ ВЕРСИЯ
  const addComment = async (discussionId, commentData) => {
    try {
      // Просто отправляем запрос и перезагружаем обсуждение
      await api.post('/comments', {
        ...commentData,
        topic_id: discussionId
      });

      // Перезагружаем обсуждение чтобы получить актуальные данные
      await fetchDiscussion(discussionId);
      
    } catch (err) {
      error.value = err.response?.data?.error || 'Ошибка добавления комментария';
      throw err;
    }
  };

  // Добавление ответа - УПРОЩЕННАЯ ВЕРСИЯ
  const addReply = async (commentId, replyData) => {
    try {
      // Просто отправляем запрос и перезагружаем обсуждение
      await api.post('/comments', {
        content: replyData.content,
        parent_id: commentId,
        topic_id: currentDiscussion.value?.id
      });

      // Перезагружаем обсуждение чтобы получить актуальные данные
      await fetchDiscussion(currentDiscussion.value?.id);
      
    } catch (err) {
      error.value = err.response?.data?.error || 'Ошибка добавления ответа';
      throw err;
    }
  };

  // Лайк комментария - УПРОЩЕННАЯ ВЕРСИЯ
  const likeComment = async (commentId) => {
    try {
      // Просто отправляем запрос
      await api.post(`/comments/${commentId}/like`);
      
      // Перезагружаем обсуждение чтобы получить актуальные данные
      await fetchDiscussion(currentDiscussion.value?.id);
      
    } catch (err) {
      error.value = err.response?.data?.error || 'Ошибка при лайке комментария';
      throw err;
    }
  };

  const clearCurrentDiscussion = () => {
    currentDiscussion.value = null;
  };

  return {
    discussions,
    currentDiscussion,
    loading,
    error,
    fetchDiscussions,
    fetchDiscussion,
    createDiscussion,
    addComment,
    addReply,
    likeDiscussion,
    likeComment,
    clearCurrentDiscussion
  };
});