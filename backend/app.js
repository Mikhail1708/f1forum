const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Импорт роутов
const authRoutes = require('./routes/auth');
const topicRoutes = require('./routes/topics');
const commentRoutes = require('./routes/comments');
const categoryRoutes = require('./routes/categories');
const grandPrixRoutes = require('./routes/grandPrix');

// Роуты API
app.use('/api/auth', authRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/grand-prix', grandPrixRoutes);

// Статические файлы (если нужно)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 10002;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;