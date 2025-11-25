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
                warnedUsers,
                totalReports
            ] = await Promise.all([
                db.query(`SELECT COUNT(*) as count FROM topics WHERE status = 'pending'`),
                db.query(`SELECT COUNT(*) as count FROM comments WHERE status = 'pending'`),
                db.query(`SELECT COUNT(*) as count FROM reports WHERE status = 'pending'`),
                db.query(`SELECT COUNT(DISTINCT user_id) as count FROM user_warnings WHERE expires_at > NOW() OR expires_at IS NULL`),
                db.query(`SELECT COUNT(*) as count FROM reports WHERE status = 'resolved' AND resolved_at >= NOW() - INTERVAL '7 days'`)
            ]);

            const stats = {
                pendingTopics: parseInt(pendingTopics.rows[0].count),
                pendingComments: parseInt(pendingComments.rows[0].count),
                reportedContent: parseInt(reportedContent.rows[0].count),
                warnedUsers: parseInt(warnedUsers.rows[0].count),
                recentResolvedReports: parseInt(totalReports.rows[0].count)
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

    // Получить жалобы с пагинацией и фильтрацией
    async getReports(req, res) {
        try {
            const { 
                page = 1, 
                limit = 10, 
                status = 'pending',
                content_type,
                sort_by = 'created_at',
                sort_order = 'DESC'
            } = req.query;
            
            const offset = (page - 1) * limit;

            let whereClause = 'WHERE r.status = $1';
            let queryParams = [status];
            let paramCount = 1;

            if (content_type) {
                paramCount++;
                whereClause += ` AND r.content_type = $${paramCount}`;
                queryParams.push(content_type);
            }

            const reports = await db.query(`
                SELECT 
                    r.*,
                    u1.username as reporter_name,
                    u2.username as author_name,
                    u3.username as moderator_name,
                    CASE 
                        WHEN r.content_type = 'topic' THEN t.title
                        WHEN r.content_type = 'comment' THEN LEFT(c.content, 100)
                    END as content_preview,
                    (SELECT COUNT(*) FROM report_notes WHERE report_id = r.id) as notes_count
                FROM reports r
                LEFT JOIN users u1 ON r.reporter_id = u1.id
                LEFT JOIN users u2 ON r.author_id = u2.id
                LEFT JOIN users u3 ON r.moderator_id = u3.id
                LEFT JOIN topics t ON r.content_id = t.id AND r.content_type = 'topic'
                LEFT JOIN comments c ON r.content_id = c.id AND r.content_type = 'comment'
                ${whereClause}
                ORDER BY r.${sort_by} ${sort_order}
                LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
            `, [...queryParams, parseInt(limit), offset]);

            const totalCount = await db.query(
                `SELECT COUNT(*) FROM reports r ${whereClause}`,
                queryParams
            );

            res.json({
                success: true,
                reports: reports.rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: parseInt(totalCount.rows[0].count),
                    totalPages: Math.ceil(totalCount.rows[0].count / limit)
                }
            });
        } catch (error) {
            console.error('❌ Get reports error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Получить статистику по жалобам
    async getReportsStats(req, res) {
        try {
            const stats = await db.query(`
                SELECT 
                    status,
                    content_type,
                    COUNT(*) as count
                FROM reports 
                GROUP BY status, content_type
                ORDER BY status, content_type
            `);

            const weeklyStats = await db.query(`
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as count
                FROM reports 
                WHERE created_at >= NOW() - INTERVAL '30 days'
                GROUP BY DATE(created_at)
                ORDER BY date DESC
            `);

            res.json({
                success: true,
                stats: stats.rows,
                weeklyStats: weeklyStats.rows
            });
        } catch (error) {
            console.error('❌ Get reports stats error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Получить детали жалобы с комментариями и историей
    async getReportDetails(req, res) {
        try {
            const { reportId } = req.params;

            const report = await db.query(`
                SELECT 
                    r.*,
                    u1.username as reporter_name,
                    u1.email as reporter_email,
                    u2.username as author_name,
                    u2.email as author_email,
                    u3.username as moderator_name,
                    CASE 
                        WHEN r.content_type = 'topic' THEN t.title
                        WHEN r.content_type = 'comment' THEN c.content
                    END as content_full,
                    CASE 
                        WHEN r.content_type = 'topic' THEN t.content
                        WHEN r.content_type = 'comment' THEN NULL
                    END as topic_content,
                    CASE 
                        WHEN r.content_type = 'topic' THEN t.created_at
                        WHEN r.content_type = 'comment' THEN c.created_at
                    END as content_created_at
                FROM reports r
                LEFT JOIN users u1 ON r.reporter_id = u1.id
                LEFT JOIN users u2 ON r.author_id = u2.id
                LEFT JOIN users u3 ON r.moderator_id = u3.id
                LEFT JOIN topics t ON r.content_id = t.id AND r.content_type = 'topic'
                LEFT JOIN comments c ON r.content_id = c.id AND r.content_type = 'comment'
                WHERE r.id = $1
            `, [reportId]);

            if (report.rows.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    error: 'Жалоба не найдена' 
                });
            }

            // Получаем комментарии модераторов к жалобе
            const notes = await db.query(`
                SELECT 
                    rn.*,
                    u.username as moderator_name,
                    u.role as moderator_role
                FROM report_notes rn
                LEFT JOIN users u ON rn.moderator_id = u.id
                WHERE rn.report_id = $1
                ORDER BY rn.created_at ASC
            `, [reportId]);

            // Получаем историю действий по жалобе
            const history = await db.query(`
                SELECT 
                    action_type,
                    description,
                    created_at
                FROM moderator_actions 
                WHERE description LIKE $1 OR description LIKE $2
                ORDER BY created_at DESC
            `, [`%жалоба #${reportId}%`, `%report #${reportId}%`]);

            res.json({
                success: true,
                report: report.rows[0],
                notes: notes.rows,
                history: history.rows
            });
        } catch (error) {
            console.error('❌ Get report details error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Добавить комментарий к жалобе
    async addReportNote(req, res) {
        try {
            const { reportId } = req.params;
            const { note } = req.body;
            const moderator_id = req.userId;

            if (!note || !note.trim()) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Комментарий не может быть пустым' 
                });
            }

            // Проверяем существование жалобы
            const reportCheck = await db.query(
                'SELECT id FROM reports WHERE id = $1',
                [reportId]
            );

            if (reportCheck.rows.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    error: 'Жалоба не найдена' 
                });
            }

            const result = await db.query(`
                INSERT INTO report_notes (report_id, moderator_id, note)
                VALUES ($1, $2, $3)
                RETURNING *, (SELECT username FROM users WHERE id = $2) as moderator_name
            `, [reportId, moderator_id, note.trim()]);

            // Логируем действие
            await db.query(`
                INSERT INTO moderator_actions (moderator_id, action_type, description)
                VALUES ($1, $2, $3)
            `, [moderator_id, 'report_note_added', `Добавлен комментарий к жалобе #${reportId}`]);

            res.json({
                success: true,
                note: result.rows[0],
                message: 'Комментарий добавлен'
            });
        } catch (error) {
            console.error('❌ Add report note error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Удалить комментарий к жалобе
    async deleteReportNote(req, res) {
        try {
            const { noteId } = req.params;
            const moderator_id = req.userId;

            const note = await db.query(
                'SELECT * FROM report_notes WHERE id = $1',
                [noteId]
            );

            if (note.rows.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    error: 'Комментарий не найден' 
                });
            }

            // Проверяем, что комментарий принадлежит текущему модератору
            if (note.rows[0].moderator_id !== moderator_id) {
                return res.status(403).json({ 
                    success: false, 
                    error: 'Вы можете удалять только свои комментарии' 
                });
            }

            await db.query('DELETE FROM report_notes WHERE id = $1', [noteId]);

            res.json({
                success: true,
                message: 'Комментарий удален'
            });
        } catch (error) {
            console.error('❌ Delete report note error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Обработать жалобу (расширенная версия)
    async resolveReport(req, res) {
        try {
            const { reportId } = req.params;
            const { action, moderator_notes } = req.body;
            const moderator_id = req.userId;

            console.log('🔧 Resolving report:', { reportId, action, moderator_id });

            const report = await db.query(
                'SELECT * FROM reports WHERE id = $1',
                [reportId]
            );

            if (report.rows.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    error: 'Жалоба не найдена' 
                });
            }

            const reportData = report.rows[0];
            
            if (reportData.status === 'resolved') {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Жалоба уже обработана' 
                });
            }

            let resolution = '';
            let actionDescription = '';

            // Выполняем действие
            if (action === 'remove_content') {
                if (reportData.content_type === 'topic') {
                    await db.query('DELETE FROM topics WHERE id = $1', [reportData.content_id]);
                    resolution = 'Контент удален: обсуждение';
                    actionDescription = 'Удалено обсуждение';
                } else if (reportData.content_type === 'comment') {
                    await db.query('DELETE FROM comments WHERE id = $1', [reportData.content_id]);
                    resolution = 'Контент удален: комментарий';
                    actionDescription = 'Удален комментарий';
                }
            } else if (action === 'dismiss') {
                resolution = 'Жалоба отклонена - нарушений не обнаружено';
                actionDescription = 'Жалоба отклонена';
            } else if (action === 'warn_user') {
                resolution = 'Пользователю выдано предупреждение';
                actionDescription = 'Выдано предупреждение пользователю';
                
                // Добавляем предупреждение пользователю
                await db.query(`
                    INSERT INTO user_warnings (user_id, moderator_id, reason)
                    VALUES ($1, $2, $3)
                `, [reportData.author_id, moderator_id, `Жалоба #${reportId}: ${moderator_notes || 'Нарушение правил сообщества'}`]);
            } else {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Неверное действие' 
                });
            }

            // Обновляем жалобу
            await db.query(`
                UPDATE reports 
                SET status = 'resolved', 
                    resolution = $1,
                    moderator_id = $2,
                    moderator_notes = $3,
                    resolved_at = NOW()
                WHERE id = $4
            `, [resolution, moderator_id, moderator_notes, reportId]);

            // Логируем действие
            await db.query(`
                INSERT INTO moderator_actions (moderator_id, action_type, description)
                VALUES ($1, $2, $3)
            `, [moderator_id, 'report_resolved', `Обработана жалоба #${reportId}: ${actionDescription}`]);

            // Если есть moderator_notes, добавляем их как комментарий
            if (moderator_notes && moderator_notes.trim()) {
                await db.query(`
                    INSERT INTO report_notes (report_id, moderator_id, note)
                    VALUES ($1, $2, $3)
                `, [reportId, moderator_id, `Решение модератора: ${moderator_notes.trim()}`]);
            }

            console.log('✅ Report resolved:', reportId);

            res.json({
                success: true,
                message: 'Жалоба успешно обработана',
                resolution: resolution
            });
        } catch (error) {
            console.error('❌ Resolve report error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Изменить решение по жалобе (переоткрыть или изменить статус)
    async updateReportResolution(req, res) {
        try {
            const { reportId } = req.params;
            const { status, resolution, moderator_notes } = req.body;
            const moderator_id = req.userId;

            const report = await db.query(
                'SELECT * FROM reports WHERE id = $1',
                [reportId]
            );

            if (report.rows.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    error: 'Жалоба не найдена' 
                });
            }

            await db.query(`
                UPDATE reports 
                SET status = $1,
                    resolution = $2,
                    moderator_notes = $3,
                    moderator_id = $4,
                    resolved_at = CASE 
                        WHEN $1 = 'pending' THEN NULL 
                        ELSE COALESCE(resolved_at, NOW()) 
                    END
                WHERE id = $5
            `, [status, resolution, moderator_notes, moderator_id, reportId]);

            // Логируем изменение
            const actionType = status === 'pending' ? 'report_reopened' : 'report_updated';
            const description = status === 'pending' 
                ? `Переоткрыта жалоба #${reportId}` 
                : `Обновлено решение по жалобе #${reportId}`;

            await db.query(`
                INSERT INTO moderator_actions (moderator_id, action_type, description)
                VALUES ($1, $2, $3)
            `, [moderator_id, actionType, description]);

            res.json({
                success: true,
                message: 'Решение по жалобе обновлено'
            });
        } catch (error) {
            console.error('❌ Update report resolution error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
};

module.exports = moderatorController;