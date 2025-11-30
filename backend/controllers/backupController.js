// backend/controllers/backupController.js
const db = require('../db/postgres');
const { exec } = require('child-process-promise');
const fs = require('fs');
const path = require('path');

const backupController = {
    // Получить список бэкапов
    async getBackups(req, res) {
        try {
            console.log('📋 Getting backups list...');

            const backups = await db.query(`
                SELECT b.*, u.username as created_by_username 
                FROM backups b
                LEFT JOIN users u ON b.created_by = u.id
                ORDER BY created_at DESC
            `);

            res.json({
                success: true,
                backups: backups.rows
            });
        } catch (error) {
            console.error('❌ Get backups error:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Ошибка получения списка бэкапов' 
            });
        }
    },

    // Создать бэкап с помощью pg_dump
    async createBackup(req, res) {
        try {
            const { name, notes } = req.body;
            const userId = req.userId;

            console.log('💾 Creating database backup...');

            // Получаем данные пользователя
            const userResult = await db.query(
                'SELECT username FROM users WHERE id = $1',
                [userId]
            );
            const username = userResult.rows[0]?.username || 'system';

            // Создаем папку для бэкапов если её нет
            const backupDir = path.join(__dirname, '../backups');
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }

            // Генерируем имя файла
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `backup-${timestamp}.sql`;
            const filePath = path.join(backupDir, filename);

            // Получаем параметры подключения из .env
            const dbConfig = {
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || 5432,
                database: process.env.DB_NAME || 'f1_forum',
                user: process.env.DB_USER || 'postgres',
                password: process.env.DB_PASSWORD || '123'
            };

            console.log('🔍 Database config:', {
                host: dbConfig.host,
                port: dbConfig.port,
                database: dbConfig.database,
                user: dbConfig.user
            });

            // Используем правильный путь к pg_dump для PostgreSQL 18
            const pgDumpPath = '"C:\\Program Files\\PostgreSQL\\18\\bin\\pg_dump.exe"';

            // Создаем бэкап с помощью pg_dump
            const dumpCommand = `${pgDumpPath} -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} -f "${filePath}"`;
            
            console.log('🚀 Executing command:', dumpCommand);
            
            await exec(dumpCommand, { 
                env: { 
                    ...process.env, 
                    PGPASSWORD: dbConfig.password 
                } 
            });

            // Получаем размер файла
            const stats = fs.statSync(filePath);
            const fileSize = stats.size;

            // Сохраняем информацию о бэкапе в базу
            const backupResult = await db.query(`
                INSERT INTO backups (filename, file_path, size, created_by, notes)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `, [filename, filePath, fileSize, userId, notes || null]);

            console.log('✅ Backup created successfully:', filename);
            console.log('📦 File size:', formatSize(fileSize));

            res.json({
                success: true,
                backup: {
                    ...backupResult.rows[0],
                    created_by_username: username
                },
                message: 'Бэкап успешно создан'
            });

        } catch (error) {
            console.error('❌ Create backup error:', error);
            
            // Детальная информация об ошибке
            let errorMessage = 'Ошибка создания бэкапа';
            
            if (error.stderr) {
                console.error('pg_dump stderr:', error.stderr);
                
                if (error.stderr.includes('does not exist')) {
                    errorMessage = `База данных "${process.env.DB_NAME}" не существует. Проверьте имя базы данных в настройках.`;
                } else if (error.stderr.includes('password authentication failed')) {
                    errorMessage = 'Ошибка аутентификации. Проверьте пароль базы данных.';
                } else if (error.stderr.includes('connection')) {
                    errorMessage = 'Ошибка подключения к базе данных. Проверьте хост и порт.';
                } else {
                    errorMessage = `Ошибка pg_dump: ${error.stderr}`;
                }
            } else {
                errorMessage = error.message;
            }
            
            res.status(500).json({ 
                success: false, 
                error: errorMessage 
            });
        }
    },

    // Скачать бэкап
    async downloadBackup(req, res) {
        try {
            const { id } = req.params;
            console.log('🎯 DOWNLOAD BACKUP STARTED - ID:', id);

            // Получаем инфу о бэкапе
            const backupResult = await db.query(
                'SELECT * FROM backups WHERE id = $1',
                [id]
            );

            console.log('📊 Found records:', backupResult.rows.length);

            if (backupResult.rows.length === 0) {
                console.log('❌ Backup not found in database');
                return res.status(404).json({ error: 'Бэкап не найден в базе данных' });
            }

            const backup = backupResult.rows[0];
            const filePath = backup.file_path;

            console.log('📁 File path:', filePath);
            console.log('📝 File name:', backup.filename);

            // Проверяем есть ли файл
            if (!fs.existsSync(filePath)) {
                console.log('❌ File does not exist on disk');
                return res.status(404).json({ error: 'Файл бэкапа не найден на сервере' });
            }

            console.log('✅ File exists, sending...');

            // Ставим заголовки
            res.setHeader('Content-Type', 'application/sql');
            res.setHeader('Content-Disposition', `attachment; filename="${backup.filename}"`);
            
            // Шлем файл
            const fileStream = fs.createReadStream(filePath);
            fileStream.pipe(res);

            console.log('🎯 File sent to client');

        } catch (error) {
            console.error('💥 Download error:', error);
            res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
        }
    },

    // Восстановить из бэкапа
    async restoreBackup(req, res) {
        try {
            const { id } = req.params;

            console.log('🔄 Restoring from backup:', id);

            // Получаем информацию о бэкапе
            const backupResult = await db.query(
                'SELECT * FROM backups WHERE id = $1',
                [id]
            );

            if (backupResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Бэкап не найден'
                });
            }

            const backup = backupResult.rows[0];
            const filePath = backup.file_path;

            // Проверяем существование файла
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({
                    success: false,
                    error: 'Файл бэкапа не найден'
                });
            }

            // Получаем параметры подключения из .env
            const dbConfig = {
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || 5432,
                database: process.env.DB_NAME || 'f1_forum',
                user: process.env.DB_USER || 'postgres',
                password: process.env.DB_PASSWORD || '123'
            };

            // Используем правильный путь к psql для PostgreSQL 18
            const psqlPath = '"C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe"';

            // Восстанавливаем базу из бэкапа
            const restoreCommand = `${psqlPath} -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} -f "${filePath}"`;
            
            console.log('🚀 Executing restore command:', restoreCommand);
            
            await exec(restoreCommand, { 
                env: { 
                    ...process.env, 
                    PGPASSWORD: dbConfig.password 
                } 
            });

            console.log('✅ Database restored successfully from:', backup.filename);

            res.json({
                success: true,
                message: 'База данных успешно восстановлена из бэкапа'
            });

        } catch (error) {
            console.error('❌ Restore backup error:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Ошибка восстановления из бэкапа: ' + error.message 
            });
        }
    },

    // Удалить бэкап
    async deleteBackup(req, res) {
        try {
            const { id } = req.params;

            console.log('🗑️ Deleting backup:', id);

            // Получаем информацию о бэкапе
            const backupResult = await db.query(
                'SELECT * FROM backups WHERE id = $1',
                [id]
            );

            if (backupResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Бэкап не найден'
                });
            }

            const backup = backupResult.rows[0];

            // Удаляем файл
            if (fs.existsSync(backup.file_path)) {
                fs.unlinkSync(backup.file_path);
            }

            // Удаляем запись из базы
            await db.query('DELETE FROM backups WHERE id = $1', [id]);

            console.log('✅ Backup deleted:', backup.filename);

            res.json({
                success: true,
                message: 'Бэкап успешно удален'
            });

        } catch (error) {
            console.error('❌ Delete backup error:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Ошибка удаления бэкапа' 
            });
        }
    }
};

// Вспомогательная функция для форматирования размера
function formatSize(bytes) {
    if (!bytes) return '0 Б';
    const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
    if (bytes === 0) return '0 Б';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

module.exports = backupController;