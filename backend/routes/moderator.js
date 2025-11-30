// backend/routes/moderator.js
const express = require('express');
const router = express.Router();
const moderatorController = require('../controllers/moderatorController');
const reportController = require('../controllers/reportController');
const { requireAdminOrModerator } = require('../middleware/adminAuth');
const auth = require('../middleware/auth');

// Все роуты требуют прав модератора или администратора
router.use(auth);
router.use(requireAdminOrModerator);

// Статистика
router.get('/stats', moderatorController.getStats);

// Управление темами
router.get('/topics/pending', moderatorController.getPendingTopics);
router.post('/topics/:topicId/approve', moderatorController.approveTopic);
router.post('/topics/:topicId/reject', moderatorController.rejectTopic);

// Управление комментариями
router.get('/comments/pending', moderatorController.getPendingComments);
router.post('/comments/:commentId/approve', moderatorController.approveComment);
router.delete('/comments/:commentId', moderatorController.deleteComment);

// Управление пользователями
router.get('/users', moderatorController.getUsers);
router.post('/users/:userId/warn', moderatorController.warnUser);
router.post('/users/:userId/suspend', moderatorController.suspendUser);
router.post('/users/:userId/unsuspend', moderatorController.unsuspendUser);

// Управление жалобами
router.get('/reports', moderatorController.getReports);
router.get('/reports/stats', moderatorController.getReportsStats);
router.get('/reports/:reportId', moderatorController.getReportDetails);

// ИСПРАВЛЕНИЕ: Добавляем недостающие маршруты для resolve
router.post('/reports/:reportId/resolve', moderatorController.resolveReport);
router.put('/reports/:reportId/resolution', moderatorController.updateReportResolution);
router.post('/reports/:reportId/notes', moderatorController.addReportNote);
router.delete('/reports/notes/:noteId', moderatorController.deleteReportNote);

// Экспорт отчетов в PDF
router.get('/reports/export/pdf', reportController.generateReportsPDF);

module.exports = router;