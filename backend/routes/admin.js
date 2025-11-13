const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const backupController = require('../controllers/backupController');
const authMiddleware = require('../middleware/auth');
const { adminAuth } = require('../middleware/adminAuth'); // Исправленный импорт

// Все админ-роуты требуют аутентификацию и права администратора
router.use(authMiddleware);
router.use(adminAuth);

// Статистика
router.get('/stats', adminController.getStats);

// Управление пользователями
router.get('/users', adminController.getUsers);
router.put('/users/:userId/role', adminController.updateUserRole);
router.put('/users/:userId/status', adminController.updateUserStatus);

// Бэкапы
router.get('/backups', backupController.listBackups);
router.post('/backups', backupController.createBackup);
router.get('/backups/:backupId/download', backupController.downloadBackup);
router.post('/backups/:backupId/restore', backupController.restoreBackup);
router.delete('/backups/:backupId', backupController.deleteBackup);

module.exports = router;