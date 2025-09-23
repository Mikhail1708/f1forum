// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const db = require('../db/db');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'Токен доступа отсутствует' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Сохраняем только ID пользователя
        req.userId = decoded.userId; // ← ТАК МОЖНО СДЕЛАТЬ
        next();
        
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ error: 'Неверный токен' });
    }
};

module.exports = auth;