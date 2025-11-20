// backend/routes/moderator.js
const express = require('express');
const router = express.Router();
const moderatorController = require('../controllers/moderatorController');
const { requireAdminOrModerator } = require('../middleware/adminAuth');

// Все роуты требуют прав модератора или администратора
router.use(requireAdminOrModerator);

// Статистика
router.get('/stats', moderatorController.getStats);

// Управление темами - модераторы и админы
router.get('/topics/pending', moderatorController.getPendingTopics);
router.post('/topics/:topicId/approve', moderatorController.approveTopic);
router.post('/topics/:topicId/reject', moderatorController.rejectTopic);

// Управление комментариями - модераторы и админы
router.get('/comments/pending', moderatorController.getPendingComments);
router.post('/comments/:commentId/approve', moderatorController.approveComment);
router.delete('/comments/:commentId', moderatorController.deleteComment);

// Управление пользователями - модераторы и админы
router.get('/users', moderatorController.getUsers);
router.post('/users/:userId/warn', moderatorController.warnUser);
router.post('/users/:userId/suspend', moderatorController.suspendUser);
router.post('/users/:userId/unsuspend', moderatorController.unsuspendUser);

// Управление жалобами - модераторы и админы
router.get('/reports/pending', moderatorController.getPendingReports);
router.get('/reports/resolved', moderatorController.getResolvedReports);
router.post('/reports/:reportId/resolve', moderatorController.resolveReport);

module.exports = router;