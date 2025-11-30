// backend/models/Notification.js
const db = require('../db/postgres');

class Notification {
  static async create(notificationData) {
    const { user_id, type, title, message, related_entity_type, related_entity_id } = notificationData;
    
    const { rows } = await db.query(
      `INSERT INTO notifications (user_id, type, title, message, related_entity_type, related_entity_id) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [user_id, type, title, message, related_entity_type, related_entity_id]
    );
    
    return rows[0];
  }

  static async findByUser(userId, limit = 20, offset = 0) {
    const { rows } = await db.query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC, is_read ASC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return rows;
  }

  static async markAsRead(notificationId, userId) {
    const { rows } = await db.query(
      `UPDATE notifications 
       SET is_read = true, read_at = CURRENT_TIMESTAMP 
       WHERE id = $1 AND user_id = $2 
       RETURNING *`,
      [notificationId, userId]
    );
    return rows[0];
  }

  static async markAllAsRead(userId) {
    const { rows } = await db.query(
      `UPDATE notifications 
       SET is_read = true, read_at = CURRENT_TIMESTAMP 
       WHERE user_id = $1 AND is_read = false 
       RETURNING *`,
      [userId]
    );
    return rows;
  }

  static async getUnreadCount(userId) {
    const { rows } = await db.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );
    return parseInt(rows[0].count);
  }

  static async delete(notificationId, userId) {
    const { rows } = await db.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *',
      [notificationId, userId]
    );
    return rows[0];
  }
}

module.exports = Notification;