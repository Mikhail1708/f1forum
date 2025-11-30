// backend/middleware/adminAuth.js
const db = require('../db/postgres');

const adminAuth = async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ 
        success: false,
        error: 'Требуется аутентификация' 
      });
    }

    // Проверяем, является ли пользователь администратором
    const { rows } = await db.query(
      'SELECT id, username, email, role, status FROM users WHERE id = $1', 
      [req.userId]
    );
    
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'Пользователь не найден' 
      });
    }

    if (user.status === 'suspended' || user.status === 'banned') {
      return res.status(403).json({ 
        success: false,
        error: 'Ваш аккаунт заблокирован' 
      });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        error: 'Требуются права администратора' 
      });
    }

    req.adminUser = user;
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Внутренняя ошибка сервера' 
    });
  }
};

const requireAdminOrModerator = async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ 
        success: false,
        error: 'Требуется аутентификация' 
      });
    }

    const { rows } = await db.query(
      'SELECT id, username, email, role, status FROM users WHERE id = $1', 
      [req.userId]
    );
    
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'Пользователь не найден' 
      });
    }

    if (user.status === 'suspended' || user.status === 'banned') {
      return res.status(403).json({ 
        success: false,
        error: 'Ваш аккаунт заблокирован' 
      });
    }

    // Проверяем, является ли пользователь администратором ИЛИ модератором
    if (user.role !== 'admin' && user.role !== 'moderator') {
      return res.status(403).json({ 
        success: false,
        error: 'Требуются права администратора или модератора' 
      });
    }

    req.moderatorUser = user;
    next();
  } catch (error) {
    console.error('Admin/Moderator auth error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Внутренняя ошибка сервера' 
    });
  }
};

const moderatorAuth = async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ 
        success: false,
        error: 'Требуется аутентификация' 
      });
    }

    const { rows } = await db.query(
      'SELECT id, username, email, role, status FROM users WHERE id = $1', 
      [req.userId]
    );
    
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'Пользователь не найден' 
      });
    }

    if (user.status === 'suspended' || user.status === 'banned') {
      return res.status(403).json({ 
        success: false,
        error: 'Ваш аккаунт заблокирован' 
      });
    }

    // Проверяем, является ли пользователь модератором
    if (user.role !== 'moderator') {
      return res.status(403).json({ 
        success: false,
        error: 'Требуются права модератора' 
      });
    }

    req.moderatorUser = user;
    next();
  } catch (error) {
    console.error('Moderator auth error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Внутренняя ошибка сервера' 
    });
  }
};

// Алиасы для совместимости с существующим кодом
const requireAdmin = adminAuth;
const requireModerator = moderatorAuth;

module.exports = {
  adminAuth,
  requireAdminOrModerator,
  moderatorAuth,
  requireAdmin,
  requireModerator
};