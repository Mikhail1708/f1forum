// backend/routes/index.js
const express = require('express');
const router = express.Router();

// Импортируем контроллеры
const { register, login, getProfile } = require('../controllers/authController');
const auth = require('../middleware/auth');

// Публичные маршруты аутентификации
router.post('/auth/register', register);
router.post('/auth/login', login);

// Защищенный маршрут (требует аутентификации)
router.get('/auth/profile', auth, getProfile);

// Тестовый маршрут
router.get('/test', (req, res) => {
    res.json({ message: 'F1 Forum API работает!' });
});

module.exports = router;