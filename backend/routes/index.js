const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Импортируем контроллеры
const { register, login, getProfile } = require('../controllers/authController');
const { getNextGrandPrix, getUpcomingEvents, getAllGrandPrix } = require('../controllers/grandPrixController');

// Аутентификация
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/profile', auth, getProfile);

// Гран-при маршруты
router.get('/grand-prix/next', getNextGrandPrix);
router.get('/grand-prix/upcoming', getUpcomingEvents);
router.get('/grand-prix/all', getAllGrandPrix);

// Тестовый маршрут
router.get('/test', (req, res) => {
    res.json({ message: 'F1 Forum API работает!' });
});

module.exports = router;