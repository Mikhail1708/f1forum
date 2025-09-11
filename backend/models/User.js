// backend/models/User.js
const db = require('../db/pool');
const bcrypt = require('bcryptjs');

class User {
    // Создание нового пользователя
    static async create(userData) {
        const { username, email, password, favorite_team, favorite_driver } = userData;
        
        return new Promise((resolve, reject) => {
            bcrypt.hash(password, 10, (err, password_hash) => {
                if (err) return reject(err);

                const query = `
                    INSERT INTO users (username, email, password_hash, favorite_team, favorite_driver)
                    VALUES (?, ?, ?, ?, ?)
                `;

                db.run(query, [username, email, password_hash, favorite_team, favorite_driver], 
                    function(err) {
                        if (err) return reject(err);
                        
                        // Получаем полные данные пользователя
                        this.get('SELECT id, username, email, favorite_team, favorite_driver, avatar_url, created_at FROM users WHERE id = ?', 
                            [this.lastID], (err, row) => {
                                if (err) return reject(err);
                                resolve(row);
                            }
                        );
                    }
                );
            });
        });
    }

    // Поиск пользователя по email
    static async findByEmail(email) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM users WHERE email = ?';
            db.get(query, [email], (err, row) => {
                if (err) return reject(err);
                resolve(row);
            });
        });
    }

    // Поиск пользователя по id
    static async findById(id) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT id, username, email, favorite_team, favorite_driver, 
                       avatar_url, is_moderator, created_at 
                FROM users WHERE id = ? AND is_banned = FALSE
            `;
            db.get(query, [id], (err, row) => {
                if (err) return reject(err);
                resolve(row);
            });
        });
    }

    // Получение статистики пользователя
    static async getStats(userId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    (SELECT COUNT(*) FROM topics WHERE user_id = ?) as topics_count,
                    (SELECT COUNT(*) FROM comments WHERE user_id = ?) as comments_count,
                    (SELECT COUNT(*) FROM likes WHERE user_id = ?) as likes_count
            `;
            db.get(query, [userId, userId, userId], (err, row) => {
                if (err) return reject(err);
                resolve(row);
            });
        });
    }

    // Проверка пароля
    static async verifyPassword(plainPassword, hashedPassword) {
        return new Promise((resolve, reject) => {
            bcrypt.compare(plainPassword, hashedPassword, (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });
    }

    // Обновление профиля
    static async updateProfile(userId, updateData) {
        return new Promise((resolve, reject) => {
            const fields = [];
            const values = [];
            
            Object.keys(updateData).forEach(key => {
                if (updateData[key] !== undefined) {
                    fields.push(`${key} = ?`);
                    values.push(updateData[key]);
                }
            });
            
            if (fields.length === 0) {
                return resolve();
            }

            values.push(userId);
            const query = `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
            
            db.run(query, values, function(err) {
                if (err) return reject(err);
                resolve(this.changes);
            });
        });
    }
}

module.exports = User;