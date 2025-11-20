// backend/routes/topics.js
const express = require('express');
const router = express.Router();
const topicController = require('../controllers/topicController');
const auth = require('../middleware/auth');

// Публичные маршруты
router.get('/', topicController.getTopics);
router.get('/:id', topicController.getTopicById);

// Защищенные маршруты
router.post('/', auth, topicController.createTopic);
router.put('/:id', auth, topicController.updateTopic);
router.delete('/:id', auth, topicController.deleteTopic);
router.patch('/:id/views', topicController.incrementViews);

module.exports = router;