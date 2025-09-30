const express = require('express');
const commentController = require('../controllers/commentController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/topic/:topicId', optionalAuth, commentController.getCommentsByTopic);
router.post('/', authenticateToken, commentController.createComment);

module.exports = router;