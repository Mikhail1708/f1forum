const express = require('express');
const router = express.Router();
const topicController = require('../controllers/topicController');
const auth = require('../middleware/auth');

// Отладочный middleware для логирования запросов
router.use((req, res, next) => {
  console.log(`📨 TOPICS ${req.method} ${req.path}`, {
    params: req.params,
    query: req.query,
    body: req.body,
    userId: req.userId
  });
  next();
});

// Получить все обсуждения (публичный доступ)
router.get('/', topicController.getAllTopics);

// Получить обсуждение по ID (публичный доступ)
router.get('/:id', topicController.getTopicById);

// Создать новое обсуждение (требует авторизации)
router.post('/', auth, topicController.createTopic);

// Обновить обсуждение (требует авторизации)
router.put('/:id', auth, topicController.updateTopic);

// Удалить обсуждение (требует авторизации)
router.delete('/:id', auth, topicController.deleteTopic);

// Лайкнуть обсуждение (требует авторизации)
router.post('/:id/like', auth, topicController.likeTopic);

module.exports = router;