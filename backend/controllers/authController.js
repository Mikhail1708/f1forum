// backend/controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Генерация JWT токена
const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Регистрация
const register = async (req, res) => {
    try {
        const { username, email, password, favorite_team, favorite_driver } = req.body;

        // Проверяем, существует ли пользователь
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
        }

        // Создаем пользователя
        const user = await User.create({
            username,
            email,
            password,
            favorite_team,
            favorite_driver
        });

        // Генерируем токен
        const token = generateToken(user.id);

        res.status(201).json({
            message: 'Пользователь успешно зарегистрирован',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                favorite_team: user.favorite_team,
                favorite_driver: user.favorite_driver
            },
            token
        });
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        res.status(500).json({ error: 'Ошибка сервера при регистрации' });
    }
};

// Вход
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Ищем пользователя
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(400).json({ error: 'Неверный email или пароль' });
        }

        // Проверяем пароль
        const isPasswordValid = await User.verifyPassword(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(400).json({ error: 'Неверный email или пароль' });
        }

        // Генерируем токен
        const token = generateToken(user.id);

        res.json({
            message: 'Вход выполнен успешно',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                favorite_team: user.favorite_team,
                favorite_driver: user.favorite_driver
            },
            token
        });
    } catch (error) {
        console.error('Ошибка входа:', error);
        res.status(500).json({ error: 'Ошибка сервера при входе' });
    }
};

// Получение профиля
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json({ user });
    } catch (error) {
        console.error('Ошибка получения профиля:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
};

module.exports = {
    register,
    login,
    getProfile
};