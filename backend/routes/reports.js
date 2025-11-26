// backend/routes/reports.js
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const auth = require('../middleware/auth');

// Создание жалобы (доступно всем авторизованным пользователям)
router.post('/', auth, reportController.createReport);

// Получение жалоб (только для модераторов/админов)
router.get('/', auth, require('../middleware/adminAuth').requireAdminOrModerator, reportController.getReports);

// Обработка жалобы (только для модераторов/админов)
router.post('/:id/resolve', auth, require('../middleware/adminAuth').requireAdminOrModerator, reportController.resolveReport);

module.exports = router;