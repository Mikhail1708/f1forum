// backend/controllers/moderatorController.js
const db = require('../db/postgres');

const moderatorController = {
    // Статистика для дашборда модератора
    async getStats(req, res) {
        try {
            console.log('📊 Getting moderator stats...');

            const [
                pendingTopics,
                pendingComments,
                reportedContent,
                warnedUsers
            ] = await Promise.all([
                // Темы на модерации
                db.query(`SELECT COUNT(*) as count FROM topics WHERE status = 'pending'`),
                
                // Комментарии на модерации
                db.query(`SELECT COUNT(*) as count FROM comments WHERE status = 'pending'`),
                
                // Жалобы
                db.query(`SELECT COUNT(*) as count FROM reports WHERE status = 'pending'`),
                
                // Пользователи с предупреждениями
                db.query(`SELECT COUNT(DISTINCT user_id) as count FROM user_warnings WHERE expires_at > NOW() OR expires_at IS NULL`)
            ]);

            const stats = {
                pendingTopics: parseInt(pendingTopics.rows[0].count),
                pendingComments: parseInt(pendingComments.rows[0].count),
                reportedContent: parseInt(reportedContent.rows[0].count),
                warnedUsers: parseInt(warnedUsers.rows[0].count)
            };

            console.log('📊 Moderator stats:', stats);

            // Последние действия модератора
            const recentActions = await db.query(`
                SELECT 
                    action_type as type,
                    description,
                    created_at
                FROM moderator_actions 
                WHERE moderator_id = $1
                ORDER BY created_at DESC 
                LIMIT 10
            `, [req.userId]);

            res.json({
                success: true,
                stats: stats,
                recentActions: recentActions.rows
            });

        } catch (error) {
            console.error('❌ Moderator stats error:', error);
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    },

    // Получить темы на модерации
    async getPendingTopics(req, res) {
        try {
            const topics = await db.query(`
                SELECT 
                    t.*,
                    u.username as author_name,
                    c.name as category_name
                FROM topics t
                LEFT JOIN users u ON t.user_id = u.id
                LEFT JOIN categories c ON t.category_id = c.id
                WHERE t.status = 'pending'
                ORDER BY t.created_at ASC
            `);

            res.json({
                success: true,
                topics: topics.rows
            });
        } catch (error) {
            console.error('❌ Get pending topics error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Одобрить тему
    async approveTopic(req, res) {
        try {
            const { topicId } = req.params;

            await db.query(
                'UPDATE topics SET status = $1 WHERE id = $2',
                ['approved', topicId]
            );

            // Логируем действие
            await db.query(`
                INSERT INTO moderator_actions (moderator_id, action_type, description)
                VALUES ($1, $2, $3)
            `, [req.userId, 'topic_approved', `Одобрена тема #${topicId}`]);

            res.json({
                success: true,
                message: 'Topic approved successfully'
            });
        } catch (error) {
            console.error('❌ Approve topic error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Отклонить тему
    async rejectTopic(req, res) {
        try {
            const { topicId } = req.params;

            await db.query(
                'UPDATE topics SET status = $1 WHERE id = $2',
                ['rejected', topicId]
            );

            // Логируем действие
            await db.query(`
                INSERT INTO moderator_actions (moderator_id, action_type, description)
                VALUES ($1, $2, $3)
            `, [req.userId, 'topic_rejected', `Отклонена тема #${topicId}`]);

            res.json({
                success: true,
                message: 'Topic rejected successfully'
            });
        } catch (error) {
            console.error('❌ Reject topic error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Получить комментарии на модерации
    async getPendingComments(req, res) {
        try {
            const comments = await db.query(`
                SELECT 
                    c.*,
                    u.username as author_name,
                    t.title as topic_title
                FROM comments c
                LEFT JOIN users u ON c.user_id = u.id
                LEFT JOIN topics t ON c.topic_id = t.id
                WHERE c.status = 'pending'
                ORDER BY c.created_at ASC
            `);

            res.json({
                success: true,
                comments: comments.rows
            });
        } catch (error) {
            console.error('❌ Get pending comments error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Одобрить комментарий
    async approveComment(req, res) {
        try {
            const { commentId } = req.params;

            await db.query(
                'UPDATE comments SET status = $1 WHERE id = $2',
                ['approved', commentId]
            );

            // Логируем действие
            await db.query(`
                INSERT INTO moderator_actions (moderator_id, action_type, description)
                VALUES ($1, $2, $3)
            `, [req.userId, 'comment_approved', `Одобрен комментарий #${commentId}`]);

            res.json({
                success: true,
                message: 'Comment approved successfully'
            });
        } catch (error) {
            console.error('❌ Approve comment error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Удалить комментарий
    async deleteComment(req, res) {
        try {
            const { commentId } = req.params;

            await db.query('DELETE FROM comments WHERE id = $1', [commentId]);

            // Логируем действие
            await db.query(`
                INSERT INTO moderator_actions (moderator_id, action_type, description)
                VALUES ($1, $2, $3)
            `, [req.userId, 'comment_deleted', `Удален комментарий #${commentId}`]);

            res.json({
                success: true,
                message: 'Comment deleted successfully'
            });
        } catch (error) {
            console.error('❌ Delete comment error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Получить пользователей для модерации
    async getUsers(req, res) {
        try {
            const users = await db.query(`
                SELECT 
                    u.*,
                    COUNT(w.id) as warning_count
                FROM users u
                LEFT JOIN user_warnings w ON u.id = w.user_id 
                    AND (w.expires_at > NOW() OR w.expires_at IS NULL)
                WHERE u.role IN ('user', 'moderator')
                GROUP BY u.id
                ORDER BY u.created_at DESC
            `);

            res.json({
                success: true,
                users: users.rows
            });
        } catch (error) {
            console.error('❌ Get users error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

     // Выдать предупреждение пользователю
    async warnUser(req, res) {
        try {
            const { userId } = req.params;
            const { reason } = req.body;

            // Проверяем, не пытается ли пользователь выдать предупреждение самому себе
            if (parseInt(userId) === req.userId) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Cannot warn yourself' 
                });
            }

            // Проверяем, не пытается ли пользователь выдать предупреждение админу
            const targetUser = await db.query(
                'SELECT role FROM users WHERE id = $1',
                [userId]
            );

            if (targetUser.rows.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    error: 'User not found' 
                });
            }

            // Модераторы не могут выдавать предупреждения админам
            if (req.user.role === 'moderator' && targetUser.rows[0].role === 'admin') {
                return res.status(403).json({ 
                    success: false, 
                    error: 'Moderators cannot warn admin users' 
                });
            }

            await db.query(`
                INSERT INTO user_warnings (user_id, moderator_id, reason)
                VALUES ($1, $2, $3)
            `, [userId, req.userId, reason]);

            // Логируем действие
            await db.query(`
                INSERT INTO moderator_actions (moderator_id, action_type, description)
                VALUES ($1, $2, $3)
            `, [req.userId, 'user_warned', `Выдано предупреждение пользователю #${userId}`]);

            res.json({
                success: true,
                message: 'User warned successfully'
            });
        } catch (error) {
            console.error('❌ Warn user error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Заблокировать пользователя
    async suspendUser(req, res) {
        try {
            const { userId } = req.params;

            // Проверяем, не пытается ли пользователь заблокировать сам себя
            if (parseInt(userId) === req.userId) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Cannot suspend yourself' 
                });
            }

            // Проверяем, не пытается ли пользователь заблокировать админа или другого модератора
            const targetUser = await db.query(
                'SELECT role FROM users WHERE id = $1',
                [userId]
            );

            if (targetUser.rows.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    error: 'User not found' 
                });
            }

            // Модераторы не могут блокировать админов или других модераторов
            if (req.user.role === 'moderator' && 
                (targetUser.rows[0].role === 'admin' || targetUser.rows[0].role === 'moderator')) {
                return res.status(403).json({ 
                    success: false, 
                    error: 'Moderators cannot suspend admins or other moderators' 
                });
            }

            await db.query(
                'UPDATE users SET status = $1 WHERE id = $2',
                ['suspended', userId]
            );

            // Логируем действие
            await db.query(`
                INSERT INTO moderator_actions (moderator_id, action_type, description)
                VALUES ($1, $2, $3)
            `, [req.userId, 'user_suspended', `Заблокирован пользователь #${userId}`]);

            res.json({
                success: true,
                message: 'User suspended successfully'
            });
        } catch (error) {
            console.error('❌ Suspend user error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Разблокировать пользователя
    async unsuspendUser(req, res) {
        try {
            const { userId } = req.params;

            // Проверяем, существует ли пользователь
            const targetUser = await db.query(
                'SELECT role, status FROM users WHERE id = $1',
                [userId]
            );

            if (targetUser.rows.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    error: 'User not found' 
                });
            }

            if (targetUser.rows[0].status !== 'suspended') {
                return res.status(400).json({ 
                    success: false, 
                    error: 'User is not suspended' 
                });
            }

            await db.query(
                'UPDATE users SET status = $1 WHERE id = $2',
                ['active', userId]
            );

            // Логируем действие
            await db.query(`
                INSERT INTO moderator_actions (moderator_id, action_type, description)
                VALUES ($1, $2, $3)
            `, [req.userId, 'user_unsuspended', `Разблокирован пользователь #${userId}`]);

            res.json({
                success: true,
                message: 'User unsuspended successfully'
            });
        } catch (error) {
            console.error('❌ Unsuspend user error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },
    // Получить жалобы
    async getPendingReports(req, res) {
        try {
            const reports = await db.query(`
                SELECT 
                    r.*,
                    u1.username as reporter_name,
                    u2.username as author_name,
                    CASE 
                        WHEN r.content_type = 'topic' THEN t.title
                        WHEN r.content_type = 'comment' THEN LEFT(c.content, 100)
                    END as content_preview
                FROM reports r
                LEFT JOIN users u1 ON r.reporter_id = u1.id
                LEFT JOIN users u2 ON r.author_id = u2.id
                LEFT JOIN topics t ON r.content_id = t.id AND r.content_type = 'topic'
                LEFT JOIN comments c ON r.content_id = c.id AND r.content_type = 'comment'
                WHERE r.status = 'pending'
                ORDER BY r.created_at ASC
            `);

            res.json({
                success: true,
                reports: reports.rows
            });
        } catch (error) {
            console.error('❌ Get pending reports error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Получить решенные жалобы
    async getResolvedReports(req, res) {
        try {
            const reports = await db.query(`
                SELECT 
                    r.*,
                    u1.username as reporter_name,
                    u2.username as author_name,
                    u3.username as moderator_name,
                    CASE 
                        WHEN r.content_type = 'topic' THEN t.title
                        WHEN r.content_type = 'comment' THEN LEFT(c.content, 100)
                    END as content_preview
                FROM reports r
                LEFT JOIN users u1 ON r.reporter_id = u1.id
                LEFT JOIN users u2 ON r.author_id = u2.id
                LEFT JOIN users u3 ON r.moderator_id = u3.id
                LEFT JOIN topics t ON r.content_id = t.id AND r.content_type = 'topic'
                LEFT JOIN comments c ON r.content_id = c.id AND r.content_type = 'comment'
                WHERE r.status = 'resolved'
                ORDER BY r.resolved_at DESC
            `);

            res.json({
                success: true,
                reports: reports.rows
            });
        } catch (error) {
            console.error('❌ Get resolved reports error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Обработать жалобу
    async resolveReport(req, res) {
        try {
            const { reportId } = req.params;
            const { resolution } = req.body;

            await db.query(`
                UPDATE reports 
                SET status = 'resolved', resolution = $1, moderator_id = $2, resolved_at = NOW()
                WHERE id = $3
            `, [resolution, req.userId, reportId]);

            // Если контент удален - удаляем его
            if (resolution === 'removed') {
                const report = await db.query(
                    'SELECT content_type, content_id FROM reports WHERE id = $1',
                    [reportId]
                );
                
                if (report.rows[0].content_type === 'topic') {
                    await db.query('DELETE FROM topics WHERE id = $1', [report.rows[0].content_id]);
                } else if (report.rows[0].content_type === 'comment') {
                    await db.query('DELETE FROM comments WHERE id = $1', [report.rows[0].content_id]);
                }
            }

            // Логируем действие
            await db.query(`
                INSERT INTO moderator_actions (moderator_id, action_type, description)
                VALUES ($1, $2, $3)
            `, [req.userId, 'report_resolved', `Обработана жалоба #${reportId}`]);

            res.json({
                success: true,
                message: 'Report resolved successfully'
            });
        } catch (error) {
            console.error('❌ Resolve report error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
};

module.exports = moderatorController;