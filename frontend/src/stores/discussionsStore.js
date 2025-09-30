import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useDiscussionsStore = defineStore('discussions', () => {
  // Функция для загрузки обсуждений из localStorage
  const loadDiscussionsFromStorage = () => {
    try {
      const saved = localStorage.getItem('f1-forum-discussions');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Ошибка загрузки из localStorage:', error);
    }
    // Возвращаем начальные данные если в localStorage ничего нет
    return [
      {
        id: 1,
        title: "Обсуждаем последнюю гонку в Бахрейне",
        content: "Что вы думаете о стратегиях команд в последней гонке?",
        author: { username: "f1_fan", id: 1 },
        createdAt: new Date().toISOString(),
        commentsCount: 5,
        views: 120,
        tags: ["гонка", "стратегия"]
      },
      {
        id: 2,
        title: "Новые правила 2024 года",
        content: "Как вы считаете, новые правила улучшили гонки?",
        author: { username: "racing_expert", id: 2 },
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        commentsCount: 12,
        views: 240,
        tags: ["правила", "2024"]
      }
    ];
  };

  // Функция для сохранения обсуждений в localStorage
  const saveDiscussionsToStorage = (discussions) => {
    try {
      localStorage.setItem('f1-forum-discussions', JSON.stringify(discussions));
    } catch (error) {
      console.error('Ошибка сохранения в localStorage:', error);
    }
  };

  // Инициализируем обсуждения из localStorage
  const discussions = ref(loadDiscussionsFromStorage());
  
  const currentDiscussion = ref(null);
  const loading = ref(false);
  const error = ref(null);

  // Загрузка всех обсуждений
  const fetchDiscussions = async () => {
    loading.value = true;
    try {
      // Просто возвращаем текущие данные
      return discussions.value;
    } catch (err) {
      error.value = 'Ошибка загрузки обсуждений';
      console.error(err);
    } finally {
      loading.value = false;
    }
  };

  // Загрузка конкретного обсуждения
  const fetchDiscussion = async (id) => {
    loading.value = true;
    try {
      const discussion = discussions.value.find(d => d.id === parseInt(id));
      if (discussion) {
        currentDiscussion.value = { ...discussion };
      }
      return currentDiscussion.value;
    } catch (err) {
      error.value = 'Ошибка загрузки обсуждения';
      console.error(err);
    } finally {
      loading.value = false;
    }
  };

  // Создание нового обсуждения
  const createDiscussion = async (discussionData) => {
    loading.value = true;
    try {
      const newDiscussion = {
        id: Date.now(),
        title: discussionData.title,
        content: discussionData.content,
        tags: discussionData.tags || [],
        author: { 
          username: "current_user", 
          id: 999 
        },
        createdAt: new Date().toISOString(),
        commentsCount: 0,
        views: 0,
        comments: []
      };
      
      // Создаем новый массив и сохраняем
      const updatedDiscussions = [newDiscussion, ...discussions.value];
      discussions.value = updatedDiscussions;
      
      // Сохраняем в localStorage
      saveDiscussionsToStorage(updatedDiscussions);
      
      return newDiscussion;
    } catch (err) {
      error.value = 'Ошибка создания обсуждения';
      console.error('Ошибка создания:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Добавление комментария
  const addComment = async (discussionId, commentData) => {
    try {
      const newComment = {
        id: Date.now(),
        ...commentData,
        author: { username: "current_user", id: 999 },
        createdAt: new Date().toISOString(),
        likes: 0
      };

      // Находим обсуждение для обновления
      const discussionIndex = discussions.value.findIndex(d => d.id === parseInt(discussionId));
      if (discussionIndex !== -1) {
        const updatedDiscussion = { 
          ...discussions.value[discussionIndex],
          comments: [...(discussions.value[discussionIndex].comments || []), newComment],
          commentsCount: (discussions.value[discussionIndex].commentsCount || 0) + 1
        };
        
        // Обновляем текущее обсуждение если оно открыто
        if (currentDiscussion.value && currentDiscussion.value.id === parseInt(discussionId)) {
          currentDiscussion.value = updatedDiscussion;
        }
        
        // Создаем новый массив и сохраняем
        const updatedDiscussions = [...discussions.value];
        updatedDiscussions[discussionIndex] = updatedDiscussion;
        discussions.value = updatedDiscussions;
        
        // Сохраняем в localStorage
        saveDiscussionsToStorage(updatedDiscussions);
      }

      return newComment;
    } catch (err) {
      error.value = 'Ошибка добавления комментария';
      throw err;
    }
  };

  // Поиск обсуждений
  const searchDiscussions = async (query) => {
    loading.value = true;
    try {
      const filtered = discussions.value.filter(discussion => 
        discussion.title.toLowerCase().includes(query.toLowerCase()) ||
        discussion.content.toLowerCase().includes(query.toLowerCase()) ||
        (discussion.tags && discussion.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())))
      );
      return filtered;
    } catch (err) {
      error.value = 'Ошибка поиска';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Очистка всех данных (для отладки)
  const clearAllData = () => {
    discussions.value = loadDiscussionsFromStorage(); // Сбрасываем к начальным данным
    localStorage.removeItem('f1-forum-discussions');
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
    searchDiscussions,
    clearAllData
  };
});