const Comment = require('../models/Comment');

const commentController = {
  async getCommentsByTopic(req, res) {
    try {
      const { topicId } = req.params;
      const comments = await Comment.findByTopicId(topicId);
      res.json(comments);
    } catch (error) {
      console.error('Get comments error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async createComment(req, res) {
    try {
      const { content, topic_id, parent_id } = req.body;
      const user_id = req.userId;

      if (!content || !topic_id) {
        return res.status(400).json({ error: 'Content and topic_id are required' });
      }

      const comment = await Comment.create({
        content,
        topic_id,
        user_id,
        parent_id
      });

      res.status(201).json({
        message: 'Comment created successfully',
        comment
      });
    } catch (error) {
      console.error('Create comment error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = commentController;