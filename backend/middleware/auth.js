// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const db = require('../db/postgres');

const auth = async (req, res, next) => {
  try {
    console.log('🔐 Auth middleware - Headers:', req.headers);
    
    const authHeader = req.header('Authorization');
    console.log('🔐 Auth header:', authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No Bearer token found');
      return res.status(401).json({ error: 'No token, authorization denied' });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('🔐 Token:', token.substring(0, 20) + '...');
    
    if (!token) {
      console.log('❌ Empty token');
      return res.status(401).json({ error: 'No token, authorization denied' });
    }

    try {
      // Проверяем JWT токен
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      console.log('🔐 Decoded token:', decoded);
      
      if (!decoded.userId) {
        console.log('❌ No userId in token');
        return res.status(401).json({ error: 'Invalid token structure' });
      }

      // Проверяем, существует ли пользователь в базе
      const { rows } = await db.query(
        'SELECT id, username, email, role, status FROM users WHERE id = $1',
        [decoded.userId]
      );
      
      if (rows.length === 0) {
        console.log('❌ User not found in database:', decoded.userId);
        return res.status(401).json({ error: 'User not found' });
      }

      const user = rows[0];
      console.log('🔐 Found user:', { id: user.id, username: user.username, role: user.role });
      
      if (user.status === 'banned') {
        console.log('❌ User is banned:', user.id);
        return res.status(401).json({ error: 'User account is banned' });
      }

      // Устанавливаем userId и user в req
      req.userId = user.id;
      req.user = user;
      
      console.log('✅ Authentication successful for user:', user.username);
      
      next();
    } catch (jwtError) {
      console.error('❌ JWT verification error:', jwtError.message);
      return res.status(401).json({ error: 'Token is not valid' });
    }
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    res.status(500).json({ error: 'Server error in authentication' });
  }
};

module.exports = auth;