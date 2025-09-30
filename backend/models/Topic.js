const db = require('../db/db');

class Topic {
  static async create(topicData) {
    const { title, content, category_id, user_id } = topicData;
    
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO topic (title, content, category_id, user_id) 
                   VALUES (?, ?, ?, ?)`;
      
      db.run(sql, [title, content, category_id, user_id], 
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...topicData });
        }
      );
    });
  }

  static async findAll() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT t.*, u.username, c.name as category_name, 
               (SELECT COUNT(*) FROM comment WHERE topic_id = t.id) as comment_count
        FROM topic t
        LEFT JOIN user u ON t.user_id = u.id
        LEFT JOIN category c ON t.category_id = c.id
        ORDER BY t.is_pinned DESC, t.created_at DESC
      `;
      
      db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static async findById(id) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT t.*, u.username, c.name as category_name
        FROM topic t
        LEFT JOIN user u ON t.user_id = u.id
        LEFT JOIN category c ON t.category_id = c.id
        WHERE t.id = ?
      `;
      
      db.get(sql, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  static async incrementViews(id) {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE topic SET views_count = views_count + 1 WHERE id = ?`;
      
      db.run(sql, [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

module.exports = Topic;