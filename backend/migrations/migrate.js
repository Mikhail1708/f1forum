const db = require('../db/db');

const createTables = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Пользователи
      db.run(`CREATE TABLE IF NOT EXISTS user (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(45) UNIQUE NOT NULL,
        email VARCHAR(45) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        favorite_team VARCHAR(45),
        favorite_driver VARCHAR(45),
        is_moderator BOOLEAN DEFAULT 0,
        is_banned BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        avatar_url VARCHAR(255)
      )`);

      // Категории
      db.run(`CREATE TABLE IF NOT EXISTS category (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(45) NOT NULL,
        description TEXT,
        slug VARCHAR(45) UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Темы
      db.run(`CREATE TABLE IF NOT EXISTS topic (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title VARCHAR(45) NOT NULL,
        content TEXT NOT NULL,
        is_pinned BOOLEAN DEFAULT 0,
        is_locked BOOLEAN DEFAULT 0,
        views_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        user_id INTEGER NOT NULL,
        category_id INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES user (id),
        FOREIGN KEY (category_id) REFERENCES category (id)
      )`);

      // Комментарии
      db.run(`CREATE TABLE IF NOT EXISTS comment (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        parent_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        topic_id INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES user (id),
        FOREIGN KEY (topic_id) REFERENCES topic (id),
        FOREIGN KEY (parent_id) REFERENCES comment (id)
      )`);
      db.run(`CREATE TABLE IF NOT EXISTS grand_prix (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(45) NOT NULL,
  country VARCHAR(45) NOT NULL,
  circuit VARCHAR(45) NOT NULL,
  race_date DATE NOT NULL,
  year INTEGER NOT NULL,
  round VARCHAR(45) NOT NULL
)`);

      // Начальные данные
      db.run(`INSERT OR IGNORE INTO category (name, description, slug) VALUES 
        ('Новости F1', 'Последние новости Формулы 1', 'news'),
        ('Обсуждения гонок', 'Обсуждения прошедших и будущих Гран-при', 'race-discussions'),
        ('Технологии', 'Обсуждения технических аспектов', 'technology'),
        ('Команды и пилоты', 'Обсуждения команд и пилотов', 'teams-drivers')
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('Database migration completed successfully');
          resolve();
        }
      });
    });
  });
};

// Запуск миграции
createTables().catch(console.error);

module.exports = { createTables };