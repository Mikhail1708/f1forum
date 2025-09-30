const db = require('../db/db');

class User {
  static async create(userData) {
    const { username, email, password_hash, favorite_team, favorite_driver } = userData;
    
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO user (username, email, password_hash, favorite_team, favorite_driver) 
                   VALUES (?, ?, ?, ?, ?)`;
      
      db.run(sql, [username, email, password_hash, favorite_team, favorite_driver], 
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...userData });
        }
      );
    });
  }

  static async findByEmail(email) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM user WHERE email = ?`;
      
      db.get(sql, [email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  static async findById(id) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT id, username, email, favorite_team, favorite_driver, 
                          is_moderator, created_at, avatar_url 
                   FROM user WHERE id = ?`;
      
      db.get(sql, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }
}

module.exports = User;