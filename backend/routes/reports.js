// backend/routes/reports.js
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const auth = require('../middleware/auth');
const { requireAdminOrModerator } = require('../middleware/adminAuth'); // ИСПРАВЛЕННЫЙ ИМПОРТ

// Отладочный middleware
router.use((req, res, next) => {
  console.log(`🚩 REPORTS ${req.method} ${req.path}`, {
    params: req.params,
    query: req.query,
    body: req.body,
    userId: req.userId
  });
  next();
});

// Создать жалобу (доступно всем авторизованным)
router.post('/', auth, reportController.createReport);

// Получить жалобы (только для модераторов и админов)
router.get('/', auth, requireAdminOrModerator, reportController.getReports);

// Обработать жалобу (только для модераторов и админов)
router.patch('/:id/resolve', auth, requireAdminOrModerator, reportController.resolveReport);

module.exports = router;