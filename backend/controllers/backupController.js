const fs = require('fs');
const path = require('path');
const db = require('../db/db');

const backupController = {
  // Создание бэкапа
  async createBackup(req, res) {
    try {
      const { name, notes } = req.body;
      const backupDir = path.join(__dirname, '../backups');

      // Создаем папку backups если её нет
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `backup-${timestamp}-${name || 'manual'}.db`;
      const backupPath = path.join(backupDir, backupFileName);

      // Копируем файл базы данных
      const currentDbPath = path.join(__dirname, '../database.db');
      fs.copyFileSync(currentDbPath, backupPath);

      const stats = fs.statSync(backupPath);

      // Записываем информацию о бэкапе в БД
      const backupId = await new Promise((resolve, reject) => {
        const sql = `INSERT INTO backups (filename, filepath, size, type, notes, created_by) VALUES (?, ?, ?, 'full', ?, ?)`;
        db.run(sql, [backupFileName, backupPath, stats.size, notes, req.user.id], function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        });
      });

      res.json({
        success: true,
        backup: {
          id: backupId,
          filename: backupFileName,
          path: backupPath,
          size: stats.size,
          createdAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error creating backup:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Список бэкапов
  async listBackups(req, res) {
    try {
      const backups = await new Promise((resolve, reject) => {
        const sql = `
          SELECT b.*, u.username as created_by_username 
          FROM backups b 
          LEFT JOIN user u ON b.created_by = u.id 
          ORDER BY b.created_at DESC
        `;
        db.all(sql, [], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      res.json({ success: true, backups });
    } catch (error) {
      console.error('Error listing backups:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Скачивание бэкапа
  async downloadBackup(req, res) {
    try {
      const { backupId } = req.params;

      const backup = await new Promise((resolve, reject) => {
        const sql = "SELECT * FROM backups WHERE id = ?";
        db.get(sql, [backupId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (!backup) {
        return res.status(404).json({ success: false, error: 'Backup not found' });
      }

      if (!fs.existsSync(backup.filepath)) {
        return res.status(404).json({ success: false, error: 'Backup file not found' });
      }

      res.download(backup.filepath, backup.filename);
    } catch (error) {
      console.error('Error downloading backup:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Удаление бэкапа
  async deleteBackup(req, res) {
    try {
      const { backupId } = req.params;

      const backup = await new Promise((resolve, reject) => {
        const sql = "SELECT * FROM backups WHERE id = ?";
        db.get(sql, [backupId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (!backup) {
        return res.status(404).json({ success: false, error: 'Backup not found' });
      }

      // Удаляем файл
      if (fs.existsSync(backup.filepath)) {
        fs.unlinkSync(backup.filepath);
      }

      // Удаляем запись из БД
      await new Promise((resolve, reject) => {
        const sql = "DELETE FROM backups WHERE id = ?";
        db.run(sql, [backupId], function(err) {
          if (err) reject(err);
          else resolve();
        });
      });

      res.json({ success: true, message: 'Backup deleted' });
    } catch (error) {
      console.error('Error deleting backup:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Восстановление из бэкапа
  async restoreBackup(req, res) {
    try {
      const { backupId } = req.params;

      const backup = await new Promise((resolve, reject) => {
        const sql = "SELECT * FROM backups WHERE id = ?";
        db.get(sql, [backupId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (!backup) {
        return res.status(404).json({ success: false, error: 'Backup not found' });
      }

      if (!fs.existsSync(backup.filepath)) {
        return res.status(404).json({ success: false, error: 'Backup file not found' });
      }

      const currentDbPath = path.join(__dirname, '../database.db');
      const tempBackupPath = path.join(__dirname, '../database.db.temp');

      // Создаем временную копию текущей БД
      fs.copyFileSync(currentDbPath, tempBackupPath);

      try {
        // Заменяем текущую БД на бэкап
        fs.copyFileSync(backup.filepath, currentDbPath);
        res.json({ success: true, message: 'Database restored successfully' });
      } catch (error) {
        // В случае ошибки восстанавливаем из временной копии
        fs.copyFileSync(tempBackupPath, currentDbPath);
        throw error;
      } finally {
        // Удаляем временную копию
        if (fs.existsSync(tempBackupPath)) {
          fs.unlinkSync(tempBackupPath);
        }
      }
    } catch (error) {
      console.error('Error restoring backup:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

module.exports = backupController;