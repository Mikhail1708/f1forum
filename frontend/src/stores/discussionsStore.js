import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '../services/api';

export const useDiscussionsStore = defineStore('discussions', () => {
  const discussions = ref([]);
  const currentDiscussion = ref(null);
  const loading = ref(false);
  const error = ref(null);

  // ПРОСТАЯ ПРОВЕРКА АВТОРСТВА
  const isCurrentUserAuthor = (item) => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) return false;
      
      const currentUser = JSON.parse(userData);
      
      console.log('🔍 ПРОВЕРКА АВТОРСТВА:', {
        itemType: item.title ? 'discussion' : 'comment',
        itemAuthor: item.author,
        currentUser: currentUser,
        authorId: item.author?.id,
        userId: currentUser.id,
        isEqual: item.author?.id === currentUser.id
      });
      
      return item.author?.id === currentUser.id;
    } catch (error) {
      console.error('❌ Ошибка проверки авторства:', error);
      return false;
    }
  };

  // Загрузка всех обсуждений
  const fetchDiscussions = async () => {
    loading.value = true;
    error.value = null;
    try {
      console.log('🔄 Fetching discussions...');
      const response = await api.get('/topics');
      discussions.value = response.data.topics || response.data;
      console.log('✅ Discussions loaded:', discussions.value.length);
    } catch (err) {
      console.error('❌ Fetch discussions error:', err);
      error.value = err.response?.data?.error || 'Ошибка загрузки обсуждений';
    } finally {
      loading.value = false;
    }
  };

  // Загрузка одного обсуждения
  const fetchDiscussion = async (id) => {
    if (!id) return;
    
    loading.value = true;
    error.value = null;
    try {
      console.log('🔄 Fetching discussion:', id);
      const response = await api.get(`/topics/${id}`);
      currentDiscussion.value = response.data.topic || response.data;
      console.log('✅ Discussion loaded:', currentDiscussion.value);
    } catch (err) {
      console.error('❌ Fetch discussion error:', err);
      error.value = err.response?.data?.error || 'Ошибка загрузки обсуждения';
    } finally {
      loading.value = false;
    }
  };

  // Лайк обсуждения
  const likeDiscussion = async (discussionId) => {
    try {
      console.log('🔄 Liking discussion:', discussionId);
      const response = await api.post(`/topics/${discussionId}/like`);
      const { liked, likes } = response.data;

      // Обновляем в текущем обсуждении
      if (currentDiscussion.value?.id === discussionId) {
        currentDiscussion.value.likes = likes;
        currentDiscussion.value.liked = liked;
      }

      // Обновляем в списке обсуждений
      const discussion = discussions.value.find(d => d.id === discussionId);
      if (discussion) {
        discussion.likes = likes;
        discussion.liked = liked;
      }
      
      console.log('✅ Discussion liked, new count:', likes);
      
    } catch (err) {
      console.error('❌ Like discussion error:', err);
      error.value = err.response?.data?.error || 'Ошибка при лайке обсуждения';
      throw err;
    }
  };

  // Создание обсуждения
  const createDiscussion = async (discussionData) => {
    try {
      console.log('🔄 Creating discussion:', discussionData);
      await api.post('/topics', discussionData);
      await fetchDiscussions();
      console.log('✅ Discussion created');
    } catch (err) {
      console.error('❌ Create discussion error:', err);
      error.value = err.response?.data?.error || 'Ошибка создания обсуждения';
      throw err;
    }
  };

  // Обновление обсуждения
  const updateDiscussion = async (discussionId, discussionData) => {
    try {
      console.log('🔄 Updating discussion:', discussionId, discussionData);
      const response = await api.put(`/topics/${discussionId}`, discussionData);
      
      if (currentDiscussion.value?.id === discussionId) {
        currentDiscussion.value = { ...currentDiscussion.value, ...discussionData };
      }
      
      const discussionIndex = discussions.value.findIndex(d => d.id === discussionId);
      if (discussionIndex !== -1) {
        discussions.value[discussionIndex] = { ...discussions.value[discussionIndex], ...discussionData };
      }
      
      console.log('✅ Discussion updated');
      return response.data;
    } catch (err) {
      console.error('❌ Update discussion error:', err);
      error.value = err.response?.data?.error || 'Ошибка редактирования обсуждения';
      throw err;
    }
  };

  // Удаление обсуждения
  const deleteDiscussion = async (discussionId) => {
    try {
      console.log('🔄 Deleting discussion:', discussionId);
      await api.delete(`/topics/${discussionId}`);
      
      // Удаляем из локального списка
      discussions.value = discussions.value.filter(d => d.id !== discussionId);
      
      console.log('✅ Discussion deleted');
    } catch (err) {
      console.error('❌ Delete discussion error:', err);
      error.value = err.response?.data?.error || 'Ошибка удаления обсуждения';
      throw err;
    }
  };

  // Добавление комментария
  const addComment = async (discussionId, commentData) => {
    try {
      console.log('🔄 Adding comment:', { discussionId, commentData });
      await api.post('/comments', {
        ...commentData,
        topic_id: discussionId
      });
      await fetchDiscussion(discussionId);
      console.log('✅ Comment added');
    } catch (err) {
      console.error('❌ Add comment error:', err);
      error.value = err.response?.data?.error || 'Ошибка добавления комментария';
      throw err;
    }
  };

  // Обновление комментария
  const updateComment = async (commentId, commentData) => {
    try {
      console.log('🔄 Updating comment:', commentId, commentData);
      await api.put(`/comments/${commentId}`, commentData);
      await fetchDiscussion(currentDiscussion.value?.id);
      console.log('✅ Comment updated');
    } catch (err) {
      console.error('❌ Update comment error:', err);
      error.value = err.response?.data?.error || 'Ошибка редактирования комментария';
      throw err;
    }
  };

  // Удаление комментария
  const deleteComment = async (commentId) => {
    try {
      console.log('🔄 Deleting comment:', commentId);
      await api.delete(`/comments/${commentId}`);
      
      // Удаляем локально для мгновенного обновления UI
      removeCommentLocally(commentId);
      
      console.log('✅ Comment deleted');
    } catch (err) {
      console.error('❌ Delete comment error:', err);
      error.value = err.response?.data?.error || 'Ошибка удаления комментария';
      throw err;
    }
  };

  // Добавление ответа
  const addReply = async (commentId, replyData) => {
    try {
      console.log('🔄 Adding reply:', { commentId, replyData });
      await api.post('/comments/reply', {
        ...replyData,
        parent_id: commentId,
        topic_id: currentDiscussion.value?.id
      });
      await fetchDiscussion(currentDiscussion.value?.id);
      console.log('✅ Reply added');
    } catch (err) {
      console.error('❌ Add reply error:', err);
      try {
        console.log('🔄 Trying fallback for reply...');
        await api.post('/comments', {
          ...replyData,
          parent_id: commentId,
          topic_id: currentDiscussion.value?.id
        });
        await fetchDiscussion(currentDiscussion.value?.id);
        console.log('✅ Reply added via fallback');
      } catch (fallbackErr) {
        console.error('❌ Fallback also failed:', fallbackErr);
        error.value = err.response?.data?.error || 'Ошибка добавления ответа';
        throw err;
      }
    }
  };

  // Лайк комментария
  const likeComment = async (commentId) => {
    try {
      console.log('🔄 Liking comment:', commentId);
      await api.post(`/comments/${commentId}/like`);
      await fetchDiscussion(currentDiscussion.value?.id);
      console.log('✅ Comment liked');
    } catch (err) {
      console.error('❌ Like comment error:', err);
      error.value = err.response?.data?.error || 'Ошибка при лайке комментария';
      throw err;
    }
  };

  // Вспомогательная функция для локального удаления комментария
  const removeCommentLocally = (commentId) => {
    if (!currentDiscussion.value?.comments) return;
    
    console.log('🔄 Removing comment locally:', commentId);
    
    // Ищем в основных комментариях
    const commentIndex = currentDiscussion.value.comments.findIndex(
      comment => comment.id === commentId
    );
    
    if (commentIndex !== -1) {
      currentDiscussion.value.comments.splice(commentIndex, 1);
      console.log('✅ Comment removed locally from main comments');
      return;
    }
    
    // Ищем в ответах
    currentDiscussion.value.comments.forEach(comment => {
      if (comment.replies) {
        const replyIndex = comment.replies.findIndex(reply => reply.id === commentId);
        if (replyIndex !== -1) {
          comment.replies.splice(replyIndex, 1);
          console.log('✅ Comment removed locally from replies');
        }
      }
    });
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
    updateDiscussion,
    deleteDiscussion,
    addComment,
    updateComment,
    deleteComment,
    addReply,
    likeDiscussion,
    likeComment,
    clearCurrentDiscussion,
    isCurrentUserAuthor,
    removeCommentLocally
  };
});