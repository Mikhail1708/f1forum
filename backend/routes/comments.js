const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const auth = require('../middleware/auth');

// Получение комментариев для темы
router.get('/topic/:topicId', commentController.getCommentsByTopic);

// Создание комментария
router.post('/', auth, commentController.createComment);

// Создание ответа на комментарий
router.post('/reply', auth, commentController.createReply);

// Лайк комментария
router.post('/:id/like', auth, commentController.likeComment);

module.exports = router;