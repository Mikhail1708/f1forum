const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const adminRoutes = require('./admin');
const moderatorRoutes = require('./moderator');
const reportRoutes = require('./reports');

// Импортируем контроллеры
const { getNextGrandPrix, getUpcomingEvents, getAllGrandPrix } = require('../controllers/grandPrixController');
const backupController = require('../controllers/backupController'); // ← ПЕРЕМЕСТИЛ СЮДА

// Аутентификация
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/profile', auth, authController.getProfile);

// Админские маршруты
router.use('/admin', adminRoutes);

// Модераторские маршруты
router.use('/moderator', moderatorRoutes);

// Публичные маршруты отчетов (только создание жалоб)
router.use('/reports', reportRoutes);

// Гран-при маршруты
router.get('/grand-prix/next', getNextGrandPrix);
router.get('/grand-prix/upcoming', getUpcomingEvents);
router.get('/grand-prix/all', getAllGrandPrix);

// Публичный маршрут для скачивания бэкапов (без авторизации)
router.get('/backup-download/:id', backupController.downloadBackup); // ← ОСТАВИЛ ЗДЕСЬ

// Тестовый маршрут
router.get('/test', (req, res) => {
    res.json({ message: 'F1 Forum API работает!' });
});

module.exports = router;