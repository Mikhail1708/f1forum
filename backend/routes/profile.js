// backend/routes/profile.js
const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const auth = require('../middleware/auth');

// Все маршруты требуют аутентификации
router.use(auth);

// Основные маршруты профиля
router.get('/', profileController.getProfile);
router.put('/', profileController.updateProfile);
router.post('/change-password', profileController.changePassword);
router.post('/verify-email', profileController.verifyEmail);

// Контент пользователя
router.get('/topics', profileController.getUserTopics);
router.get('/comments', profileController.getUserComments);
router.get('/warnings', profileController.getUserWarnings);

// Уведомления
router.get('/notifications', profileController.getNotifications);
router.patch('/notifications/:notificationId/read', profileController.markNotificationAsRead);
router.patch('/notifications/read-all', profileController.markAllNotificationsAsRead);

module.exports = router;