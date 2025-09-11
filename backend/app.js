// backend/app.js
const express = require('express');
const { runMigrations } = require('./migrations/migrate');
const cors = require('cors');
require('dotenv').config();

// Импортируем роуты ✅ ДОБАВЬТЕ ЭТУ СТРОЧКУ
const routes = require('./routes/index');

const app = express();
const PORT = process.env.PORT || 10002;

// Middleware
app.use(cors());
app.use(express.json());

// Подключаем роуты ✅ ДОБАВЬТЕ ЭТУ СТРОЧКУ
app.use('/api', routes);

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚗 Сервер F1 Forum запущен на порту ${PORT}`);
  console.log(`📍 http://192.168.100.72:${PORT}`);
});
//запуск миграций
app.listen(PORT, async () => {
  console.log(`🚗 Сервер F1 Forum запущен на порту ${PORT}`);
  console.log(`📍 http://192.168.100.72:${PORT}`);
  
  // Запускаем миграции при старте сервера
  await runMigrations();
});