const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const authMiddleware = require('../middleware/auth');

router.get('/topic/:topicId', commentController.getCommentsByTopic);
router.post('/', authMiddleware, commentController.createComment);

module.exports = router;