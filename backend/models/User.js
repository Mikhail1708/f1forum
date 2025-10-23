const db = require('../db/db');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    const { 
      username, 
      email, 
      password_hash, 
      favorite_team, 
      favorite_driver,
      role = 'user' // Добавляем роль по умолчанию
    } = userData;
    
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO users (username, email, password_hash, favorite_team, favorite_driver, role) 
                   VALUES (?, ?, ?, ?, ?, ?)`;
      
      db.run(sql, [username, email, password_hash, favorite_team, favorite_driver, role], 
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...userData, role });
        }
      );
    });
  }

  static async findByEmail(email) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM users WHERE email = ?`;
      
      db.get(sql, [email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  static async findById(id) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT id, username, email, favorite_team, favorite_driver, 
                          role, is_moderator, created_at, avatar_url, 
                          last_login, login_count, status
                   FROM users WHERE id = ?`;
      
      db.get(sql, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // 🔧 НОВЫЕ МЕТОДЫ ДЛЯ АДМИН-ПАНЕЛИ

  // Получить всех пользователей (для админ-панели)
  static async findAll(limit = 50, offset = 0) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT id, username, email, role, is_moderator, 
                          favorite_team, favorite_driver, status,
                          created_at, last_login, login_count
                   FROM users 
                   ORDER BY created_at DESC 
                   LIMIT ? OFFSET ?`;
      
      db.all(sql, [limit, offset], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Поиск пользователей (для админ-панели)
  static async search(query, limit = 20) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT id, username, email, role, status, created_at
                   FROM users 
                   WHERE username LIKE ? OR email LIKE ?
                   ORDER BY username
                   LIMIT ?`;
      
      const searchTerm = `%${query}%`;
      db.all(sql, [searchTerm, searchTerm, limit], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Обновить роль пользователя
  static async updateRole(userId, newRole) {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE users SET role = ? WHERE id = ?`;
      
      db.run(sql, [newRole, userId], function(err) {
        if (err) reject(err);
        else resolve({ userId, newRole, changes: this.changes });
      });
    });
  }

  // Обновить статус пользователя (active, banned, suspended)
  static async updateStatus(userId, status) {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE users SET status = ? WHERE id = ?`;
      
      db.run(sql, [status, userId], function(err) {
        if (err) reject(err);
        else resolve({ userId, status, changes: this.changes });
      });
    });
  }

  // Обновить информацию о входе
  static async updateLoginInfo(userId) {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE users SET last_login = datetime('now'), login_count = COALESCE(login_count, 0) + 1 
                   WHERE id = ?`;
      
      db.run(sql, [userId], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // Получить статистику пользователей
  static async getStats() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
          COUNT(CASE WHEN role = 'moderator' THEN 1 END) as moderator_count,
          COUNT(CASE WHEN status = 'banned' THEN 1 END) as banned_count,
          COUNT(CASE WHEN last_login > datetime('now', '-7 days') THEN 1 END) as active_week,
          COUNT(CASE WHEN last_login > datetime('now', '-30 days') THEN 1 END) as active_month,
          MAX(created_at) as latest_registration
        FROM users
      `;
      
      db.get(sql, [], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // Удалить пользователя (мягкое удаление)
  static async softDelete(userId) {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE users SET status = 'deleted', email = CONCAT(email, '_deleted_', ?) WHERE id = ?`;
      
      db.run(sql, [Date.now(), userId], function(err) {
        if (err) reject(err);
        else resolve({ userId, changes: this.changes });
      });
    });
  }

  // Получить пользователей по роли
  static async findByRole(role, limit = 100) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT id, username, email, created_at, last_login 
                   FROM users 
                   WHERE role = ? 
                   ORDER BY created_at DESC 
                   LIMIT ?`;
      
      db.all(sql, [role, limit], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
}

module.exports = User;