// backend/controllers/authController.js
const db = require('../db/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Все поля обязательны для заполнения' });
    }

    try {
        const existingUser = await db.getAsync(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUser) {
            let message = 'Пользователь с таким именем или email уже существует';
            return res.status(409).json({ message });
        }

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const result = await db.runAsync(
            `INSERT INTO users (username, email, password_hash) 
             VALUES (?, ?, ?)`,
            [username, email, passwordHash]
        );

        res.status(201).json({
            message: 'Пользователь успешно зарегистрирован',
            userId: result.id
        });

    } catch (err) {
        console.error('Ошибка при регистрации:', err);
        res.status(500).json({ message: 'Ошибка на сервере при регистрации' });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email и пароль обязательны' });
    }

    try {
        const user = await db.getAsync(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (!user) {
            return res.status(401).json({ message: 'Неверные учетные данные' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Неверные учетные данные' });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Вход выполнен успешно',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });

    } catch (err) {
        console.error('Ошибка при входе:', err);
        res.status(500).json({ message: 'Ошибка сервера при входе' });
    }
};

exports.getProfile = async (req, res) => {
    try {
        // Используем req.user.id из middleware (а не req.userId)
        const user = await db.getAsync(
            'SELECT id, username, email, created_at FROM users WHERE id = ?',
            [req.user.id] // ← ИЗМЕНИЛОСЬ ЗДЕСЬ!
        );

        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        res.json({ user });

    } catch (err) {
        console.error('Ошибка при получении профиля:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};