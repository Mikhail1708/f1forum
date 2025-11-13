const db = require('../db/postgres'); // ИЗМЕНЕНИЕ: используем PostgreSQL

const adminAuth = async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Проверяем, является ли пользователь администратором
    const { rows } = await db.query('SELECT role FROM users WHERE id = $1', [req.userId]);
    const user = rows[0];

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

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

    const { rows } = await db.query('SELECT role, is_moderator FROM users WHERE id = $1', [req.userId]);
    const user = rows[0];

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