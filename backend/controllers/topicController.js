const Topic = require('../models/Topic');

const topicController = {
  async getAllTopics(req, res) {
    try {
      const topics = await Topic.findAll();
      res.json(topics);
    } catch (error) {
      console.error('Get topics error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getTopicById(req, res) {
    try {
      const { id } = req.params;
      
      // Увеличиваем счетчик просмотров
      await Topic.incrementViews(id);
      
      const topic = await Topic.findById(id);
      if (!topic) {
        return res.status(404).json({ error: 'Topic not found' });
      }
      
      res.json(topic);
    } catch (error) {
      console.error('Get topic error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async createTopic(req, res) {
    try {
      const { title, content, category_id } = req.body;
      const user_id = req.userId; // Из middleware аутентификации

      if (!title || !content || !category_id) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      const topic = await Topic.create({
        title,
        content,
        category_id,
        user_id
      });

      res.status(201).json({
        message: 'Topic created successfully',
        topic
      });
    } catch (error) {
      console.error('Create topic error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = topicController;