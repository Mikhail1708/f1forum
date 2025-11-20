// backend/controllers/topicController.js
const db = require('../db/postgres');

const topicController = {
    // Получить все темы
    async getTopics(req, res) {
        try {
            console.log('📝 Getting topics...');
            
            const { page = 1, limit = 20, category } = req.query;
            const offset = (page - 1) * limit;

            let query = `
                SELECT 
                    t.*,
                    u.username as author_name,
                    c.name as category_name,
                    COUNT(DISTINCT com.id) as comments_count
                FROM topics t
                LEFT JOIN users u ON t.user_id = u.id
                LEFT JOIN categories c ON t.category_id = c.id
                LEFT JOIN comments com ON t.id = com.topic_id
            `;

            let countQuery = `SELECT COUNT(*) FROM topics t`;
            let queryParams = [];
            let countParams = [];

            // Фильтр по категории
            if (category) {
                query += ` WHERE c.slug = $1`;
                countQuery += ` WHERE c.slug = $1`;
                queryParams.push(category);
                countParams.push(category);
            }

            query += ` GROUP BY t.id, u.username, c.name 
                       ORDER BY t.created_at DESC 
                       LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
            
            queryParams.push(parseInt(limit), offset);

            const topics = await db.query(query, queryParams);
            const totalCount = await db.query(countQuery, countParams);

            res.json({
                success: true,
                topics: topics.rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: parseInt(totalCount.rows[0].count)
                }
            });
        } catch (error) {
            console.error('❌ Get topics error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Получить тему по ID
    async getTopicById(req, res) {
        try {
            const { id } = req.params;
            console.log('📝 Getting topic:', id);

            const topic = await db.query(`
                SELECT 
                    t.*,
                    u.username as author_name,
                    c.name as category_name
                FROM topics t
                LEFT JOIN users u ON t.user_id = u.id
                LEFT JOIN categories c ON t.category_id = c.id
                WHERE t.id = $1
            `, [id]);

            if (topic.rows.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    error: 'Topic not found' 
                });
            }

            // Получаем комментарии для темы
            const comments = await db.query(`
                SELECT 
                    c.*,
                    u.username as author_name
                FROM comments c
                LEFT JOIN users u ON c.user_id = u.id
                WHERE c.topic_id = $1
                ORDER BY c.created_at ASC
            `, [id]);

            res.json({
                success: true,
                topic: {
                    ...topic.rows[0],
                    comments: comments.rows
                }
            });
        } catch (error) {
            console.error('❌ Get topic error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Создать новую тему
    async createTopic(req, res) {
        try {
            const { title, content, tags, category_id } = req.body;
            const user_id = req.userId;

            console.log('📝 Creating topic:', { title, user_id });

            if (!title || !content) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Title and content are required' 
                });
            }

            const result = await db.query(`
                INSERT INTO topics (title, content, tags, user_id, category_id)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `, [title, content, tags || [], user_id, category_id || null]);

            // Получаем полную информацию о созданной теме
            const newTopic = await db.query(`
                SELECT 
                    t.*,
                    u.username as author_name,
                    c.name as category_name
                FROM topics t
                LEFT JOIN users u ON t.user_id = u.id
                LEFT JOIN categories c ON t.category_id = c.id
                WHERE t.id = $1
            `, [result.rows[0].id]);

            res.status(201).json({
                success: true,
                topic: newTopic.rows[0],
                message: 'Topic created successfully'
            });
        } catch (error) {
            console.error('❌ Create topic error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Обновить тему
    async updateTopic(req, res) {
        try {
            const { id } = req.params;
            const { title, content, tags } = req.body;
            const user_id = req.userId;

            console.log('📝 Updating topic:', id);

            // Проверяем, принадлежит ли тема пользователю
            const existingTopic = await db.query(
                'SELECT user_id FROM topics WHERE id = $1',
                [id]
            );

            if (existingTopic.rows.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    error: 'Topic not found' 
                });
            }

            if (existingTopic.rows[0].user_id !== user_id && req.user.role !== 'admin') {
                return res.status(403).json({ 
                    success: false, 
                    error: 'Not authorized to update this topic' 
                });
            }

            const result = await db.query(`
                UPDATE topics 
                SET title = $1, content = $2, tags = $3, updated_at = NOW()
                WHERE id = $4
                RETURNING *
            `, [title, content, tags, id]);

            res.json({
                success: true,
                topic: result.rows[0],
                message: 'Topic updated successfully'
            });
        } catch (error) {
            console.error('❌ Update topic error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Удалить тему
    async deleteTopic(req, res) {
        try {
            const { id } = req.params;
            const user_id = req.userId;

            console.log('📝 Deleting topic:', id);

            // Проверяем, принадлежит ли тема пользователю
            const existingTopic = await db.query(
                'SELECT user_id FROM topics WHERE id = $1',
                [id]
            );

            if (existingTopic.rows.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    error: 'Topic not found' 
                });
            }

            if (existingTopic.rows[0].user_id !== user_id && req.user.role !== 'admin') {
                return res.status(403).json({ 
                    success: false, 
                    error: 'Not authorized to delete this topic' 
                });
            }

            await db.query('DELETE FROM topics WHERE id = $1', [id]);

            res.json({
                success: true,
                message: 'Topic deleted successfully'
            });
        } catch (error) {
            console.error('❌ Delete topic error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Увеличить счетчик просмотров
    async incrementViews(req, res) {
        try {
            const { id } = req.params;

            await db.query(`
                UPDATE topics 
                SET views = COALESCE(views, 0) + 1 
                WHERE id = $1
            `, [id]);

            res.json({ success: true });
        } catch (error) {
            console.error('❌ Increment views error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
};

module.exports = topicController;