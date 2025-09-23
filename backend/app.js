const express = require('express');
const { runMigrations } = require('./migrations/migrate');
const cors = require('cors');
require('dotenv').config();

// Импортируем роуты
const routes = require('./routes/index');

const app = express();
const PORT = process.env.PORT || 10002;

// Middleware
app.use(cors());
app.use(express.json());

// Подключаем роуты
app.use('/api', routes);

// Запуск сервера с миграциями
app.listen(PORT, async () => {
  console.log(`🚗 Сервер F1 Forum запущен на порту ${PORT}`);
  console.log(`📍 http://192.168.100.72:${PORT}`);
  
  // Запускаем миграции при старте сервера
  try {
    await runMigrations();
    console.log('✅ Миграции успешно выполнены');
  } catch (error) {
    console.error('❌ Ошибка при выполнении миграций:', error);
  }
});