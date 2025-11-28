// backend/controllers/reportController.js
const db = require('../db/postgres');
const PDFDocument = require('pdfkit');

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
    },

    // Генерация PDF отчета
async generateReportsPDF(req, res) {
    try {
        const { start_date, end_date, status = 'resolved' } = req.query;
        
        console.log('📊 Generating PDF report for resolved reports');

        // Получаем обработанные отчеты
        let query = `
            SELECT 
                r.*,
                u1.username as reporter_name,
                u1.email as reporter_email,
                u2.username as author_name,
                u2.email as author_email,
                u3.username as moderator_name,
                CASE 
                    WHEN r.content_type = 'topic' THEN t.title
                    WHEN r.content_type = 'comment' THEN LEFT(c.content, 200)
                END as content_preview,
                CASE 
                    WHEN r.content_type = 'topic' THEN t.content
                    WHEN r.content_type = 'comment' THEN c.content
                END as full_content
            FROM reports r
            LEFT JOIN users u1 ON r.reporter_id = u1.id
            LEFT JOIN users u2 ON r.author_id = u2.id
            LEFT JOIN users u3 ON r.moderator_id = u3.id
            LEFT JOIN topics t ON r.content_id = t.id AND r.content_type = 'topic'
            LEFT JOIN comments c ON r.content_id = c.id AND r.content_type = 'comment'
            WHERE r.status = $1
        `;

        const params = [status];
        let paramCount = 1;

        if (start_date) {
            paramCount++;
            query += ` AND r.resolved_at >= $${paramCount}`;
            params.push(start_date);
        }

        if (end_date) {
            paramCount++;
            query += ` AND r.resolved_at <= $${paramCount}`;
            params.push(end_date);
        }

        query += ' ORDER BY r.resolved_at DESC';

        const reports = await db.query(query, params);

        if (reports.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Нет обработанных отчетов для выбранного периода'
            });
        }

        // Создаем PDF документ
        const PDFDocument = require('pdfkit');
        const fs = require('fs');
        const path = require('path');
        const doc = new PDFDocument();
        
        // Устанавливаем заголовки для скачивания
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 
            `attachment; filename="reports_${new Date().toISOString().split('T')[0]}.pdf"`);

        // Пайпим PDF в ответ
        doc.pipe(res);

        // Регистрируем кастомный шрифт для поддержки кириллицы
        try {
            const fontPath = path.join(__dirname, '../fonts/arial unicode ms.otf');
            if (fs.existsSync(fontPath)) {
                doc.font(fontPath);
                console.log('✅ Using custom Arial Unicode MS font for Cyrillic support');
            } else {
                // Fallback на Times-Roman если кастомный шрифт не найден
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
           .text('Отчет по обработанным жалобам', 50, 50)
           .moveDown(0.5);

        doc.fontSize(12)
           .fillColor('#666')
           .text(`Период: ${start_date || 'все время'} - ${end_date || 'по настоящее время'}`)
           .text(`Сгенерировано: ${new Date().toLocaleString('ru-RU')}`)
           .text(`Всего отчетов: ${reports.rows.length}`)
           .moveDown();

        let yPosition = 150;

        // Добавляем каждый отчет в PDF
        reports.rows.forEach((report, index) => {
            // Проверяем, нужно ли добавить новую страницу
            if (yPosition > 700) {
                doc.addPage();
                yPosition = 50;
                
                // Переустанавливаем шрифт на новой странице
                try {
                    const fontPath = path.join(__dirname, '../fonts/arial unicode ms.otf');
                    if (fs.existsSync(fontPath)) {
                        doc.font(fontPath);
                    } else {
                        doc.font('Times-Roman');
                    }
                } catch (e) {
                    doc.font('Times-Roman');
                }
            }

            // Заголовок отчета
            doc.fontSize(14)
               .fillColor('#2c3e50')
               .text(`Жалоба #${report.id} - ${report.content_type === 'topic' ? 'Тема' : 'Комментарий'}`, 50, yPosition)
               .moveDown(0.3);

            // Основная информация
            doc.fontSize(10)
               .fillColor('#333')
               .text(`Статус: ${report.status === 'resolved' ? 'Обработано' : 'В ожидании'}`, { continued: false })
               .text(`Дата создания: ${new Date(report.created_at).toLocaleString('ru-RU')}`, { continued: false })
               .text(`Дата обработки: ${report.resolved_at ? new Date(report.resolved_at).toLocaleString('ru-RU') : 'Не обработано'}`, { continued: false })
               .text(`Жалоба от: ${report.reporter_name || 'Неизвестно'} (${report.reporter_email || 'Нет email'})`, { continued: false })
               .text(`Автор контента: ${report.author_name || 'Неизвестно'} (${report.author_email || 'Нет email'})`, { continued: false })
               .text(`Модератор: ${report.moderator_name || 'Не назначен'}`, { continued: false })
               .moveDown(0.3);

            // Причина жалобы
            doc.fillColor('#e74c3c')
               .text('Причина жалобы:', { continued: false })
               .fillColor('#333')
               .text(` ${report.reason || 'Не указана'}`)
               .moveDown(0.3);

            // Решение
            if (report.resolution) {
                doc.fillColor('#27ae60')
                   .text('Решение:', { continued: false })
                   .fillColor('#333')
                   .text(` ${report.resolution}`)
                   .moveDown(0.3);
            }

            // Комментарий модератора
            if (report.moderator_notes) {
                doc.fillColor('#3498db')
                   .text('Комментарий модератора:', { continued: false })
                   .fillColor('#333')
                   .text(` ${report.moderator_notes}`)
                   .moveDown(0.3);
            }

            // Содержание
            const content = report.full_content || report.content_preview || 'Содержание не доступно';
            // Обрезаем длинный контент чтобы не выходить за пределы страницы
            const truncatedContent = content.length > 500 ? content.substring(0, 500) + '...' : content;
            
            doc.fillColor('#666')
               .text('Содержание:', { continued: false })
               .fillColor('#333')
               .text(` ${truncatedContent}`)
               .moveDown(0.5);

            // Разделитель между отчетами
            if (index < reports.rows.length - 1) {
                doc.moveTo(50, doc.y)
                   .lineTo(550, doc.y)
                   .strokeColor('#ddd')
                   .lineWidth(1)
                   .stroke();
                doc.moveDown(0.5);
            }

            yPosition = doc.y;
        });

        // Завершаем документ
        doc.end();

    } catch (error) {
        console.error('❌ Generate PDF error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка генерации PDF отчета: ' + error.message 
        });
    }
}
};

module.exports = reportController;