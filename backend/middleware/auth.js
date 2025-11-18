// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const db = require('../db/postgres');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token, authorization denied' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token, authorization denied' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      
      // Проверяем, существует ли пользователь в базе
      const { rows } = await db.query(
        'SELECT id, username, email, role, status FROM users WHERE id = $1',
        [decoded.userId]
      );
      
      if (rows.length === 0) {
        return res.status(401).json({ error: 'User not found' });
      }

      const user = rows[0];
      
      if (user.status === 'banned') {
        return res.status(401).json({ error: 'User account is banned' });
      }

      req.userId = user.id;
      req.user = user;
      next();
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      return res.status(401).json({ error: 'Token is not valid' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Server error in authentication' });
  }
};

module.exports = auth;