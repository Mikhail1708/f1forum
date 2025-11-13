const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const auth = require('../middleware/auth');

// Отладочный middleware для логирования запросов
router.use((req, res, next) => {
  console.log(`📨 COMMENTS ${req.method} ${req.path}`, {
    params: req.params,
    query: req.query,
    body: req.body,
    userId: req.userId
  });
  next();
});

// Получение комментариев для темы
router.get('/topic/:topicId', commentController.getCommentsByTopic);

// Создание комментария
router.post('/', auth, commentController.createComment);

// Создание ответа на комментарий
router.post('/reply', auth, commentController.createReply);

// Обновление комментария
router.put('/:id', auth, commentController.updateComment);

// Удаление комментария
router.delete('/:id', auth, commentController.deleteComment);

// Лайк комментария
router.post('/:id/like', auth, commentController.likeComment);

module.exports = router;