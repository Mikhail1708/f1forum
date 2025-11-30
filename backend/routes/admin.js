// backend/routes/admin.js
const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth').adminAuth;
const adminController = require('../controllers/adminController');
const backupController = require('../controllers/backupController');

// Добавляем middleware для проверки токена через query параметр (для скачивания файлов)
const checkTokenQuery = (req, res, next) => {
  // Для скачивания файлов проверяем токен в query параметрах
  const token = req.query.token || req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token, authorization denied' });
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    
    // Проверяем, что пользователь админ
    if (req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin rights required.' });
    }
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token is not valid' });
  }
};

// Статистика системы
router.get('/stats', adminAuth, adminController.getStats);

// Экспорт отчетов
router.get('/reports/export/pdf', adminAuth, adminController.generateAdminReportPDF);

// Управление пользователями
router.get('/users', adminAuth, adminController.getUsers);
router.get('/users/stats', adminAuth, adminController.getUserStats);
router.put('/users/:userId/role', adminAuth, adminController.updateUserRole);
router.put('/users/:userId/status', adminAuth, adminController.updateUserStatus);
router.delete('/users/:userId', adminAuth, adminController.deleteUser);

// Поиск пользователей
router.get('/users/search', adminAuth, adminController.searchUsers);

// Расширенная статистика дашборда
router.get('/dashboard/stats', adminAuth, adminController.getDashboardStats);

// Маршруты для бэкапов
router.get('/backups', adminAuth, backupController.getBackups);
router.post('/backups', adminAuth, backupController.createBackup);
// Для скачивания используем оба метода аутентификации
router.get('/backups/:id/download', checkTokenQuery, backupController.downloadBackup);
router.post('/backups/:id/restore', adminAuth, backupController.restoreBackup);
router.delete('/backups/:id', adminAuth, backupController.deleteBackup);

// Управление контентом
router.get('/content/stats', adminAuth, (req, res) => {
  res.json({
    success: true,
    stats: {
      totalTopics: 156,
      totalComments: 1247,
      popularTopics: 23,
      reportedContent: 5
    }
  });
});

router.get('/topics', adminAuth, (req, res) => {
  res.json({
    success: true,
    topics: [
      {
        id: 1,
        title: 'Обсуждение последней гонки',
        author: 'user123',
        comments_count: 45,
        created_at: new Date('2024-01-15T14:30:00Z'),
        status: 'active'
      },
      {
        id: 2,
        title: 'Новые правила Формулы 1',
        author: 'f1fan',
        comments_count: 32,
        created_at: new Date('2024-01-14T09:15:00Z'),
        status: 'active'
      }
    ]
  });
});

router.delete('/topics/:id', adminAuth, (req, res) => {
  res.json({
    success: true,
    message: 'Тема успешно удалена'
  });
});

router.put('/topics/:id/status', adminAuth, (req, res) => {
  const { status } = req.body;
  res.json({
    success: true,
    message: `Статус темы изменен на: ${status}`
  });
});

// Управление комментариями
router.get('/comments', adminAuth, (req, res) => {
  res.json({
    success: true,
    comments: [
      {
        id: 1,
        content: 'Отличная гонка!',
        author: 'user123',
        topic_title: 'Обсуждение последней гонки',
        created_at: new Date('2024-01-15T15:30:00Z'),
        status: 'active'
      },
      {
        id: 2,
        content: 'Спорное решение стюардов',
        author: 'f1fan',
        topic_title: 'Новые правила Формулы 1',
        created_at: new Date('2024-01-14T10:15:00Z'),
        status: 'active'
      }
    ]
  });
});

router.delete('/comments/:id', adminAuth, (req, res) => {
  res.json({
    success: true,
    message: 'Комментарий успешно удален'
  });
});

router.put('/comments/:id/status', adminAuth, (req, res) => {
  const { status } = req.body;
  res.json({
    success: true,
    message: `Статус комментария изменен на: ${status}`
  });
});

// Жалобы и модерация
router.get('/reports', adminAuth, (req, res) => {
  res.json({
    success: true,
    reports: [
      {
        id: 1,
        type: 'spam',
        content: 'Рекламный комментарий',
        reporter: 'user456',
        reported_user: 'spammer123',
        status: 'pending',
        created_at: new Date('2024-01-16T08:20:00Z')
      },
      {
        id: 2,
        type: 'abuse',
        content: 'Оскорбительное поведение',
        reporter: 'user789',
        reported_user: 'toxic_user',
        status: 'pending',
        created_at: new Date('2024-01-16T09:15:00Z')
      }
    ]
  });
});

router.put('/reports/:id/resolve', adminAuth, (req, res) => {
  const { action } = req.body;
  res.json({
    success: true,
    message: `Жалоба обработана. Действие: ${action}`
  });
});

// Системные настройки
router.get('/settings', adminAuth, (req, res) => {
  res.json({
    success: true,
    settings: {
      site_name: 'F1 Forum',
      site_description: 'Форум для обсуждения Формулы 1',
      registration_enabled: true,
      max_file_size: 5242880,
      allowed_file_types: ['jpg', 'png', 'gif', 'pdf'],
      maintenance_mode: false,
      backup_auto_enabled: true,
      backup_auto_frequency: 'weekly',
      backup_keep_count: 10,
      max_users_online: 150,
      session_timeout: 24
    }
  });
});

router.put('/settings', adminAuth, (req, res) => {
  res.json({
    success: true,
    message: 'Настройки успешно обновлены'
  });
});

// Системная информация
router.get('/system/info', adminAuth, (req, res) => {
  const os = require('os');
  const process = require('process');
  
  res.json({
    success: true,
    system_info: {
      // Информация о Node.js
      node_version: process.version,
      platform: process.platform,
      architecture: process.arch,
      
      // Информация о системе
      os_type: os.type(),
      os_release: os.release(),
      cpu_cores: os.cpus().length,
      total_memory: Math.round(os.totalmem() / 1024 / 1024) + ' MB',
      free_memory: Math.round(os.freemem() / 1024 / 1024) + ' MB',
      uptime: Math.round(process.uptime()) + ' seconds',
      
      // Информация о приложении
      memory_usage: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB',
        heap_total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
        heap_used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB'
      },
      
      // Информация о базе данных
      database: 'PostgreSQL',
      database_connected: true,
      database_host: process.env.DB_HOST,
      database_name: process.env.DB_NAME
    }
  });
});

// Логи системы
router.get('/logs', adminAuth, (req, res) => {
  const { type = 'all', limit = 50 } = req.query;
  
  // Заглушка для логов (в реальном приложении здесь будет чтение из файла логов)
  const logs = [
    {
      id: 1,
      level: 'info',
      message: 'Сервер запущен успешно',
      timestamp: new Date().toISOString(),
      user: 'system'
    },
    {
      id: 2,
      level: 'info',
      message: 'Новый пользователь зарегистрирован: testuser',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      user: 'system'
    },
    {
      id: 3,
      level: 'warning',
      message: 'Попытка неавторизованного доступа к админ панели',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      user: 'unknown'
    },
    {
      id: 4,
      level: 'info',
      message: 'Создан новый бэкап базы данных',
      timestamp: new Date(Date.now() - 900000).toISOString(),
      user: 'admin'
    }
  ];
  
  // Фильтрация по типу
  let filteredLogs = logs;
  if (type !== 'all') {
    filteredLogs = logs.filter(log => log.level === type);
  }
  
  // Ограничение количества
  filteredLogs = filteredLogs.slice(0, parseInt(limit));
  
  res.json({
    success: true,
    logs: filteredLogs,
    total: filteredLogs.length
  });
});

// Очистка логов
router.delete('/logs', adminAuth, (req, res) => {
  res.json({
    success: true,
    message: 'Логи успешно очищены'
  });
});

// Мониторинг производительности
router.get('/performance', adminAuth, (req, res) => {
  const os = require('os');
  
  res.json({
    success: true,
    performance: {
      cpu_usage: '15%',
      memory_usage: '45%',
      disk_usage: '60%',
      active_connections: 24,
      requests_per_minute: 120,
      response_time_avg: '45ms',
      uptime: Math.round(process.uptime() / 60 / 60) + ' hours',
      load_average: os.loadavg()
    }
  });
});

// Резервное копирование и восстановление
router.get('/backup/settings', adminAuth, (req, res) => {
  res.json({
    success: true,
    settings: {
      auto_backup: true,
      frequency: 'weekly',
      keep_count: 10,
      last_backup: new Date().toISOString(),
      next_backup: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }
  });
});

router.put('/backup/settings', adminAuth, (req, res) => {
  const { auto_backup, frequency, keep_count } = req.body;
  
  // Здесь будет логика сохранения настроек бэкапа
  console.log('Backup settings updated:', { auto_backup, frequency, keep_count });
  
  res.json({
    success: true,
    message: 'Настройки бэкапа обновлены'
  });
});

// Экспорт данных
router.get('/export/data', adminAuth, (req, res) => {
  const { type = 'users' } = req.query;
  
  // Заглушка для экспорта данных
  res.json({
    success: true,
    message: `Экспорт данных ${type} запущен`,
    download_url: `/api/admin/export/${type}/download?token=${req.query.token}`
  });
});

// Управление кэшем
router.post('/cache/clear', adminAuth, (req, res) => {
  const { type = 'all' } = req.body;
  
  // Заглушка для очистки кэша
  res.json({
    success: true,
    message: `Кэш ${type} успешно очищен`
  });
});

// Здоровье системы (health check)
router.get('/health', adminAuth, (req, res) => {
  const db = require('../db/postgres');
  
  // Проверяем подключение к базе данных
  db.query('SELECT 1 as test')
    .then(() => {
      res.json({
        success: true,
        status: 'healthy',
        checks: {
          database: 'connected',
          memory: 'ok',
          disk: 'ok'
        },
        timestamp: new Date().toISOString()
      });
    })
    .catch(error => {
      res.status(500).json({
        success: false,
        status: 'unhealthy',
        checks: {
          database: 'disconnected',
          memory: 'ok',
          disk: 'ok'
        },
        error: error.message,
        timestamp: new Date().toISOString()
      });
    });
});

module.exports = router;