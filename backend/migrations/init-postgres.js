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
    console.log('📋 Creating tables if they do not exist...');

    // 1. Таблица users с обновленными полями
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(45) UNIQUE NOT NULL,
        email VARCHAR(254) UNIQUE NOT NULL,  -- Увеличено до 254 для email
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
        avatar_url VARCHAR(255),
        email_verified BOOLEAN DEFAULT FALSE
      )
    `);
    console.log('✅ Users table checked/created');

    // 2. Таблица categories
    await db.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(45) NOT NULL,
        description TEXT,
        slug VARCHAR(45) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Categories table checked/created');

    // 3. Таблица topics с обновленными полями (JSONB для tags)
    await db.query(`
      CREATE TABLE IF NOT EXISTS topics (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,  -- Увеличено до 255
        content TEXT NOT NULL,
        tags JSONB,  -- Изменено на JSONB
        views INTEGER DEFAULT 0,
        likes INTEGER DEFAULT 0,
        comments_count INTEGER DEFAULT 0,
        is_pinned BOOLEAN DEFAULT FALSE,
        is_locked BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        status VARCHAR(20) DEFAULT 'pending'  -- Добавлено поле status
      )
    `);
    console.log('✅ Topics table checked/created');

    // 4. Таблица comments с полем status
    await db.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        likes INTEGER DEFAULT 0,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending'  -- Добавлено поле status
      )
    `);
    console.log('✅ Comments table checked/created');

    // 5. Таблица для лайков тем
    await db.query(`
      CREATE TABLE IF NOT EXISTS topic_likes (
        id SERIAL PRIMARY KEY,
        topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(topic_id, user_id)
      )
    `);
    console.log('✅ Topic likes table checked/created');

    // 6. Таблица для лайков комментариев
    await db.query(`
      CREATE TABLE IF NOT EXISTS comment_likes (
        id SERIAL PRIMARY KEY,
        comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(comment_id, user_id)
      )
    `);
    console.log('✅ Comment likes table checked/created');

    // 7. Таблица grand_prix с правильными типами
    await db.query(`
      CREATE TABLE IF NOT EXISTS grand_prix (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        country VARCHAR(100) NOT NULL,
        circuit VARCHAR(100) NOT NULL,
        race_date DATE NOT NULL,
        year INTEGER NOT NULL,
        round INTEGER NOT NULL  -- Изменено на INTEGER
      )
    `);
    console.log('✅ Grand Prix table checked/created');

    // 8. Таблица backups
    await db.query(`
      CREATE TABLE IF NOT EXISTS backups (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        file_path TEXT NOT NULL,
        size BIGINT NOT NULL,
        created_by INTEGER REFERENCES users(id),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Backups table checked/created');

    // 9. Таблица activity_logs (новая)
    await db.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        description TEXT,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Activity logs table checked/created');

    // 10. Таблица moderator_actions (новая)
    await db.query(`
      CREATE TABLE IF NOT EXISTS moderator_actions (
        id SERIAL PRIMARY KEY,
        moderator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        action_type VARCHAR(50) NOT NULL,
        description TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Moderator actions table checked/created');

    // 11. Таблица reports (новая)
    await db.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id SERIAL PRIMARY KEY,
        reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content_type VARCHAR(20) NOT NULL,
        content_id INTEGER NOT NULL,
        reason TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        resolution TEXT,
        moderator_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        resolved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        moderator_notes TEXT
      )
    `);
    console.log('✅ Reports table checked/created');

    // 12. Таблица report_notes (новая)
    await db.query(`
      CREATE TABLE IF NOT EXISTS report_notes (
        id SERIAL PRIMARY KEY,
        report_id INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
        moderator_id INTEGER NOT NULL REFERENCES users(id),
        note TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Report notes table checked/created');

    // 13. Таблица notifications (новая)
    await db.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        related_entity_type VARCHAR(50),
        related_entity_id INTEGER,
        is_read BOOLEAN DEFAULT FALSE,
        read_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Notifications table checked/created');

    // 14. Таблица user_warnings (новая)
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_warnings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        moderator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reason TEXT NOT NULL,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ User warnings table checked/created');

    // 15. Таблица password_reset_tokens (новая)
    await db.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Password reset tokens table checked/created');

    // 16. Таблица email_verification_tokens (новая)
    await db.query(`
      CREATE TABLE IF NOT EXISTS email_verification_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Email verification tokens table checked/created');

    console.log('✅ All tables checked/created successfully');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  }
}

async function createIndexes() {
  try {
    console.log('📊 Creating indexes...');

    // Индексы для таблицы users
    await db.query('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC)');

    // Индексы для таблицы topics
    await db.query('CREATE INDEX IF NOT EXISTS idx_topics_user_id ON topics(user_id)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_topics_status ON topics(status)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_topics_created_at ON topics(created_at DESC)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_topics_category_id ON topics(category_id) WHERE category_id IS NOT NULL');

    // Индексы для таблицы comments
    await db.query('CREATE INDEX IF NOT EXISTS idx_comments_topic_id ON comments(topic_id)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id) WHERE parent_id IS NOT NULL');

    // Индексы для таблицы reports
    await db.query('CREATE INDEX IF NOT EXISTS idx_reports_content ON reports(content_type, content_id)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_reports_author_id ON reports(author_id)');

    // Индексы для таблицы activity_logs
    await db.query('CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at)');

    // Индексы для таблицы notifications
    await db.query('CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at)');

    // Индексы для таблицы password_reset_tokens
    await db.query('CREATE INDEX IF NOT EXISTS idx_password_tokens_token ON password_reset_tokens(token)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_password_tokens_user_id ON password_reset_tokens(user_id)');

    // Индексы для таблицы email_verification_tokens
    await db.query('CREATE INDEX IF NOT EXISTS idx_email_tokens_token ON email_verification_tokens(token)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_email_tokens_user_id ON email_verification_tokens(user_id)');

    // Индексы для таблицы user_warnings
    await db.query('CREATE INDEX IF NOT EXISTS idx_user_warnings_user ON user_warnings(user_id)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_user_warnings_expires ON user_warnings(expires_at)');

    console.log('✅ All indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    throw error;
  }
}

async function createTriggers() {
  try {
    console.log('⚡ Creating triggers...');

    // Триггер для автоматического обновления updated_at
    await db.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    // Триггер для topics
    await db.query(`
      DROP TRIGGER IF EXISTS update_topics_updated_at ON topics;
      CREATE TRIGGER update_topics_updated_at 
      BEFORE UPDATE ON topics 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);

    // Триггер для comments
    await db.query(`
      DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
      CREATE TRIGGER update_comments_updated_at 
      BEFORE UPDATE ON comments 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);

    // Триггер для автоматической синхронизации is_moderator и is_banned
    await db.query(`
      CREATE OR REPLACE FUNCTION sync_user_flags()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.is_moderator = (NEW.role IN ('moderator', 'admin'));
          NEW.is_banned = (NEW.status = 'banned');
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    await db.query(`
      DROP TRIGGER IF EXISTS sync_user_flags_trigger ON users;
      CREATE TRIGGER sync_user_flags_trigger
      BEFORE INSERT OR UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION sync_user_flags()
    `);

    console.log('✅ All triggers created successfully');
  } catch (error) {
    console.error('❌ Error creating triggers:', error);
    throw error;
  }
}

async function createFunctions() {
  try {
    console.log('🔧 Creating stored functions...');

    // Функция для мягкого удаления пользователя
    await db.query(`
      CREATE OR REPLACE FUNCTION archive_user_soft(user_id_to_archive INTEGER)
      RETURNS VOID AS $$
      DECLARE
          archived_username VARCHAR;
          archive_timestamp TIMESTAMP := CURRENT_TIMESTAMP;
      BEGIN
          -- Получаем имя пользователя
          SELECT username INTO archived_username 
          FROM users WHERE id = user_id_to_archive;
          
          IF archived_username IS NULL THEN
              RAISE EXCEPTION 'Пользователь с id % не найден', user_id_to_archive;
          END IF;
          
          -- 1. Архивируем пользователя (soft delete)
          UPDATE users SET 
              username = 'deleted_user_' || user_id_to_archive,
              email = 'deleted_' || user_id_to_archive || '@deleted.f1forum',
              password_hash = 'ARCHIVED',
              favorite_team = NULL,
              favorite_driver = NULL,
              status = 'banned',
              avatar_url = NULL,
              email_verified = false,
              last_login = NULL
          WHERE id = user_id_to_archive;
          
          -- 2. Архивируем темы пользователя
          UPDATE topics SET 
              title = '[Удалено] ' || title,
              content = 'Контент удален пользователем или администратором',
              status = 'rejected',
              is_locked = true
          WHERE user_id = user_id_to_archive;
          
          -- 3. Архивируем комментарии пользователя
          UPDATE comments SET 
              content = '[Комментарий удален]',
              status = 'rejected'
          WHERE user_id = user_id_to_archive;
          
          -- Логируем архивацию
          INSERT INTO activity_logs (user_id, action, description, created_at)
          VALUES (
              NULL,
              'user_archived_soft', 
              format('Пользователь "%s" (id: %s) архивирован (soft delete)', 
                     archived_username, user_id_to_archive),
              archive_timestamp
          );
          
          RAISE NOTICE 'Пользователь "%s" (id: %s) архивирован (soft delete)', 
                       archived_username, user_id_to_archive;
      END;
      $$ LANGUAGE plpgsql
    `);
    console.log('✅ Function archive_user_soft created');

    console.log('✅ All functions created successfully');
  } catch (error) {
    console.error('❌ Error creating functions:', error);
    throw error;
  }
}

async function createAdminUser() {
  try {
    console.log('👑 Creating admin user...');
    
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
      `INSERT INTO users (username, email, password_hash, role, is_moderator, email_verified) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      ['admin', 'admin@f1forum.com', adminPasswordHash, 'admin', true, true]
    );
    
    console.log('✅ Admin user created successfully');
    console.log('📧 Login: admin@f1forum.com');
    console.log('🔑 Password: admin123');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  }
}

async function createModeratorUser() {
  try {
    console.log('👮 Creating moderator user...');
    
    // Проверяем, существует ли модератор
    const { rows } = await db.query(
      "SELECT id FROM users WHERE email = $1",
      ['moderator@f1forum.com']
    );
    
    if (rows.length > 0) {
      console.log('✅ Moderator user already exists');
      return;
    }

    // Создаем хеш пароля
    const moderatorPasswordHash = bcrypt.hashSync('moderator123', 10);
    
    // Вставляем модератора
    const { rows: moderatorRows } = await db.query(
      `INSERT INTO users (username, email, password_hash, role, is_moderator, email_verified) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      ['moderator', 'moderator@f1forum.com', moderatorPasswordHash, 'moderator', true, true]
    );
    
    console.log('✅ Moderator user created successfully');
    console.log('📧 Login: moderator@f1forum.com');
    console.log('🔑 Password: moderator123');
    
  } catch (error) {
    console.error('❌ Error creating moderator user:', error);
    throw error;
  }
}

async function createTestUser() {
  try {
    console.log('👤 Creating test user...');
    
    // Проверяем, существует ли тестовый пользователь
    const { rows } = await db.query(
      "SELECT id FROM users WHERE email = $1",
      ['test@f1forum.com']
    );
    
    if (rows.length > 0) {
      console.log('✅ Test user already exists');
      return;
    }

    // Создаем хеш пароля
    const testPasswordHash = bcrypt.hashSync('test123', 10);
    
    // Вставляем тестового пользователя
    const { rows: testRows } = await db.query(
      `INSERT INTO users (username, email, password_hash, role, favorite_team, favorite_driver, email_verified) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      ['testuser', 'test@f1forum.com', testPasswordHash, 'user', 'Ferrari', 'Charles Leclerc', true]
    );
    
    console.log('✅ Test user created successfully');
    console.log('📧 Login: test@f1forum.com');
    console.log('🔑 Password: test123');
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    throw error;
  }
}

async function updateExistingUsers() {
  try {
    console.log('🔄 Updating existing users...');
    
    // Обновляем email_verified для существующих пользователей
    await db.query(`
      UPDATE users 
      SET email_verified = true 
      WHERE email_verified IS NULL 
      AND email LIKE '%@f1forum.com'
    `);
    
    // Синхронизируем is_moderator и is_banned для существующих пользователей
    await db.query(`
      UPDATE users 
      SET 
        is_moderator = (role IN ('moderator', 'admin')),
        is_banned = (status = 'banned')
    `);
    
    console.log('✅ Existing users updated successfully');
  } catch (error) {
    console.error('❌ Error updating existing users:', error);
    throw error;
  }
}

async function insertSampleData() {
  try {
    console.log('📝 Inserting sample data...');
    
    // Проверяем, есть ли уже тестовые данные
    const { rows } = await db.query("SELECT COUNT(*) as count FROM grand_prix");
    const count = parseInt(rows[0].count);
    
    if (count === 0) {
      // Вставляем примеры гран-при
      await db.query(`
        INSERT INTO grand_prix (name, country, circuit, race_date, year, round) VALUES
        ('Bahrain Grand Prix', 'Bahrain', 'Bahrain International Circuit', '2024-03-02', 2024, 1),
        ('Saudi Arabian Grand Prix', 'Saudi Arabia', 'Jeddah Corniche Circuit', '2024-03-09', 2024, 2),
        ('Australian Grand Prix', 'Australia', 'Albert Park Circuit', '2024-03-24', 2024, 3),
        ('Japanese Grand Prix', 'Japan', 'Suzuka Circuit', '2024-04-07', 2024, 4)
      `);
      console.log('✅ Sample grand prix data inserted');
    } else {
      console.log('✅ Sample data already exists');
    }
    
  } catch (error) {
    console.error('❌ Error inserting sample data:', error);
    throw error;
  }
}

// Основная функция миграции
async function runMigration() {
  try {
    console.log('🚀 Starting PostgreSQL database migration...');
    console.log('='.repeat(60));
    
    // Сначала тестируем подключение
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Cannot connect to database');
    }
    
    // Шаг 1: Создаем таблицы
    await createTables();
    
    // Шаг 2: Создаем индексы
    await createIndexes();
    
    // Шаг 3: Создаем триггеры
    await createTriggers();
    
    // Шаг 4: Создаем функции
    await createFunctions();
    
    // Шаг 5: Создаем пользователей
    await createAdminUser();
    await createModeratorUser();
    await createTestUser();
    
    // Шаг 6: Обновляем существующих пользователей
    await updateExistingUsers();
    
    // Шаг 7: Вставляем тестовые данные
    await insertSampleData();
    
    console.log('='.repeat(60));
    console.log('🎉 Database migration completed successfully!');
    console.log('');
    console.log('📋 Database is ready for use');
    console.log('👤 Available users:');
    console.log('   👑 Admin:      admin@f1forum.com / admin123');
    console.log('   👮 Moderator:  moderator@f1forum.com / moderator123');
    console.log('   👤 Test user:  test@f1forum.com / test123');
    console.log('');
    console.log('🔗 Database: f1forum (PostgreSQL)');
    console.log('⚡ Features enabled:');
    console.log('   ✅ Automatic updated_at triggers');
    console.log('   ✅ User flags synchronization');
    console.log('   ✅ Soft delete function');
    console.log('   ✅ Performance indexes');
    console.log('   ✅ Sample data');
    
  } catch (error) {
    console.error('💥 Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    throw error;
  }
}

// Запускаем миграцию
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('✨ Migration completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Migration failed with error:', error.message);
      process.exit(1);
    });
}

module.exports = {
  runMigration,
  testConnection,
  createTables,
  createIndexes,
  createTriggers,
  createFunctions,
  createAdminUser,
  createModeratorUser,
  createTestUser
};