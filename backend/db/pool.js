// backend/db/pool.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Путь к файлу базы данных (создастся автоматически)
const dbPath = path.join(__dirname, '..', 'database.db');

// Создаем и подключаем базу данных
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Ошибка подключения к SQLite:', err);
    } else {
        console.log('✅ Подключение к SQLite установлено');
    }
});

// Создаем таблицу пользователей при запуске
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            favorite_team TEXT,
            favorite_driver TEXT,
            avatar_url TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('Ошибка создания таблицы users:', err);
        } else {
            console.log('✅ Таблица users готова');
        }
    });
});

module.exports = db;