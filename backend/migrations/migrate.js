const db = require('../db/db');
const bcrypt = require('bcryptjs');

const createTables = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Создаем таблицу users с ВСЕМИ необходимыми колонками
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(45) UNIQUE NOT NULL,
        email VARCHAR(45) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        favorite_team VARCHAR(45),
        favorite_driver VARCHAR(45),
        role VARCHAR(20) DEFAULT 'user',
        status VARCHAR(20) DEFAULT 'active',
        is_moderator BOOLEAN DEFAULT 0,
        is_banned BOOLEAN DEFAULT 0,
        last_login DATETIME,
        login_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        avatar_url VARCHAR(255)
      )`, function(err) {
        if (err) {
          console.error('Error creating users table:', err);
          reject(err);
          return;
        }
        console.log('Users table created successfully');

        // Создаем остальные таблицы
        db.run(`CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name VARCHAR(45) NOT NULL,
          description TEXT,
          slug VARCHAR(45) UNIQUE NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS topics (
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
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (category_id) REFERENCES categories (id)
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS comments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          content TEXT NOT NULL,
          user_id INTEGER NOT NULL,
          parent_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          topic_id INTEGER NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (topic_id) REFERENCES topics (id),
          FOREIGN KEY (parent_id) REFERENCES comments (id)
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

        db.run(`CREATE TABLE IF NOT EXISTS backups (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          filename TEXT NOT NULL,
          filepath TEXT NOT NULL,
          size INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          created_by INTEGER,
          type TEXT DEFAULT 'full',
          notes TEXT,
          FOREIGN KEY (created_by) REFERENCES users(id)
        )`, function(err) {
          if (err) {
            console.error('Error creating backups table:', err);
            reject(err);
            return;
          }

          console.log('All tables created successfully');
          
          // Теперь создаем администратора
          createAdminUser(resolve, reject);
        });
      });
    });
  });
};

function createAdminUser(resolve, reject) {
  // Сначала проверяем, существует ли уже администратор
  db.get("SELECT id FROM users WHERE email = 'admin@f1forum.com'", [], (err, row) => {
    if (err) {
      console.error('Error checking admin user:', err);
      reject(err);
      return;
    }

    if (row) {
      console.log('Admin user already exists');
      resolve();
      return;
    }

    // Создаем хеш пароля
    const adminPasswordHash = bcrypt.hashSync('admin123', 10);
    
    // Вставляем администратора
    db.run(`INSERT INTO users (username, email, password_hash, role, is_moderator) 
            VALUES (?, ?, ?, ?, ?)`, 
            ['admin', 'admin@f1forum.com', adminPasswordHash, 'admin', 1], 
            function(err) {
      if (err) {
        console.error('Error creating admin user:', err);
        reject(err);
        return;
      }
      
      console.log('Admin user created successfully');
      console.log('Login: admin@f1forum.com');
      console.log('Password: admin123');
      resolve();
    });
  });
}

// Запуск миграции
createTables()
  .then(() => {
    console.log('Database migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });

module.exports = { createTables };