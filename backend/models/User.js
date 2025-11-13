const db = require('../db/postgres'); // ИЗМЕНЕНИЕ: используем postgres вместо db

class User {
  static async create(userData) {
    const { 
      username, 
      email, 
      password_hash, 
      favorite_team, 
      favorite_driver,
      role = 'user'
    } = userData;
    
    const { rows } = await db.query(
      `INSERT INTO users (username, email, password_hash, favorite_team, favorite_driver, role) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [username, email, password_hash, favorite_team, favorite_driver, role]
    );
    
    return rows[0];
  }

  static async findByEmail(email) {
    const { rows } = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return rows[0];
  }

  static async findById(id) {
    const { rows } = await db.query(
      `SELECT id, username, email, favorite_team, favorite_driver, 
              role, is_moderator, created_at, avatar_url, 
              last_login, login_count, status
       FROM users WHERE id = $1`,
      [id]
    );
    return rows[0];
  }

  static async findAll(limit = 50, offset = 0) {
    const { rows } = await db.query(
      `SELECT id, username, email, role, is_moderator, 
              favorite_team, favorite_driver, status,
              created_at, last_login, login_count
       FROM users 
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return rows;
  }

  static async updateRole(userId, newRole) {
    const { rows } = await db.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING *',
      [newRole, userId]
    );
    return rows[0];
  }

  static async updateStatus(userId, status) {
    const { rows } = await db.query(
      'UPDATE users SET status = $1 WHERE id = $2 RETURNING *',
      [status, userId]
    );
    return rows[0];
  }

  static async updateLoginInfo(userId) {
    await db.query(
      `UPDATE users SET last_login = NOW(), login_count = COALESCE(login_count, 0) + 1 
       WHERE id = $1`,
      [userId]
    );
  }

  static async getStats() {
    const { rows } = await db.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
        COUNT(CASE WHEN role = 'moderator' THEN 1 END) as moderator_count,
        COUNT(CASE WHEN status = 'banned' THEN 1 END) as banned_count,
        COUNT(CASE WHEN last_login > NOW() - INTERVAL '7 days' THEN 1 END) as active_week,
        COUNT(CASE WHEN last_login > NOW() - INTERVAL '30 days' THEN 1 END) as active_month,
        MAX(created_at) as latest_registration
      FROM users
    `);
    return rows[0];
  }
}

module.exports = User;