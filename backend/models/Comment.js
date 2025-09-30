const db = require('../db/db');

class Comment {
  static async create(commentData) {
    const { content, topic_id, user_id, parent_id } = commentData;
    
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO comment (content, topic_id, user_id, parent_id) 
                   VALUES (?, ?, ?, ?)`;
      
      db.run(sql, [content, topic_id, user_id, parent_id || null], 
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...commentData });
        }
      );
    });
  }

  static async findByTopicId(topicId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT c.*, u.username
        FROM comment c
        LEFT JOIN user u ON c.user_id = u.id
        WHERE c.topic_id = ?
        ORDER BY c.created_at ASC
      `;
      
      db.all(sql, [topicId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
}

module.exports = Comment;