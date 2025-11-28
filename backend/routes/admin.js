// backend/routes/admin.js
const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth').adminAuth;
const adminController = require('../controllers/adminController');

// Статистика системы
router.get('/stats', adminAuth, adminController.getStats);
// Добавьте в admin.js после импортов
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

// Заглушки для бэкапов (будут реализованы позже)
router.get('/backups', adminAuth, (req, res) => {
  res.json({
    success: true,
    backups: [
      {
        id: 1,
        filename: 'backup-2024-01-15.sql',
        created_at: new Date('2024-01-15T10:30:00Z'),
        size: 2048576,
        created_by_username: 'system',
        notes: 'Автоматический бэкап'
      },
      {
        id: 2,
        filename: 'backup-2024-01-14.sql',
        created_at: new Date('2024-01-14T10:30:00Z'),
        size: 2048000,
        created_by_username: 'system',
        notes: 'Автоматический бэкап'
      }
    ]
  });
});

router.post('/backups', adminAuth, (req, res) => {
  const { name, notes } = req.body;
  
  const newBackup = {
    id: Date.now(),
    filename: `backup-${name || new Date().toISOString().split('T')[0]}.sql`,
    created_at: new Date().toISOString(),
    size: Math.floor(Math.random() * 1000000) + 1000000,
    created_by_username: req.user.username,
    notes: notes || 'Ручной бэкап'
  };
  
  res.json({
    success: true,
    backup: newBackup,
    message: 'Бэкап успешно создан'
  });
});

router.post('/backups/:id/restore', adminAuth, (req, res) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    message: `Бэкап #${id} успешно восстановлен`
  });
});

router.get('/backups/:id/download', adminAuth, (req, res) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    message: `Начато скачивание бэкапа #${id}`,
    download_url: `/backups/${id}/file`
  });
});

router.delete('/backups/:id', adminAuth, (req, res) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    message: `Бэкап #${id} успешно удален`
  });
});

// Заглушки для управления контентом
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

// Заглушки для системных настроек
router.get('/settings', adminAuth, (req, res) => {
  res.json({
    success: true,
    settings: {
      site_name: 'F1 Forum',
      site_description: 'Форум для обсуждения Формулы 1',
      registration_enabled: true,
      max_file_size: 5242880,
      allowed_file_types: ['jpg', 'png', 'gif', 'pdf'],
      maintenance_mode: false
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
  res.json({
    success: true,
    system_info: {
      node_version: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      memory_usage: process.memoryUsage(),
      database: 'PostgreSQL',
      database_connected: true
    }
  });
});

// Логи системы
router.get('/logs', adminAuth, (req, res) => {
  res.json({
    success: true,
    logs: [
      {
        id: 1,
        level: 'info',
        message: 'Сервер запущен успешно',
        timestamp: new Date().toISOString()
      },
      {
        id: 2,
        level: 'info',
        message: 'Новый пользователь зарегистрирован',
        timestamp: new Date(Date.now() - 300000).toISOString()
      }
    ]
  });
});

module.exports = router;