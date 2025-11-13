const express = require('express');
const router = express.Router();
const topicController = require('../controllers/topicController');
const auth = require('../middleware/auth'); // Теперь auth будет определен

// Получить все обсуждения (публичный доступ)
router.get('/', topicController.getAllTopics);

// Получить обсуждение по ID (публичный доступ)
router.get('/:id', topicController.getTopicById);

// Создать новое обсуждение (требует авторизации)
router.post('/', auth, topicController.createTopic);

// Лайкнуть обсуждение (требует авторизации)
router.post('/:id/like', auth, topicController.likeTopic);

module.exports = router;