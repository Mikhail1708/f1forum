const express = require('express');
const topicController = require('../controllers/topicController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, topicController.getAllTopics);
router.get('/:id', optionalAuth, topicController.getTopicById);
router.post('/', authenticateToken, topicController.createTopic);

module.exports = router;