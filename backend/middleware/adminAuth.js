// backend/middleware/adminAuth.js
const db = require('../db/postgres');

const adminAuth = async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Проверяем, является ли пользователь администратором
    const { rows } = await db.query(
      'SELECT id, username, email, role, status FROM users WHERE id = $1', 
      [req.userId]
    );
    
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.adminUser = user;
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ИСПРАВЛЕНО: экспортируем напрямую, а не через объект
module.exports = adminAuth;