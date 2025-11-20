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

const requireAdminOrModerator = async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { rows } = await db.query(
      'SELECT id, username, email, role, status FROM users WHERE id = $1', 
      [req.userId]
    );
    
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Проверяем, является ли пользователь администратором ИЛИ модератором
    if (user.role !== 'admin' && user.role !== 'moderator') {
      return res.status(403).json({ error: 'Admin or moderator access required' });
    }

    req.moderatorUser = user;
    next();
  } catch (error) {
    console.error('Admin/Moderator auth error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const moderatorAuth = async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { rows } = await db.query(
      'SELECT id, username, email, role, status FROM users WHERE id = $1', 
      [req.userId]
    );
    
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Проверяем, является ли пользователь модератором
    if (user.role !== 'moderator') {
      return res.status(403).json({ error: 'Moderator access required' });
    }

    req.moderatorUser = user;
    next();
  } catch (error) {
    console.error('Moderator auth error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  adminAuth,
  requireAdminOrModerator,
  moderatorAuth
};