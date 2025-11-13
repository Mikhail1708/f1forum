const Comment = require('../models/Comment');

const commentController = {
  // Получение комментариев для темы
  async getCommentsByTopic(req, res) {
    try {
      const { topicId } = req.params;
      console.log('Getting comments for topic:', topicId);
      
      const comments = await Comment.findByTopicId(topicId);
      console.log(`Found ${comments.length} comments for topic ${topicId}`);
      
      res.json(comments);
    } catch (error) {
      console.error('Get comments error:', error);
      res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
  },

  // Создание комментария
  async createComment(req, res) {
    try {
      console.log('=== CREATE COMMENT START ===');
      console.log('Request body:', req.body);
      console.log('User ID:', req.userId);

      const { content, topic_id, parent_id = null } = req.body;
      const user_id = req.userId;

      if (!content || !topic_id) {
        return res.status(400).json({ error: 'Content and topic_id are required' });
      }

      console.log('Creating comment:', { content, topic_id, user_id, parent_id });

      const comment = await Comment.create({
        content,
        topic_id,
        user_id,
        parent_id
      });

      console.log('✅ Comment created successfully:', comment.id);

      // Получаем обновленный список комментариев
      const comments = await Comment.findByTopicId(topic_id);

      res.status(201).json({
        message: parent_id ? 'Reply created successfully' : 'Comment created successfully',
        comments: comments
      });

    } catch (error) {
      console.error('❌ CREATE COMMENT ERROR:', error);
      res.status(500).json({ 
        error: 'Internal server error: ' + error.message 
      });
    }
  },

  // Создание ответа на комментарий
  async createReply(req, res) {
    try {
      console.log('=== CREATE REPLY START ===');
      console.log('Request body:', req.body);
      console.log('User ID:', req.userId);

      const { content, topic_id, parent_id } = req.body;
      const user_id = req.userId;

      if (!content || !topic_id || !parent_id) {
        return res.status(400).json({ error: 'Content, topic_id and parent_id are required' });
      }

      console.log('Creating reply:', { content, topic_id, user_id, parent_id });

      const reply = await Comment.createReply({
        content,
        topic_id,
        user_id,
        parent_id
      });

      console.log('✅ Reply created successfully:', reply.id);

      // Получаем обновленный список комментариев
      const comments = await Comment.findByTopicId(topic_id);

      res.status(201).json({
        message: 'Reply created successfully',
        comments: comments
      });

    } catch (error) {
      console.error('❌ CREATE REPLY ERROR:', error);
      res.status(500).json({ 
        error: 'Internal server error: ' + error.message 
      });
    }
  },

  // Лайк комментария
  async likeComment(req, res) {
    try {
      const { id } = req.params;
      const user_id = req.userId;

      console.log(`Liking comment ${id} by user ${user_id}`);

      const result = await Comment.likeComment(id, user_id);

      res.json({
        liked: result.liked,
        commentId: id
      });
    } catch (error) {
      console.error('Like comment error:', error);
      res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
  }
};

module.exports = commentController;