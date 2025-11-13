-- Создание базы данных (выполнить вручную)
-- CREATE DATABASE f1_forum;

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(45) UNIQUE NOT NULL,
    email VARCHAR(45) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    favorite_team VARCHAR(45),
    favorite_driver VARCHAR(45),
    role VARCHAR(20) DEFAULT 'user',
    status VARCHAR(20) DEFAULT 'active',
    is_moderator BOOLEAN DEFAULT false,
    is_banned BOOLEAN DEFAULT false,
    last_login TIMESTAMP,
    login_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    avatar_url VARCHAR(255)
);

-- Таблица категорий
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(45) NOT NULL,
    description TEXT,
    slug VARCHAR(45) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица обсуждений
CREATE TABLE IF NOT EXISTS topics (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[],
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL
);

-- Таблица комментариев
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE
);

-- Таблица лайков тем
CREATE TABLE IF NOT EXISTS topic_likes (
    id SERIAL PRIMARY KEY,
    topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(topic_id, user_id)
);

-- Таблица лайков комментариев
CREATE TABLE IF NOT EXISTS comment_likes (
    id SERIAL PRIMARY KEY,
    comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(comment_id, user_id)
);

-- Таблица Гран-при
CREATE TABLE IF NOT EXISTS grand_prix (
    id SERIAL PRIMARY KEY,
    name VARCHAR(45) NOT NULL,
    country VARCHAR(45) NOT NULL,
    circuit VARCHAR(45) NOT NULL,
    race_date DATE NOT NULL,
    year INTEGER NOT NULL,
    round VARCHAR(45) NOT NULL
);

-- Таблица бэкапов
CREATE TABLE IF NOT EXISTS backups (
    id SERIAL PRIMARY KEY,
    filename TEXT NOT NULL,
    filepath TEXT NOT NULL,
    size INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    type TEXT DEFAULT 'full',
    notes TEXT
);

-- Создание администратора
INSERT INTO users (username, email, password_hash, role, is_moderator) 
VALUES ('admin', 'admin@f1forum.com', '$2a$10$8K1p/a0dRTlB0.Z6CQc.eeQMj6K.Ck6QcJ.z.B.X.2x5LdQ3qYvW2', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- Создание тестовой категории
INSERT INTO categories (name, description, slug) 
VALUES ('Формула 1', 'Обсуждения Формулы 1', 'formula-1')
ON CONFLICT (slug) DO NOTHING;

-- Индексы для улучшения производительности
CREATE INDEX IF NOT EXISTS idx_topics_user_id ON topics(user_id);
CREATE INDEX IF NOT EXISTS idx_topics_created_at ON topics(created_at);
CREATE INDEX IF NOT EXISTS idx_comments_topic_id ON comments(topic_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_topic_likes_topic_user ON topic_likes(topic_id, user_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_user ON comment_likes(comment_id, user_id);