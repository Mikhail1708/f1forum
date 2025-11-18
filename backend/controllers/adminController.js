// backend/controllers/adminController.js
const db = require('../db/postgres');

// Вынесем функцию получения активности отдельно
async function getRecentActivity() {
    try {
        // Получаем последние действия из разных таблиц
        const activityQuery = `
            -- Последние зарегистрированные пользователи
            (SELECT 
                'user' as type,
                username as title,
                'Зарегистрировался' as description,
                created_at as activity_date,
                id as item_id
            FROM users 
            ORDER BY created_at DESC 
            LIMIT 3)
            
            UNION ALL
            
            -- Последние созданные темы
            (SELECT 
                'topic' as type,
                title,
                'Создал новую тему' as description,
                created_at as activity_date,
                id as item_id
            FROM topics 
            ORDER BY created_at DESC 
            LIMIT 3)
            
            UNION ALL
            
            -- Последние комментарии
            (SELECT 
                'comment' as type,
                LEFT(content, 50) as title,
                'Оставил комментарий' as description,
                created_at as activity_date,
                id as item_id
            FROM comments 
            ORDER BY created_at DESC 
            LIMIT 3)
            
            ORDER BY activity_date DESC 
            LIMIT 8
        `;

        const { rows } = await db.query(activityQuery);
        return rows;

    } catch (error) {
        console.error('❌ Recent activity error:', error);
        return [];
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
            
            console.log('📅 Today range:', todayStart, 'to', todayEnd);

            // Выполняем все запросы параллельно для скорости
            const [
                usersCount,
                topicsCount, 
                commentsCount,
                racesCount,
                newUsersToday,
                newTopicsToday,
                newCommentsToday
            ] = await Promise.all([
                // Общее количество пользователей
                db.query('SELECT COUNT(*) as count FROM users'),
                
                // Общее количество тем
                db.query('SELECT COUNT(*) as count FROM topics'),
                
                // Общее количество комментариев
                db.query('SELECT COUNT(*) as count FROM comments'),
                
                // Общее количество гонок
                db.query('SELECT COUNT(*) as count FROM grand_prix'),
                
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
                )
            ]);

            const stats = {
                totalUsers: parseInt(usersCount.rows[0].count),
                totalTopics: parseInt(topicsCount.rows[0].count),
                totalComments: parseInt(commentsCount.rows[0].count),
                totalRaces: parseInt(racesCount.rows[0].count),
                newUsersToday: parseInt(newUsersToday.rows[0].count),
                newTopicsToday: parseInt(newTopicsToday.rows[0].count),
                newCommentsToday: parseInt(newCommentsToday.rows[0].count)
            };

            console.log('📊 Database stats:', stats);

            // Получаем последнюю активность
            const recentActivity = await getRecentActivity();

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

module.exports = adminController;