// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// Public routes
router.post('/login', authController.login);
router.post('/register', authController.register);

// Protected routes
router.get('/me', auth, authController.getMe);
router.post('/logout', auth, authController.logout); // Добавить этот маршрут

module.exports = router;