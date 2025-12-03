// backend/models/User.js
const db = require('../db/postgres');
const bcrypt = require('bcryptjs');

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

  // ДОБАВИТЬ ЭТОТ МЕТОД
  static async findByUsername(username) {
    const { rows } = await db.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    return rows[0];
  }

  static async findById(id) {
    const { rows } = await db.query(
      `SELECT id, username, email, favorite_team, favorite_driver, 
              role, is_moderator, created_at, avatar_url, 
              last_login, login_count, status, email_verified
       FROM users WHERE id = $1`,
      [id]
    );
    return rows[0];
  }

  static async findAll(limit = 50, offset = 0) {
    const { rows } = await db.query(
      `SELECT id, username, email, role, is_moderator, 
              favorite_team, favorite_driver, status, email_verified,
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

  // НОВЫЕ МЕТОДЫ ДЛЯ ПРОФИЛЯ

   static async getUserTopics(userId, limit = 20, offset = 0) {
    const { rows } = await db.query(`
      SELECT t.*, 
             (SELECT COUNT(*) FROM comments WHERE topic_id = t.id) as comments_count,
             (SELECT COUNT(*) FROM topic_likes WHERE topic_id = t.id) as likes_count
      FROM topics t
      WHERE t.user_id = $1
      ORDER BY t.created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);
    
    return rows.map(row => ({
      ...row,
      tags: row.tags ? JSON.parse(row.tags) : []
    }));
  }

  // Получение комментариев пользователя
  static async getUserComments(userId, limit = 20, offset = 0) {
    const { rows } = await db.query(`
      SELECT c.*, 
             t.title as topic_title,
             t.id as topic_id
      FROM comments c
      LEFT JOIN topics t ON c.topic_id = t.id
      WHERE c.user_id = $1
      ORDER BY c.created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);
    
    return rows;
  }

  // Получение предупреждений пользователя
  static async getUserWarnings(userId) {
    const { rows } = await db.query(`
      SELECT uw.*, 
             m.username as moderator_username
      FROM user_warnings uw
      LEFT JOIN users m ON uw.moderator_id = m.id
      WHERE uw.user_id = $1 
      ORDER BY uw.created_at DESC
    `, [userId]);
    
    return rows;
  }

  // Смена пароля
  static async changePassword(userId, newPasswordHash) {
    const { rows } = await db.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING *',
      [newPasswordHash, userId]
    );
    return rows[0];
  }

  // Подтверждение email
  static async verifyEmail(userId) {
    const { rows } = await db.query(
      'UPDATE users SET email_verified = true WHERE id = $1 RETURNING *',
      [userId]
    );
    return rows[0];
  }

  // Обновление профиля
  static async updateProfile(userId, updateData) {
    const { username, favorite_team, favorite_driver, avatar_url } = updateData;
    
    const { rows } = await db.query(
      `UPDATE users 
       SET username = $1, favorite_team = $2, favorite_driver = $3, avatar_url = $4
       WHERE id = $5 
       RETURNING *`,
      [username, favorite_team, favorite_driver, avatar_url, userId]
    );
    
    return rows[0];
  }

  // Получение статистики пользователя
  static async getUserStats(userId) {
    const { rows } = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM topics WHERE user_id = $1) as topics_count,
        (SELECT COUNT(*) FROM comments WHERE user_id = $1) as comments_count,
        (SELECT COUNT(*) FROM topic_likes WHERE user_id = $1) as topics_liked,
        (SELECT COUNT(*) FROM comment_likes WHERE user_id = $1) as comments_liked,
        (SELECT COUNT(*) FROM user_warnings WHERE user_id = $1) as warnings_count
    `, [userId]);
    
    return rows[0];
  }
}

module.exports = User;