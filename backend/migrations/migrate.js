// backend/migrations/migrate.js
const db = require('../db/pool');
const path = require('path');
const fs = require('fs');

const runMigrations = async () => {
    console.log('🔄 Запуск миграций...');
    
    // Миграция 1: Основные таблицы
    await runMigration(`
        -- Таблица пользователей (уже есть, но добавим недостающие поля)
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            favorite_team TEXT,
            favorite_driver TEXT,
            avatar_url TEXT DEFAULT 'default-avatar.png',
            is_moderator BOOLEAN DEFAULT FALSE,
            is_banned BOOLEAN DEFAULT FALSE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Таблица категорий форума
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            slug TEXT UNIQUE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Таблица тем (постов)
        CREATE TABLE IF NOT EXISTS topics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            user_id INTEGER NOT NULL,
            category_id INTEGER NOT NULL,
            is_pinned BOOLEAN DEFAULT FALSE,
            is_locked BOOLEAN DEFAULT FALSE,
            views_count INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
        );

        -- Таблица комментариев
        CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT NOT NULL,
            user_id INTEGER NOT NULL,
            topic_id INTEGER NOT NULL,
            parent_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (topic_id) REFERENCES topics (id) ON DELETE CASCADE,
            FOREIGN KEY (parent_id) REFERENCES comments (id) ON DELETE CASCADE
        );

        -- Таблица лайков
        CREATE TABLE IF NOT EXISTS likes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            topic_id INTEGER,
            comment_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, topic_id, comment_id),
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (topic_id) REFERENCES topics (id) ON DELETE CASCADE,
            FOREIGN KEY (comment_id) REFERENCES comments (id) ON DELETE CASCADE
        );

        -- Вставляем основные категории
        INSERT OR IGNORE INTO categories (name, description, slug) VALUES
        ('Новости F1', 'Последние новости Формулы 1', 'news'),
        ('Обсуждение Гран-При', 'Обсуждение этапов чемпионата', 'grand-prix'),
        ('Команды и Пилоты', 'Обсуждение команд и пилотов', 'teams-drivers'),
        ('Технический анализ', 'Технические обсуждения', 'technical'),
        ('История F1', 'Исторические моменты', 'history'),
        ('Для новичков', 'Вопросы и ответы для новичков', 'beginners');
    `, '001_initial_schema');

    console.log('✅ Миграции успешно применены!');
};

const runMigration = (sql, migrationName) => {
    return new Promise((resolve, reject) => {
        console.log(`🔄 Применение миграции: ${migrationName}`);
        db.exec(sql, (err) => {
            if (err) {
                console.error(`❌ Ошибка миграции ${migrationName}:`, err);
                reject(err);
            } else {
                console.log(`✅ Миграция ${migrationName} успешна`);
                resolve();
            }
        });
    });
};

module.exports = { runMigrations };