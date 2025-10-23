const db = require('../db/db');

const adminAuth = async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Проверяем, является ли пользователь администратором
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT role FROM users WHERE id = ?', [req.userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Если нужны дополнительные middleware, добавьте их здесь
const requireAdminOrModerator = async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await new Promise((resolve, reject) => {
      db.get('SELECT role, is_moderator FROM users WHERE id = ?', [req.userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user || (user.role !== 'admin' && !user.is_moderator)) {
      return res.status(403).json({ error: 'Admin or moderator access required' });
    }

    next();
  } catch (error) {
    console.error('Admin/Moderator auth error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  adminAuth,
  requireAdminOrModerator
};