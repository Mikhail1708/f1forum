// backend/db/initDb.js
const db = require('./db'); // Импортируем нашу обертку

async function initDatabase() {
    try {
        await db.runAsync(`
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
        `);
        console.log('✅ Таблица users готова');

        // Здесь можно создавать другие таблицы...
        // await db.runAsync(`CREATE TABLE IF NOT EXISTS posts ...`);

    } catch (err) {
        console.error('Ошибка инициализации базы данных:', err);
    }
}

// Вызываем функцию инициализации
initDatabase();

// Экспортируем db, чтобы использовать в других частях приложения
module.exports = db;