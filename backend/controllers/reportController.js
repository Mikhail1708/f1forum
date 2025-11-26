// backend/controllers/reportController.js
const db = require('../db/postgres');

const reportController = {
    // Создать жалобу
    async createReport(req, res) {
        try {
            const { content_type, content_id, reason } = req.body;
            const reporter_id = req.userId;

            console.log('🚩 Creating report:', { content_type, content_id, reporter_id, reason });

            if (!content_type || !content_id || !reason) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Тип контента, ID контента и причина обязательны' 
                });
            }

            // Проверяем существование контента
            let contentExists = false;
            let author_id = null;

            if (content_type === 'topic') {
                const topic = await db.query('SELECT id, user_id FROM topics WHERE id = $1', [content_id]);
                contentExists = topic.rows.length > 0;
                author_id = topic.rows[0]?.user_id;
            } else if (content_type === 'comment') {
                const comment = await db.query('SELECT id, user_id FROM comments WHERE id = $1', [content_id]);
                contentExists = comment.rows.length > 0;
                author_id = comment.rows[0]?.user_id;
            } else {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Неверный тип контента. Допустимо: topic, comment' 
                });
            }

            if (!contentExists) {
                return res.status(404).json({ 
                    success: false, 
                    error: 'Контент не найден' 
                });
            }

            // Нельзя жаловаться на собственный контент
            if (author_id === reporter_id) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Нельзя жаловаться на собственный контент' 
                });
            }

            // Проверяем, не жаловался ли уже пользователь на этот контент
            const existingReport = await db.query(
                'SELECT id FROM reports WHERE content_type = $1 AND content_id = $2 AND reporter_id = $3 AND status = $4',
                [content_type, content_id, reporter_id, 'pending']
            );

            if (existingReport.rows.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Вы уже жаловались на этот контент' 
                });
            }

            // ИСПРАВЛЕНИЕ: добавляем все обязательные поля включая type
            const result = await db.query(`
                INSERT INTO reports (
                    content_type, 
                    content_id, 
                    reporter_id, 
                    author_id, 
                    reason, 
                    type, 
                    status
                ) VALUES ($1, $2, $3, $4, $5, $6, 'pending')
                RETURNING *
            `, [
                content_type, 
                content_id, 
                reporter_id, 
                author_id, 
                reason, 
                content_type // используем content_type как значение для type
            ]);

            console.log('✅ Report created:', result.rows[0].id);

            res.status(201).json({
                success: true,
                report: result.rows[0],
                message: 'Жалоба успешно отправлена'
            });
        } catch (error) {
            console.error('❌ Create report error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Получить жалобы для модератора
    async getReports(req, res) {
        try {
            const { status = 'pending' } = req.query;

            console.log('📋 Getting reports with status:', status);

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
                WHERE r.status = $1
                ORDER BY r.created_at DESC
            `, [status]);

            res.json({
                success: true,
                reports: reports.rows
            });
        } catch (error) {
            console.error('❌ Get reports error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Обработать жалобу - ИСПРАВЛЕННАЯ ВЕРСИЯ
    async resolveReport(req, res) {
        try {
            const { id } = req.params;
            const { action, moderator_notes } = req.body;
            const moderator_id = req.userId;

            console.log('🔧 Resolving report:', { id, action, moderator_id });

            const report = await db.query(
                'SELECT * FROM reports WHERE id = $1',
                [id]
            );

            if (report.rows.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    error: 'Жалоба не найдена' 
                });
            }

            const reportData = report.rows[0];
            let resolution = '';

            // ИСПРАВЛЕНИЕ: используем правильные названия полей из базы
            if (action === 'remove_content') {
                // Удаляем контент
                if (reportData.content_type === 'topic') {
                    await db.query('DELETE FROM topics WHERE id = $1', [reportData.content_id]);
                    resolution = 'Обсуждение удалено';
                } else if (reportData.content_type === 'comment') {
                    await db.query('DELETE FROM comments WHERE id = $1', [reportData.content_id]);
                    resolution = 'Комментарий удален';
                }
            } else if (action === 'dismiss') {
                resolution = 'Жалоба отклонена - нарушений не обнаружено';
            } else if (action === 'warn_user') {
                resolution = 'Пользователю выдано предупреждение';
                // Добавляем предупреждение пользователю
                await db.query(`
                    INSERT INTO user_warnings (user_id, moderator_id, reason)
                    VALUES ($1, $2, $3)
                `, [reportData.author_id, moderator_id, `Жалоба #${id}: ${moderator_notes || 'Нарушение правил'}`]);
            } else {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Неверное действие' 
                });
            }

            // ИСПРАВЛЕНИЕ: используем правильные названия полей
            await db.query(`
                UPDATE reports 
                SET status = 'resolved', 
                    resolution = $1,
                    moderator_id = $2,
                    moderator_notes = $3,
                    resolved_at = NOW()
                WHERE id = $4
            `, [resolution, moderator_id, moderator_notes || null, id]);

            console.log('✅ Report resolved:', id);

            res.json({
                success: true,
                message: 'Жалоба обработана успешно'
            });
        } catch (error) {
            console.error('❌ Resolve report error:', error);
            
            // Если ошибка из-за отсутствия колонки moderator_notes
            if (error.message.includes('moderator_notes')) {
                try {
                    console.log('🔄 Retrying without moderator_notes...');
                    
                    const { id } = req.params;
                    const { action } = req.body;
                    const moderator_id = req.userId;

                    const report = await db.query(
                        'SELECT * FROM reports WHERE id = $1',
                        [id]
                    );

                    if (report.rows.length === 0) {
                        return res.status(404).json({ 
                            success: false, 
                            error: 'Жалоба не найдена' 
                        });
                    }

                    const reportData = report.rows[0];
                    let resolution = '';

                    if (action === 'remove_content') {
                        if (reportData.content_type === 'topic') {
                            await db.query('DELETE FROM topics WHERE id = $1', [reportData.content_id]);
                            resolution = 'Обсуждение удалено';
                        } else if (reportData.content_type === 'comment') {
                            await db.query('DELETE FROM comments WHERE id = $1', [reportData.content_id]);
                            resolution = 'Комментарий удален';
                        }
                    } else if (action === 'dismiss') {
                        resolution = 'Жалоба отклонена';
                    }

                    await db.query(`
                        UPDATE reports 
                        SET status = 'resolved', 
                            resolution = $1,
                            moderator_id = $2,
                            resolved_at = NOW()
                        WHERE id = $3
                    `, [resolution, moderator_id, id]);

                    res.json({
                        success: true,
                        message: 'Жалоба обработана успешно (без заметок)'
                    });
                    
                } catch (retryError) {
                    console.error('❌ Retry also failed:', retryError);
                    res.status(500).json({ 
                        success: false, 
                        error: 'Ошибка базы данных: ' + retryError.message 
                    });
                }
            } else {
                res.status(500).json({ 
                    success: false, 
                    error: 'Внутренняя ошибка сервера: ' + error.message 
                });
            }
        }
    }
};

module.exports = reportController;