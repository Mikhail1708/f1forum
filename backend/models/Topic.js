// backend/models/Topic.js
const db = require('../db/pool');

class Topic {
    // Создание новой темы
    static async create(topicData) {
        const { title, content, user_id, category_id } = topicData;
        
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO topics (title, content, user_id, category_id)
                VALUES (?, ?, ?, ?)
            `;

            db.run(query, [title, content, user_id, category_id], 
                function(err) {
                    if (err) return reject(err);
                    
                    // Получаем полные данные темы с информацией о пользователе
                    this.get(`
                        SELECT t.*, u.username, u.avatar_url 
                        FROM topics t 
                        JOIN users u ON t.user_id = u.id 
                        WHERE t.id = ?
                    `, [this.lastID], (err, row) => {
                        if (err) return reject(err);
                        resolve(row);
                    });
                }
            );
        });
    }

    // Получение темы по ID
    static async findById(id) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT t.*, u.username, u.avatar_url, c.name as category_name
                FROM topics t 
                JOIN users u ON t.user_id = u.id 
                JOIN categories c ON t.category_id = c.id
                WHERE t.id = ? AND t.is_locked = FALSE
            `;
            db.get(query, [id], (err, row) => {
                if (err) return reject(err);
                resolve(row);
            });
        });
    }

    // Получение списка тем
    static async findAll(categoryId = null, page = 1, limit = 20) {
        return new Promise((resolve, reject) => {
            let query = `
                SELECT t.*, u.username, u.avatar_url, c.name as category_name,
                       (SELECT COUNT(*) FROM comments WHERE topic_id = t.id) as comments_count
                FROM topics t 
                JOIN users u ON t.user_id = u.id 
                JOIN categories c ON t.category_id = c.id
                WHERE t.is_locked = FALSE
            `;
            let params = [];
            
            if (categoryId) {
                query += ' AND t.category_id = ?';
                params.push(categoryId);
            }
            
            query += ' ORDER BY t.is_pinned DESC, t.created_at DESC LIMIT ? OFFSET ?';
            params.push(limit, (page - 1) * limit);

            db.all(query, params, (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
    }
}

module.exports = Topic;