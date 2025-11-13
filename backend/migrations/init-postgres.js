const db = require('../db/postgres');
const bcrypt = require('bcryptjs');

console.log('🚀 Starting PostgreSQL database migration...');
console.log('📊 Environment check:');
console.log('   DB_HOST:', process.env.DB_HOST);
console.log('   DB_NAME:', process.env.DB_NAME);
console.log('   DB_USER:', process.env.DB_USER);
console.log('   DB_PORT:', process.env.DB_PORT);

async function testConnection() {
  try {
    console.log('🔌 Testing database connection...');
    const result = await db.query('SELECT version()');
    console.log('✅ Database connection successful');
    console.log('   PostgreSQL version:', result.rows[0].version);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

async function createTables() {
  try {
    console.log('📋 Creating tables...');

    // Создаем таблицу users
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(45) UNIQUE NOT NULL,
        email VARCHAR(45) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        favorite_team VARCHAR(45),
        favorite_driver VARCHAR(45),
        role VARCHAR(20) DEFAULT 'user',
        status VARCHAR(20) DEFAULT 'active',
        is_moderator BOOLEAN DEFAULT FALSE,
        is_banned BOOLEAN DEFAULT FALSE,
        last_login TIMESTAMP,
        login_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        avatar_url VARCHAR(255)
      )
    `);
    console.log('✅ Users table created');

    // Создаем таблицу categories
    await db.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(45) NOT NULL,
        description TEXT,
        slug VARCHAR(45) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Categories table created');

    // Создаем таблицу topics
    await db.query(`
      CREATE TABLE IF NOT EXISTS topics (
        id SERIAL PRIMARY KEY,
        title VARCHAR(100) NOT NULL,
        content TEXT NOT NULL,
        tags TEXT,
        views INTEGER DEFAULT 0,
        likes INTEGER DEFAULT 0,
        comments_count INTEGER DEFAULT 0,
        is_pinned BOOLEAN DEFAULT FALSE,
        is_locked BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Topics table created');

    // Создаем таблицу comments
    await db.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        likes INTEGER DEFAULT 0,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Comments table created');

    // Таблица для лайков тем
    await db.query(`
      CREATE TABLE IF NOT EXISTS topic_likes (
        id SERIAL PRIMARY KEY,
        topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(topic_id, user_id)
      )
    `);
    console.log('✅ Topic likes table created');

    // Таблица для лайков комментариев
    await db.query(`
      CREATE TABLE IF NOT EXISTS comment_likes (
        id SERIAL PRIMARY KEY,
        comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(comment_id, user_id)
      )
    `);
    console.log('✅ Comment likes table created');

    // Таблица grand_prix с оригинальными полями
    await db.query(`
      CREATE TABLE IF NOT EXISTS grand_prix (
        id SERIAL PRIMARY KEY,
        name VARCHAR(45) NOT NULL,
        country VARCHAR(45) NOT NULL,
        circuit VARCHAR(45) NOT NULL,
        race_date DATE NOT NULL,
        year INTEGER NOT NULL,
        round VARCHAR(45) NOT NULL
      )
    `);
    console.log('✅ Grand Prix table created');

    // Таблица backups
    await db.query(`
      CREATE TABLE IF NOT EXISTS backups (
        id SERIAL PRIMARY KEY,
        filename TEXT NOT NULL,
        filepath TEXT NOT NULL,
        size INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER REFERENCES users(id),
        type TEXT DEFAULT 'full',
        notes TEXT
      )
    `);
    console.log('✅ Backups table created');

    console.log('✅ All tables created successfully');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  }
}

async function createAdminUser() {
  try {
    console.log('👤 Creating admin user...');
    
    // Проверяем, существует ли администратор
    const { rows } = await db.query(
      "SELECT id FROM users WHERE email = $1",
      ['admin@f1forum.com']
    );
    
    if (rows.length > 0) {
      console.log('✅ Admin user already exists');
      return;
    }

    // Создаем хеш пароля
    const adminPasswordHash = bcrypt.hashSync('admin123', 10);
    
    // Вставляем администратора
    const { rows: adminRows } = await db.query(
      `INSERT INTO users (username, email, password_hash, role, is_moderator) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      ['admin', 'admin@f1forum.com', adminPasswordHash, 'admin', true]
    );
    
    console.log('✅ Admin user created successfully');
    console.log('📧 Login: admin@f1forum.com');
    console.log('🔑 Password: admin123');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  }
}

// Основная функция миграции
async function runMigration() {
  try {
    console.log('🚀 Starting PostgreSQL database migration...');
    
    // Сначала тестируем подключение
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Cannot connect to database');
    }
    
    await createTables();
    await createAdminUser();
    
    console.log('🎉 Database migration completed successfully!');
    console.log('');
    console.log('📋 Database is ready for use');
    console.log('👤 Admin credentials:');
    console.log('   📧 Email: admin@f1forum.com');
    console.log('   🔑 Password: admin123');
    console.log('');
    console.log('🔗 Database: f1_forum (PostgreSQL)');
    
  } catch (error) {
    console.error('💥 Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    throw error;
  }
}

// Запускаем миграцию
runMigration()
  .then(() => {
    console.log('✨ Migration completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Migration failed with error:', error.message);
    process.exit(1);
  });