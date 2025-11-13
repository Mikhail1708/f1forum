const Topic = require('../models/Topic');
const Comment = require('../models/Comment');
const db = require('../db/postgres');

const topicController = {
  async getAllTopics(req, res) {
    try {
      console.log('Getting all topics...');
      const topics = await Topic.findAll();
      console.log(`Found ${topics.length} topics`);
      res.json(topics);
    } catch (error) {
      console.error('Get topics error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getTopicById(req, res) {
    try {
      const { id } = req.params;
      
      // Проверяем валидность ID
      const topicId = parseInt(id);
      if (isNaN(topicId) || topicId <= 0) {
        return res.status(400).json({ error: 'Invalid topic ID' });
      }

      console.log(`Getting topic by ID: ${topicId}`);
      
      // Увеличиваем счетчик просмотров
      await Topic.incrementViews(topicId);
      
      const topic = await Topic.findById(topicId);
      if (!topic) {
        console.log(`Topic ${topicId} not found`);
        return res.status(404).json({ error: 'Topic not found' });
      }
      
      // Получаем комментарии для этого топика
      const comments = await Comment.findByTopicId(topicId);
      topic.comments = comments;
      
      console.log(`Topic ${topicId} found with ${comments.length} comments`);
      res.json(topic);
    } catch (error) {
      console.error('Get topic error:', error);
      res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
  },

  async createTopic(req, res) {
    try {
      console.log('=== CREATE TOPIC DEBUG ===');
      console.log('Request body:', req.body);
      console.log('User ID from auth:', req.userId);

      const { title, content, tags = [] } = req.body;
      const user_id = req.userId;

      if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
      }

      // Проверяем валидность user_id
      const userId = parseInt(user_id);
      if (isNaN(userId) || userId <= 0) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      console.log('Creating topic:', { title, content, user_id: userId, tags });

      const topic = await Topic.create({
        title,
        content,
        user_id: userId,
        tags: Array.isArray(tags) ? tags : [tags].filter(Boolean)
      });

      console.log('Topic created in DB:', topic);

      // Получаем полную информацию о топике
      const fullTopic = await Topic.findById(topic.id);
      console.log('Full topic from DB:', fullTopic);

      res.status(201).json({
        message: 'Topic created successfully',
        topic: fullTopic
      });

    } catch (error) {
      console.error('Create topic error:', error);
      res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
  },

 // Обновление обсуждения
async updateTopic(req, res) {
  try {
    const { id } = req.params;
    const { title, content, tags = [] } = req.body;
    const user_id = req.userId;

    // Проверяем валидность ID
    const topicId = parseInt(id);
    const userId = parseInt(user_id);
    
    if (isNaN(topicId) || topicId <= 0) {
      return res.status(400).json({ error: 'Invalid topic ID' });
    }

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    console.log(`Updating topic ${topicId} by user ${userId}`);

    // Проверяем, существует ли топик и принадлежит ли пользователю
    const existingTopic = await Topic.findById(topicId);
    if (!existingTopic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    if (existingTopic.user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this topic' });
    }

    // Обновляем топик через модель
    const updatedTopic = await Topic.update(topicId, {
      title,
      content,
      tags
    });

    res.json({
      message: 'Topic updated successfully',
      topic: updatedTopic
    });

  } catch (error) {
    console.error('Update topic error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
},

// Удаление обсуждения
async deleteTopic(req, res) {
  try {
    const { id } = req.params;
    const user_id = req.userId;

    // Проверяем валидность ID
    const topicId = parseInt(id);
    const userId = parseInt(user_id);
    
    if (isNaN(topicId) || topicId <= 0) {
      return res.status(400).json({ error: 'Invalid topic ID' });
    }

    console.log(`🗑️ Deleting topic ${topicId} by user ${userId}`);

    // Проверяем, существует ли топик
    const existingTopic = await Topic.findById(topicId);
    if (!existingTopic) {
      console.log(`❌ Topic ${topicId} not found`);
      return res.status(404).json({ error: 'Topic not found' });
    }

    // Проверяем права доступа
    if (existingTopic.user_id !== userId) {
      console.log(`❌ User ${userId} not authorized to delete topic ${topicId}`);
      return res.status(403).json({ error: 'Not authorized to delete this topic' });
    }

    console.log(`✅ Authorization passed, deleting topic ${topicId}`);

    // Удаляем топик через модель
    const deletedTopic = await Topic.delete(topicId);
    
    console.log(`✅ Topic ${topicId} deleted successfully`);

    res.json({ 
      message: 'Topic deleted successfully',
      deletedTopic: deletedTopic
    });

  } catch (error) {
    console.error('❌ Delete topic error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
},

  async likeTopic(req, res) {
    try {
      const { id } = req.params;
      const user_id = req.userId;

      // Проверяем валидность ID
      const topicId = parseInt(id);
      const userId = parseInt(user_id);
      
      if (isNaN(topicId) || topicId <= 0) {
        return res.status(400).json({ error: 'Invalid topic ID' });
      }
      if (isNaN(userId) || userId <= 0) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      console.log(`Liking topic ${topicId} by user ${userId}`);

      const result = await Topic.likeTopic(topicId, userId);
      const likesCount = await Topic.getLikesCount(topicId);

      console.log(`Topic ${topicId} liked: ${result.liked}, total likes: ${likesCount}`);

      res.json({
        liked: result.liked,
        likes: likesCount
      });
    } catch (error) {
      console.error('Like topic error:', error);
      res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
  }
};

module.exports = topicController;