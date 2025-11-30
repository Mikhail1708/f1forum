// backend/controllers/adminController.js
const db = require('../db/postgres');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Обновленная функция получения активности с именами пользователей
async function getRecentActivity(limit = 15) {
    try {
        const activityQuery = `
            -- Последние зарегистрированные пользователи
            (SELECT 
                'user' as type,
                username as title,
                CONCAT('Зарегистрировался: ', username) as description,
                created_at as activity_date,
                id as item_id,
                username as actor_username
            FROM users 
            ORDER BY created_at DESC 
            LIMIT 5)
            
            UNION ALL
            
            -- Последние созданные темы с именами авторов
            (SELECT 
                'topic' as type,
                t.title,
                CONCAT('Создал тему: ', u.username) as description,
                t.created_at as activity_date,
                t.id as item_id,
                u.username as actor_username
            FROM topics t
            LEFT JOIN users u ON t.user_id = u.id
            ORDER BY t.created_at DESC 
            LIMIT 5)
            
            UNION ALL
            
            -- Последние комментарии с именами авторов
            (SELECT 
                'comment' as type,
                LEFT(c.content, 50) as title,
                CONCAT('Оставил комментарий: ', u.username) as description,
                c.created_at as activity_date,
                c.id as item_id,
                u.username as actor_username
            FROM comments c
            LEFT JOIN users u ON c.user_id = u.id
            ORDER BY c.created_at DESC 
            LIMIT 5)
            
            UNION ALL
            
            -- Обработанные жалобы
            (SELECT 
                'report' as type,
                CONCAT('Жалоба #', r.id) as title,
                CONCAT('Обработал модератор: ', u.username) as description,
                r.resolved_at as activity_date,
                r.id as item_id,
                u.username as actor_username
            FROM reports r
            LEFT JOIN users u ON r.moderator_id = u.id
            WHERE r.status = 'resolved' AND r.resolved_at IS NOT NULL
            ORDER BY r.resolved_at DESC 
            LIMIT 5)
            
            ORDER BY activity_date DESC 
            LIMIT $1
        `;

        const { rows } = await db.query(activityQuery, [limit]);
        return rows;

    } catch (error) {
        console.error('❌ Recent activity error:', error);
        return [];
    }
}

// Функция для получения логов системы
async function getSystemLogs(limit = 50) {
    try {
        const logsQuery = `
            SELECT 
                id,
                level,
                message,
                created_at,
                user_id,
                action_type
            FROM system_logs 
            ORDER BY created_at DESC 
            LIMIT $1
        `;

        const { rows } = await db.query(logsQuery, [limit]);
        return rows;
    } catch (error) {
        console.error('❌ System logs error:', error);
        return [];
    }
}

// Функция для получения подробной статистики
async function getDetailedStats(startDate, endDate) {
    try {
        const statsQuery = `
            SELECT 
                -- Статистика пользователей
                (SELECT COUNT(*) FROM users) as total_users,
                (SELECT COUNT(*) FROM users WHERE created_at >= $1 AND created_at <= $2) as new_users_period,
                (SELECT COUNT(*) FROM users WHERE role = 'admin') as admin_count,
                (SELECT COUNT(*) FROM users WHERE role = 'moderator') as moderator_count,
                (SELECT COUNT(*) FROM users WHERE status = 'active') as active_users,
                (SELECT COUNT(*) FROM users WHERE status = 'banned') as banned_users,
                
                -- Статистика контента
                (SELECT COUNT(*) FROM topics) as total_topics,
                (SELECT COUNT(*) FROM topics WHERE created_at >= $1 AND created_at <= $2) as new_topics_period,
                (SELECT COUNT(*) FROM comments) as total_comments,
                (SELECT COUNT(*) FROM comments WHERE created_at >= $1 AND created_at <= $2) as new_comments_period,
                
                -- Статистика жалоб
                (SELECT COUNT(*) FROM reports) as total_reports,
                (SELECT COUNT(*) FROM reports WHERE created_at >= $1 AND created_at <= $2) as new_reports_period,
                (SELECT COUNT(*) FROM reports WHERE status = 'resolved') as resolved_reports,
                (SELECT COUNT(*) FROM reports WHERE status = 'pending') as pending_reports
        `;

        const { rows } = await db.query(statsQuery, [startDate, endDate]);
        return rows[0] || {};
    } catch (error) {
        console.error('❌ Detailed stats error:', error);
        return {};
    }
}

const adminController = {
    async getStats(req, res) {
    try {
        console.log('📊 Getting admin stats...');
        
        // Получаем текущую дату для фильтрации "сегодня"
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        
        // Получаем дату неделю назад
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Выполняем все запросы параллельно для скорости
        const [
            usersData,
            topicsData, 
            commentsData,
            reportsData,
            newUsersToday,
            newTopicsToday,
            newCommentsToday,
            userStats,
            onlineUsersCount
        ] = await Promise.all([
            // Общая статистика пользователей
            db.query(`
                SELECT 
                    COUNT(*) as total_users,
                    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
                    COUNT(CASE WHEN role = 'moderator' THEN 1 END) as moderator_count,
                    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
                    COUNT(CASE WHEN status = 'banned' THEN 1 END) as banned_users,
                    COUNT(CASE WHEN created_at >= $1 THEN 1 END) as new_users_week
                FROM users
            `, [weekAgo]),
            
            // Статистика тем
            db.query(`
                SELECT 
                    COUNT(*) as total_topics,
                    SUM(views) as total_views,
                    SUM(likes) as total_likes,
                    COUNT(CASE WHEN created_at >= $1 THEN 1 END) as new_topics_week
                FROM topics
            `, [weekAgo]),
            
            // Статистика комментариев
            db.query(`
                SELECT 
                    COUNT(*) as total_comments,
                    SUM(likes) as total_comment_likes,
                    COUNT(CASE WHEN created_at >= $1 THEN 1 END) as new_comments_week
                FROM comments
            `, [weekAgo]),
            
            // Статистика жалоб
            db.query(`
                SELECT 
                    COUNT(*) as total_reports,
                    COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_reports,
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_reports,
                    COUNT(CASE WHEN created_at >= $1 THEN 1 END) as new_reports_week
                FROM reports
            `, [weekAgo]),
            
            // Новые пользователи за сегодня
            db.query(
                `SELECT COUNT(*) as count FROM users 
                 WHERE created_at >= $1 AND created_at < $2`,
                [todayStart, todayEnd]
            ),
            
            // Новые темы за сегодня
            db.query(
                `SELECT COUNT(*) as count FROM topics 
                 WHERE created_at >= $1 AND created_at < $2`,
                [todayStart, todayEnd]
            ),
            
            // Новые комментарии за сегодня
            db.query(
                `SELECT COUNT(*) as count FROM comments 
                 WHERE created_at >= $1 AND created_at < $2`,
                [todayStart, todayEnd]
            ),
            
            // Дополнительная статистика пользователей
            db.query(`
                SELECT 
                    COUNT(CASE WHEN last_login >= $1 THEN 1 END) as active_today,
                    AVG(EXTRACT(EPOCH FROM (NOW() - created_at))/86400)::integer as avg_account_age_days
                FROM users
            `, [todayStart]),
            
            // Пользователи онлайн (за последние 15 минут)
            db.query(`
                SELECT COUNT(*) as count FROM users 
                WHERE last_login >= NOW() - INTERVAL '15 minutes'
            `)
        ]);

        // Формируем объект статистики
        const stats = {
            // Основные показатели
            totalUsers: parseInt(usersData.rows[0].total_users),
            totalTopics: parseInt(topicsData.rows[0].total_topics),
            totalComments: parseInt(commentsData.rows[0].total_comments),
            totalReports: parseInt(reportsData.rows[0].total_reports),
            
            // Активность сегодня
            newUsersToday: parseInt(newUsersToday.rows[0].count),
            newTopicsToday: parseInt(newTopicsToday.rows[0].count),
            newCommentsToday: parseInt(newCommentsToday.rows[0].count),
            
            // Детальная статистика пользователей
            admin_count: parseInt(usersData.rows[0].admin_count),
            moderator_count: parseInt(usersData.rows[0].moderator_count),
            active_users: parseInt(usersData.rows[0].active_users),
            banned_users: parseInt(usersData.rows[0].banned_users),
            new_users_week: parseInt(usersData.rows[0].new_users_week),
            active_today: parseInt(userStats.rows[0].active_today),
            avg_account_age_days: parseInt(userStats.rows[0].avg_account_age_days),
            online_users: parseInt(onlineUsersCount.rows[0].count),
            
            // Статистика контента
            total_views: parseInt(topicsData.rows[0].total_views || 0),
            total_likes: parseInt(topicsData.rows[0].total_likes || 0),
            total_comment_likes: parseInt(commentsData.rows[0].total_comment_likes || 0),
            new_topics_week: parseInt(topicsData.rows[0].new_topics_week),
            new_comments_week: parseInt(commentsData.rows[0].new_comments_week),
            
            // Статистика модерации
            resolved_reports: parseInt(reportsData.rows[0].resolved_reports),
            pending_reports: parseInt(reportsData.rows[0].pending_reports),
            new_reports_week: parseInt(reportsData.rows[0].new_reports_week)
        };

        console.log('📊 Real database stats loaded:', stats);

        // Получаем последнюю активность
        const recentActivity = await getRecentActivity(10);

        res.json({
            success: true,
            stats: stats,
            recentActivity: recentActivity
        });

    } catch (error) {
        console.error('❌ Stats error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            details: 'Database query failed'
        });
    }
},


    // Генерация PDF отчета для админки
    async generateAdminReportPDF(req, res) {
        try {
            const { start_date, end_date, report_type = 'overview' } = req.query;
            
            console.log('📊 Generating admin PDF report:', { start_date, end_date, report_type });

            // Получаем данные в зависимости от типа отчета
            let stats = {};
            let activity = [];
            let logs = [];
            let reportTitle = '';

            switch (report_type) {
                case 'overview':
                    stats = await getDetailedStats(start_date, end_date);
                    activity = await getRecentActivity();
                    logs = await getSystemLogs(20);
                    reportTitle = 'Общий отчет системы';
                    break;
                    
                case 'users':
                    stats = await getDetailedStats(start_date, end_date);
                    reportTitle = 'Отчет по пользователям';
                    break;
                    
                case 'content':
                    stats = await getDetailedStats(start_date, end_date);
                    reportTitle = 'Отчет по контенту';
                    break;
                    
                default:
                    stats = await getDetailedStats(start_date, end_date);
                    activity = await getRecentActivity();
                    reportTitle = 'Системный отчет';
            }

            // Создаем PDF документ
            const doc = new PDFDocument();
            
            // Устанавливаем заголовки для скачивания
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 
                `attachment; filename="admin_report_${new Date().toISOString().split('T')[0]}.pdf"`);

            // Пайпим PDF в ответ
            doc.pipe(res);

            // Регистрируем кастомный шрифт для поддержки кириллицы
            try {
                const fontPath = path.join(__dirname, '../fonts/arial unicode ms.otf');
                if (fs.existsSync(fontPath)) {
                    doc.font(fontPath);
                    console.log('✅ Using custom Arial Unicode MS font for Cyrillic support');
                } else {
                    doc.font('Times-Roman');
                    console.log('⚠️ Custom font not found, using Times-Roman');
                }
            } catch (fontError) {
                console.error('❌ Font error, using Times-Roman:', fontError);
                doc.font('Times-Roman');
            }

            // Заголовок документа
            doc.fontSize(20)
               .fillColor('#2c3e50')
               .text(reportTitle, 50, 50)
               .moveDown(0.5);

            doc.fontSize(12)
               .fillColor('#666')
               .text(`Период: ${start_date || 'все время'} - ${end_date || 'по настоящее время'}`)
               .text(`Тип отчета: ${report_type}`)
               .text(`Сгенерировано: ${new Date().toLocaleString('ru-RU')}`)
               .text(`Сгенерировал: Администратор`)
               .moveDown();

            let yPosition = 150;

            // Раздел статистики
            doc.fontSize(16)
               .fillColor('#2c3e50')
               .text('📊 Статистика системы', 50, yPosition)
               .moveDown(0.5);

            yPosition = doc.y;

            // Статистика пользователей
            doc.fontSize(12)
               .fillColor('#333')
               .text(`👥 Пользователи:`, 50, yPosition)
               .text(`   Всего пользователей: ${stats.total_users || 0}`, 70, doc.y + 15)
               .text(`   Новых за период: ${stats.new_users_period || 0}`, 70, doc.y + 15)
               .text(`   Администраторов: ${stats.admin_count || 0}`, 70, doc.y + 15)
               .text(`   Модераторов: ${stats.moderator_count || 0}`, 70, doc.y + 15)
               .text(`   Активных: ${stats.active_users || 0}`, 70, doc.y + 15)
               .text(`   Заблокированных: ${stats.banned_users || 0}`, 70, doc.y + 15)
               .moveDown(0.3);

            // Статистика контента
            doc.text(`📝 Контент:`, 50, doc.y)
               .text(`   Всего тем: ${stats.total_topics || 0}`, 70, doc.y + 15)
               .text(`   Новых тем за период: ${stats.new_topics_period || 0}`, 70, doc.y + 15)
               .text(`   Всего комментариев: ${stats.total_comments || 0}`, 70, doc.y + 15)
               .text(`   Новых комментариев за период: ${stats.new_comments_period || 0}`, 70, doc.y + 15)
               .moveDown(0.3);

            // Статистика жалоб
            doc.text(`🚨 Жалобы:`, 50, doc.y)
               .text(`   Всего жалоб: ${stats.total_reports || 0}`, 70, doc.y + 15)
               .text(`   Новых жалоб за период: ${stats.new_reports_period || 0}`, 70, doc.y + 15)
               .text(`   Решенных жалоб: ${stats.resolved_reports || 0}`, 70, doc.y + 15)
               .text(`   Ожидающих обработки: ${stats.pending_reports || 0}`, 70, doc.y + 15)
               .moveDown(0.5);

            // Раздел последней активности (если есть)
            if (activity.length > 0) {
                if (doc.y > 650) {
                    doc.addPage();
                    yPosition = 50;
                }

                doc.fontSize(16)
                   .fillColor('#2c3e50')
                   .text('🔄 Последняя активность', 50, doc.y)
                   .moveDown(0.3);

                activity.forEach((item, index) => {
                    if (doc.y > 700) {
                        doc.addPage();
                    }

                    doc.fontSize(10)
                       .fillColor('#333')
                       .text(`${getActivityIcon(item.type)} ${item.description}: "${item.title}"`, 50, doc.y)
                       .text(`   Дата: ${new Date(item.activity_date).toLocaleString('ru-RU')}`, 70, doc.y + 12)
                       .moveDown(0.2);

                    if (index < activity.length - 1) {
                        doc.moveTo(50, doc.y)
                           .lineTo(550, doc.y)
                           .strokeColor('#eee')
                           .lineWidth(0.5)
                           .stroke();
                        doc.moveDown(0.2);
                    }
                });
            }

            // Раздел логов системы (если есть)
            if (logs.length > 0 && report_type === 'overview') {
                if (doc.y > 600) {
                    doc.addPage();
                    yPosition = 50;
                }

                doc.fontSize(16)
                   .fillColor('#2c3e50')
                   .text('📋 Системные логи', 50, doc.y)
                   .moveDown(0.3);

                logs.forEach((log, index) => {
                    if (doc.y > 700) {
                        doc.addPage();
                    }

                    const logColor = getLogColor(log.level);
                    
                    doc.fontSize(9)
                       .fillColor(logColor)
                       .text(`[${log.level.toUpperCase()}] ${new Date(log.created_at).toLocaleString('ru-RU')}`, 50, doc.y)
                       .fillColor('#333')
                       .text(`   ${log.message}`, 70, doc.y + 10)
                       .moveDown(0.15);

                    if (index < logs.length - 1) {
                        doc.moveTo(50, doc.y)
                           .lineTo(550, doc.y)
                           .strokeColor('#f0f0f0')
                           .lineWidth(0.3)
                           .stroke();
                        doc.moveDown(0.1);
                    }
                });
            }

            // Футер
            doc.addPage();
            doc.fontSize(10)
               .fillColor('#666')
               .text('--- Конец отчета ---', 50, 50)
               .text('Сгенерировано автоматически системой F1 Forum', 50, 70)
               .text(`Всего страниц: ${doc.bufferedPageRange().count || 1}`, 50, 85);

            // Завершаем документ
            doc.end();

        } catch (error) {
            console.error('❌ Generate admin PDF error:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Ошибка генерации PDF отчета: ' + error.message 
            });
        }
    },

    // Остальные методы остаются без изменений...
    async getUsers(req, res) {
        try {
            const { page = 1, limit = 20, search = '' } = req.query;
            const offset = (page - 1) * limit;

            let usersQuery = `
                SELECT id, username, email, role, status, created_at, favorite_team, favorite_driver
                FROM users 
            `;
            
            let countQuery = `SELECT COUNT(*) as count FROM users`;
            let queryParams = [];

            // Добавляем поиск если есть
            if (search) {
                usersQuery += ` WHERE username ILIKE $1 OR email ILIKE $1 `;
                countQuery += ` WHERE username ILIKE $1 OR email ILIKE $1 `;
                queryParams.push(`%${search}%`);
            }

            usersQuery += ` ORDER BY created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
            queryParams.push(parseInt(limit), offset);

            const users = await db.query(usersQuery, queryParams);
            const totalUsers = await db.query(countQuery, search ? [`%${search}%`] : []);

            res.json({
                success: true,
                users: users.rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit), 
                    total: parseInt(totalUsers.rows[0].count)
                }
            });
        } catch (error) {
            console.error('❌ Users error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    async getUserStats(req, res) {
        try {
            const stats = await db.query(`
                SELECT 
                    COUNT(*) as total_users,
                    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
                    COUNT(CASE WHEN role = 'moderator' THEN 1 END) as moderator_count,
                    COUNT(CASE WHEN status = 'banned' THEN 1 END) as banned_count
                FROM users
            `);

            res.json({
                success: true,
                stats: stats.rows[0]
            });
        } catch (error) {
            console.error('❌ User stats error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    async updateUserRole(req, res) {
        try {
            const { userId } = req.params;
            const { role } = req.body;

            await db.query(
                "UPDATE users SET role = $1 WHERE id = $2",
                [role, userId]
            );

            res.json({ success: true, message: 'User role updated' });
        } catch (error) {
            console.error('❌ Role update error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    async updateUserStatus(req, res) {
        try {
            const { userId } = req.params;
            const { status } = req.body;

            await db.query(
                "UPDATE users SET status = $1 WHERE id = $2",
                [status, userId]
            );

            res.json({ success: true, message: 'User status updated' });
        } catch (error) {
            console.error('❌ Status update error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    async deleteUser(req, res) {
         try {
            const { userId } = req.params;

            await db.query("DELETE FROM users WHERE id = $1", [userId]);

            res.json({ success: true, message: 'User deleted successfully' });
        } catch (error) {
            console.error('❌ Delete user error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    async searchUsers(req, res) {
        try {
            const { query } = req.query;
            
            const users = await db.query(
                `SELECT id, username, email, role, status, created_at 
                 FROM users 
                 WHERE username ILIKE $1 OR email ILIKE $1 
                 ORDER BY created_at DESC 
                 LIMIT 20`,
                [`%${query}%`]
            );

            res.json({
                success: true,
                users: users.rows
            });
        } catch (error) {
            console.error('❌ User search error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    async getDashboardStats(req, res) {
        try {
            // Получаем текущую дату
            const today = new Date();
            const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

            // Выполняем запросы параллельно
            const [
                userStats,
                contentStats,
                activityResult
            ] = await Promise.all([
                // Статистика пользователей
                db.query(`
                    SELECT 
                        COUNT(*) as "totalUsers",
                        COUNT(CASE WHEN created_at >= $1 AND created_at < $2 THEN 1 END) as "newUsersToday",
                        COUNT(CASE WHEN created_at >= $3 THEN 1 END) as "newUsersWeek"
                    FROM users
                `, [todayStart, todayEnd, weekAgo]),

                // Статистика контента
                db.query(`
                    SELECT 
                        COUNT(*) as "totalTopics",
                        COUNT(CASE WHEN created_at >= $1 AND created_at < $2 THEN 1 END) as "newTopicsToday",
                        (SELECT COUNT(*) FROM comments) as "totalComments",
                        COUNT(CASE WHEN created_at >= $1 AND created_at < $2 THEN 1 END) as "newCommentsToday"
                    FROM topics
                `, [todayStart, todayEnd]),

                // Последняя активность
                db.query(`
                    (SELECT 
                        'user' as type,
                        username as title,
                        'Зарегистрировался' as description,
                        created_at as activity_date
                    FROM users 
                    ORDER BY created_at DESC 
                    LIMIT 5)
                    
                    UNION ALL
                    
                    (SELECT 
                        'topic' as type,
                        title,
                        'Создал новую тему' as description,
                        created_at as activity_date
                    FROM topics 
                    ORDER BY created_at DESC 
                    LIMIT 5)
                    
                    UNION ALL
                    
                    (SELECT 
                        'comment' as type,
                        LEFT(content, 50) as title,
                        'Оставил комментарий' as description,
                        created_at as activity_date
                    FROM comments 
                    ORDER BY created_at DESC 
                    LIMIT 5)
                    
                    ORDER BY activity_date DESC 
                    LIMIT 10
                `)
            ]);

            const stats = {
                ...userStats.rows[0],
                ...contentStats.rows[0],
                totalRaces: 23 // Временная заглушка для гонок
            };

            res.json({
                success: true,
                stats: stats,
                recentActivity: activityResult.rows
            });
        } catch (error) {
            console.error('❌ Dashboard stats error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
    
};

// Вспомогательные функции
function getActivityIcon(type) {
    const icons = {
        'user': '👤',
        'topic': '📝', 
        'comment': '💬',
        'report': '🚨'
    };
    return icons[type] || '📌';
}

function getLogColor(level) {
    const colors = {
        'error': '#e74c3c',
        'warn': '#f39c12',
        'info': '#3498db',
        'debug': '#95a5a6'
    };
    return colors[level] || '#333';
}

module.exports = adminController;