const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const adminRoutes = require('./admin');
// Импортируем контроллеры
const { register, login, getProfile } = require('../controllers/authController');
const { getNextGrandPrix, getUpcomingEvents, getAllGrandPrix } = require('../controllers/grandPrixController');

// Аутентификация

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/profile', authenticateToken, authController.getProfile);
router.use('/admin', adminRoutes);
// Гран-при маршруты
router.get('/grand-prix/next', getNextGrandPrix);
router.get('/grand-prix/upcoming', getUpcomingEvents);
router.get('/grand-prix/all', getAllGrandPrix);


// Тестовый маршрут
router.get('/test', (req, res) => {
    res.json({ message: 'F1 Forum API работает!' });
});

module.exports = router;