const express = require('express');
const cors = require('cors');
const path = require('path');

// Загружаем .env файл
require('dotenv').config();

console.log('🚀 Starting F1 Forum Backend with PostgreSQL...');

const app = express();

// Подробная настройка CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Обработка preflight запросов
app.options('*', cors());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Импорт роутов
const authRoutes = require('./routes/auth');
const topicRoutes = require('./routes/topics');
const commentRoutes = require('./routes/comments');
const categoryRoutes = require('./routes/categories');
const grandPrixRoutes = require('./routes/grandPrix');
const adminRoutes = require('./routes/admin');

// Роуты API
app.use('/api/auth', authRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/grand-prix', grandPrixRoutes);
app.use('/api/admin', adminRoutes);

// Статические файлы
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Роут для проверки работы сервера
app.get('/api/health', async (req, res) => {
  try {
    const db = require('./db/postgres');
    await db.query('SELECT 1');
    res.json({ 
      status: 'OK', 
      message: 'Server is running with PostgreSQL',
      database: 'Connected'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Database connection failed',
      error: error.message 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 PostgreSQL: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;