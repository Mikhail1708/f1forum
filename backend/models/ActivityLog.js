// backend/models/ActivityLog.js
const db = require('../db/postgres');

class ActivityLog {
  static async create(activityData) {
    const { user_id, action, description, ip_address, user_agent } = activityData;
    
    const { rows } = await db.query(
      `INSERT INTO activity_logs (user_id, action, description, ip_address, user_agent) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [user_id, action, description, ip_address, user_agent]
    );
    
    return rows[0];
  }

  static async findRecent(limit = 20) {
    const { rows } = await db.query(
      `SELECT al.*, u.username 
       FROM activity_logs al 
       LEFT JOIN users u ON al.user_id = u.id 
       ORDER BY al.created_at DESC 
       LIMIT $1`,
      [limit]
    );
    return rows;
  }

  static async findByUser(userId, limit = 50) {
    const { rows } = await db.query(
      `SELECT * FROM activity_logs 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [userId, limit]
    );
    return rows;
  }

  static async getStats(days = 7) {
    const { rows } = await db.query(`
      SELECT 
        COUNT(*) as total_activities,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '1 day' THEN 1 END) as today_count,
        COUNT(DISTINCT user_id) as active_users
      FROM activity_logs 
      WHERE created_at > NOW() - INTERVAL '${days} days'
    `);
    return rows[0];
  }
}

module.exports = ActivityLog;