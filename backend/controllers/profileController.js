// backend/controllers/profileController.js - ИСПРАВЛЕННАЯ ВЕРСИЯ
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const db = require('../db/postgres');

class ProfileController {
  // Получение профиля пользователя
  async getProfile(req, res) {
    try {
      const userId = req.userId;
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Пользователь не найден'
        });
      }

      // Получаем статистику пользователя
      const statsResult = await db.query(`
        SELECT 
          (SELECT COUNT(*) FROM topics WHERE user_id = $1) as topics_count,
          (SELECT COUNT(*) FROM comments WHERE user_id = $1) as comments_count,
          (SELECT COUNT(*) FROM topic_likes WHERE user_id = $1) as topics_liked,
          (SELECT COUNT(*) FROM comment_likes WHERE user_id = $1) as comments_liked,
          (SELECT COUNT(*) FROM user_warnings WHERE user_id = $1) as warnings_count
      `, [userId]);
      
      const stats = statsResult.rows[0] || {
        topics_count: 0,
        comments_count: 0,
        topics_liked: 0,
        comments_liked: 0,
        warnings_count: 0
      };
      
      res.json({
        success: true,
        data: {
          user,
          stats
        }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении профиля'
      });
    }
  }

  // Получение постов пользователя - ИСПРАВЛЕННАЯ ВЕРСИЯ
  async getUserTopics(req, res) {
    try {
      const userId = req.userId;
      const { limit = 20, offset = 0 } = req.query;

      console.log('📝 Getting user topics for user:', userId);

      const { rows } = await db.query(`
        SELECT 
          t.*,
          (SELECT COUNT(*) FROM comments WHERE topic_id = t.id) as comments_count,
          (SELECT COUNT(*) FROM topic_likes WHERE topic_id = t.id) as likes_count
        FROM topics t
        WHERE t.user_id = $1
        ORDER BY t.created_at DESC
        LIMIT $2 OFFSET $3
      `, [userId, parseInt(limit), parseInt(offset)]);
      
      console.log('📝 Found topics:', rows.length);

      const topics = rows.map(row => ({
        ...row,
        tags: row.tags ? (typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags) : []
      }));
      
      res.json({
        success: true,
        data: topics
      });
    } catch (error) {
      console.error('Get user topics error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении постов'
      });
    }
  }

  // Получение комментариев пользователя - ИСПРАВЛЕННАЯ ВЕРСИЯ
  async getUserComments(req, res) {
    try {
      const userId = req.userId;
      const { limit = 20, offset = 0 } = req.query;

      console.log('💬 Getting user comments for user:', userId);

      const { rows } = await db.query(`
        SELECT 
          c.*,
          t.title as topic_title,
          t.id as topic_id
        FROM comments c
        LEFT JOIN topics t ON c.topic_id = t.id
        WHERE c.user_id = $1
        ORDER BY c.created_at DESC
        LIMIT $2 OFFSET $3
      `, [userId, parseInt(limit), parseInt(offset)]);
      
      console.log('💬 Found comments:', rows.length);
      
      res.json({
        success: true,
        data: rows
      });
    } catch (error) {
      console.error('Get user comments error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении комментариев'
      });
    }
  }

  // Получение предупреждений пользователя - ИСПРАВЛЕННАЯ ВЕРСИЯ
  async getUserWarnings(req, res) {
    try {
      const userId = req.userId;

      console.log('⚠️ Getting user warnings for user:', userId);

      const { rows } = await db.query(`
        SELECT 
          uw.*,
          m.username as moderator_username
        FROM user_warnings uw
        LEFT JOIN users m ON uw.moderator_id = m.id
        WHERE uw.user_id = $1 
        ORDER BY uw.created_at DESC
      `, [userId]);
      
      console.log('⚠️ Found warnings:', rows.length);
      
      res.json({
        success: true,
        data: rows
      });
    } catch (error) {
      console.error('Get user warnings error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении предупреждений'
      });
    }
  }

  // Остальные методы остаются без изменений...
  async changePassword(req, res) {
    try {
      const userId = req.userId;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          error: 'Текущий и новый пароль обязательны'
        });
      }

      // Получаем пользователя с хешем пароля
      const userResult = await db.query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );
      
      const user = userResult.rows[0];
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Пользователь не найден'
        });
      }

      // Проверяем текущий пароль
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          error: 'Неверный текущий пароль'
        });
      }

      // Хешируем новый пароль
      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      
      // Обновляем пароль
      await db.query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [newPasswordHash, userId]
      );

      res.json({
        success: true,
        message: 'Пароль успешно изменен'
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при смене пароля'
      });
    }
  }

  async verifyEmail(req, res) {
    try {
      const userId = req.userId;

      await db.query(
        'UPDATE users SET email_verified = true WHERE id = $1',
        [userId]
      );

      res.json({
        success: true,
        message: 'Email успешно подтвержден'
      });
    } catch (error) {
      console.error('Verify email error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при подтверждении email'
      });
    }
  }

  async updateProfile(req, res) {
    try {
      const userId = req.userId;
      const { username, favorite_team, favorite_driver, avatar_url } = req.body;

      const { rows } = await db.query(
        `UPDATE users 
         SET username = $1, favorite_team = $2, favorite_driver = $3, avatar_url = $4
         WHERE id = $5 
         RETURNING *`,
        [username, favorite_team, favorite_driver, avatar_url, userId]
      );

      res.json({
        success: true,
        data: rows[0],
        message: 'Профиль успешно обновлен'
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при обновлении профиля'
      });
    }
  }

  async getNotifications(req, res) {
    try {
      const userId = req.userId;
      const { limit = 20, offset = 0 } = req.query;

      // Временная реализация - возвращаем пустой массив
      const notifications = [];
      const unreadCount = 0;

      res.json({
        success: true,
        data: {
          notifications,
          unreadCount
        }
      });
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении уведомлений'
      });
    }
  }

  async markNotificationAsRead(req, res) {
    try {
      const userId = req.userId;
      const { notificationId } = req.params;

      res.json({
        success: true,
        message: 'Уведомление отмечено как прочитанное'
      });
    } catch (error) {
      console.error('Mark notification as read error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при обновлении уведомления'
      });
    }
  }

  async markAllNotificationsAsRead(req, res) {
    try {
      const userId = req.userId;

      res.json({
        success: true,
        message: 'Все уведомления отмечены как прочитанные'
      });
    } catch (error) {
      console.error('Mark all notifications as read error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при обновлении уведомлений'
      });
    }
  }
}

module.exports = new ProfileController();