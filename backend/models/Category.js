const db = require('../db/db');

class Category {
  static async findAll() {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM category ORDER BY name`;
      
      db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static async findById(id) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM category WHERE id = ?`;
      
      db.get(sql, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }
}

module.exports = Category;