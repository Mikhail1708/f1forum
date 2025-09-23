// backend/routes/index.js
// backend/routes/index.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
// Импортируем контроллеры
const { register, login, getProfile } = require('../controllers/authController');
console.log('Register:', register);
console.log('Login:', login); 
console.log('GetProfile:', getProfile);


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