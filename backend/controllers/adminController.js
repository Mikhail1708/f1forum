const db = require('../db/db');

const adminController = {
  // Получение статистики системы
  async getStats(req, res) {
    try {
      const stats = await new Promise((resolve, reject) => {
        const sql = `
          SELECT 
            (SELECT COUNT(*) FROM users) as totalUsers,
            (SELECT COUNT(*) FROM topics) as totalTopics,
            (SELECT COUNT(*) FROM comments) as totalComments,
            (SELECT COUNT(*) FROM grand_prix) as totalRaces,
            (SELECT COUNT(*) FROM users WHERE DATE(created_at) = DATE('now')) as newUsersToday,
            (SELECT COUNT(*) FROM topics WHERE DATE(created_at) = DATE('now')) as newTopicsToday,
            (SELECT COUNT(*) FROM comments WHERE DATE(created_at) = DATE('now')) as newCommentsToday
        `;
        
        db.get(sql, [], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      // Последние действия - ИСПРАВЛЕННЫЙ ЗАПРОС
      const recentActivity = await new Promise((resolve, reject) => {
        const sql = `
          SELECT * FROM (
            SELECT 
              'user' as type, 
              username as title, 
              'зарегистрировался' as description, 
              created_at as activity_date
              FROM users 
            UNION ALL
            SELECT 
              'topic' as type, 
              title, 
              'создал тему' as description, 
              topics.created_at as activity_date
              FROM topics 
              JOIN users ON topics.user_id = users.id
            UNION ALL
            SELECT 
              'comment' as type, 
              SUBSTR(content, 1, 50) as title, 
              'оставил комментарий' as description, 
              comments.created_at as activity_date
              FROM comments 
              JOIN users ON comments.user_id = users.id
          ) 
          ORDER BY activity_date DESC 
          LIMIT 100
        `;
        
        db.all(sql, [], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      res.json({
        success: true,
        stats,
        recentActivity
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Получение списка пользователей
  async getUsers(req, res) {
    try {
      const { page = 1, limit = 20, search } = req.query;
      const offset = (page - 1) * limit;

      let users;
      let query;
      let params = [];

      if (search) {
        query = `
          SELECT id, username, email, role, status, created_at, favorite_team, favorite_driver 
          FROM users 
          WHERE username LIKE ? OR email LIKE ?
          ORDER BY created_at DESC 
          LIMIT ? OFFSET ?
        `;
        params = [`%${search}%`, `%${search}%`, parseInt(limit), offset];
      } else {
        query = `
          SELECT id, username, email, role, status, created_at, favorite_team, favorite_driver 
          FROM users 
          ORDER BY created_at DESC 
          LIMIT ? OFFSET ?
        `;
        params = [parseInt(limit), offset];
      }

      users = await new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      // Общее количество пользователей для пагинации
      const totalUsers = await new Promise((resolve, reject) => {
        db.get("SELECT COUNT(*) as count FROM users", [], (err, row) => {
          if (err) reject(err);
          else resolve(row.count);
        });
      });

      res.json({
        success: true,
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalUsers
        }
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Обновление роли пользователя
  async updateUserRole(req, res) {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      const validRoles = ['user', 'moderator', 'admin'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ success: false, error: 'Invalid role' });
      }

      await new Promise((resolve, reject) => {
        const sql = "UPDATE users SET role = ? WHERE id = ?";
        db.run(sql, [role, userId], function(err) {
          if (err) reject(err);
          else resolve();
        });
      });

      res.json({ success: true, message: 'User role updated' });
    } catch (error) {
      console.error('Error updating user role:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Обновление статуса пользователя
  async updateUserStatus(req, res) {
    try {
      const { userId } = req.params;
      const { status } = req.body;

      const validStatuses = ['active', 'banned', 'suspended'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, error: 'Invalid status' });
      }

      await new Promise((resolve, reject) => {
        const sql = "UPDATE users SET status = ? WHERE id = ?";
        db.run(sql, [status, userId], function(err) {
          if (err) reject(err);
          else resolve();
        });
      });

      res.json({ success: true, message: 'User status updated' });
    } catch (error) {
      console.error('Error updating user status:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

module.exports = adminController;