const express = require('express');
const router = express.Router();
const topicController = require('../controllers/topicController');
const authMiddleware = require('../middleware/auth');

router.get('/', topicController.getAllTopics);
router.get('/:id', topicController.getTopicById);
router.post('/', authMiddleware, topicController.createTopic);

module.exports = router;