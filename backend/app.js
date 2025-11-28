// backend/app.js
const express = require('express');
const corsMiddleware = require('./middleware/cors');
const auth = require('./middleware/auth');

const app = express();

// Используем простой CORS middleware
app.use(corsMiddleware);

app.use(express.json());

// Логирование всех запросов
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Public routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/topics', require('./routes/topics'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/reports', require('./routes/reports'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running', 
    timestamp: new Date().toISOString() 
  });
});

// Protected routes
app.use('/api/admin', auth, require('./routes/admin'));
app.use('/api/moderator', auth, require('./routes/moderator'));

// Добавим логирование зарегистрированных маршрутов
app._router.stack.forEach((middleware) => {
  if (middleware.route) {
    // Routes registered directly on the app
    const methods = Object.keys(middleware.route.methods).join(', ').toUpperCase();
    console.log(`📍 ${methods} ${middleware.route.path}`);
  } else if (middleware.name === 'router') {
    // Router middleware
    console.log(`🔄 Router mounted: ${middleware.regexp}`);
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    success: false, 
    error: 'Something went wrong!' 
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🌐 Available routes:`);
  console.log(`   GET  /api/health`);
  console.log(`   GET  /api/topics`);
  console.log(`   POST /api/topics`);
  console.log(`   GET  /api/topics/:id`);
  console.log(`   GET  /api/comments/topic/:topicId`);
  console.log(`   POST /api/comments`);
  console.log(`   POST /api/reports`);
  console.log(`   GET  /api/moderator/reports`);
  console.log(`   GET  /api/moderator/reports/export/pdf`); // ДОБАВИТЬ ЭТУ СТРОКУ
});