// backend/routes/reports.js
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const auth = require('../middleware/auth');

// Создание жалобы (доступно всем авторизованным пользователям)
router.post('/', auth, reportController.createReport);

module.exports = router;