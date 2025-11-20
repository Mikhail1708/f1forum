// backend/controllers/topicController.js
const db = require('../db/postgres');

// Вспомогательная функция для парсинга тегов
function parseTags(tags) {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags;
    try {
        return JSON.parse(tags);
    } catch {
        // Если это строка с запятыми, разбиваем по запятым
        if (typeof tags === 'string') {
            return tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        }
        return [];
    }
}

// Функция для построения дерева комментариев
function buildCommentTree(comments) {
    const commentMap = new Map();
    const rootComments = [];

    // Сначала создаем мапу всех комментариев
    comments.forEach(comment => {
        commentMap.set(comment.id, {
            id: comment.id,
            content: comment.content,
            created_at: comment.created_at,
            author: {
                id: comment.author_id,
                username: comment.author_name || 'Unknown'
            },
            likes: comment.likes || 0,
            parent_id: comment.parent_id,
            replies: [] // массив для ответов
        });
    });

    // Затем строим дерево
    comments.forEach(comment => {
        const commentNode = commentMap.get(comment.id);
        if (comment.parent_id) {
            // Это ответ - добавляем к родительскому комментарию
            const parent = commentMap.get(comment.parent_id);
            if (parent) {
                parent.replies.push(commentNode);
            }
        } else {
            // Это корневой комментарий
            rootComments.push(commentNode);
        }
    });

    return rootComments;
}

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
                    u.id as author_id,
                    c.name as category_name,
                    COUNT(DISTINCT com.id) as comments_count
                FROM topics t
                LEFT JOIN users u ON t.user_id = u.id
                LEFT JOIN categories c ON t.category_id = c.id
                LEFT JOIN comments com ON t.id = com.topic_id
                WHERE t.status = 'approved'
            `;

            let countQuery = `SELECT COUNT(*) FROM topics t WHERE t.status = 'approved'`;
            let queryParams = [];
            let countParams = [];

            if (category) {
                query += ` AND c.slug = $1`;
                countQuery += ` AND c.slug = $1`;
                queryParams.push(category);
                countParams.push(category);
            }

            query += ` GROUP BY t.id, u.username, u.id, c.name, c.id
                       ORDER BY t.created_at DESC 
                       LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
            
            queryParams.push(parseInt(limit), offset);

            console.log('🔍 SQL Query:', query);
            console.log('🔍 Query params:', queryParams);

            const topics = await db.query(query, queryParams);
            const totalCount = await db.query(countQuery, countParams);

            // Форматируем ответ
            const formattedTopics = topics.rows.map(topic => ({
                id: topic.id,
                title: topic.title,
                content: topic.content,
                tags: parseTags(topic.tags),
                views: topic.views || 0,
                likes: topic.likes || 0,
                comments_count: topic.comments_count || 0,
                created_at: topic.created_at,
                updated_at: topic.updated_at,
                author: {
                    id: topic.author_id,
                    username: topic.author_name || 'Unknown'
                },
                category: topic.category_name ? {
                    name: topic.category_name
                } : null
            }));

            res.json({
                success: true,
                topics: formattedTopics,
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

    async getTopicById(req, res) {
    try {
        const { id } = req.params;
        console.log('📝 Getting topic:', id);

        // Сначала увеличиваем счетчик просмотров
        await db.query(`
            UPDATE topics 
            SET views = COALESCE(views, 0) + 1 
            WHERE id = $1 AND status = 'approved'
        `, [id]);

        const topic = await db.query(`
            SELECT 
                t.*,
                u.username as author_name,
                u.id as author_id,
                c.name as category_name
            FROM topics t
            LEFT JOIN users u ON t.user_id = u.id
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.id = $1 AND t.status = 'approved'
        `, [id]);

        if (topic.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Topic not found' 
            });
        }

        // Получаем ВСЕ комментарии для темы (включая ответы)
        const comments = await db.query(`
            SELECT 
                c.*,
                u.username as author_name,
                u.id as author_id
            FROM comments c
            LEFT JOIN users u ON c.user_id = u.id
            WHERE c.topic_id = $1
            ORDER BY c.created_at ASC
        `, [id]);

        const topicData = topic.rows[0];
        const formattedTopic = {
            id: topicData.id,
            title: topicData.title,
            content: topicData.content,
            tags: parseTags(topicData.tags),
            views: topicData.views || 0,
            likes: topicData.likes || 0,
            created_at: topicData.created_at,
            updated_at: topicData.updated_at,
            author: {
                id: topicData.author_id,
                username: topicData.author_name || 'Unknown'
            },
            category: topicData.category_name ? {
                name: topicData.category_name
            } : null,
            comments: buildCommentTree(comments.rows)
        };

        res.json({
            success: true,
            topic: formattedTopic
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
                INSERT INTO topics (title, content, tags, user_id, category_id, status)
                VALUES ($1, $2, $3, $4, $5, 'pending')
                RETURNING *
            `, [title, content, JSON.stringify(tags || []), user_id, category_id || null]);

            res.status(201).json({
                success: true,
                topic: {
                    id: result.rows[0].id,
                    title: result.rows[0].title,
                    content: result.rows[0].content,
                    tags: tags || [],
                    status: result.rows[0].status
                },
                message: 'Topic created successfully and awaiting moderation'
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
                SET title = $1, content = $2, tags = $3, updated_at = NOW(), status = 'pending'
                WHERE id = $4
                RETURNING *
            `, [title, content, JSON.stringify(tags || []), id]);

            res.json({
                success: true,
                topic: result.rows[0],
                message: 'Topic updated successfully and sent for moderation'
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
                WHERE id = $1 AND status = 'approved'
            `, [id]);

            res.json({ success: true });
        } catch (error) {
            console.error('❌ Increment views error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Лайкнуть/дизлайкнуть тему
    async likeTopic(req, res) {
        try {
            const { id } = req.params;
            const user_id = req.userId;

            console.log('❤️ Like topic:', { topicId: id, userId: user_id });

            const topic = await db.query(
                'SELECT id FROM topics WHERE id = $1 AND status = $2',
                [id, 'approved']
            );

            if (topic.rows.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    error: 'Topic not found or not approved' 
                });
            }

            const existingLike = await db.query(
                'SELECT id FROM topic_likes WHERE topic_id = $1 AND user_id = $2',
                [id, user_id]
            );

            if (existingLike.rows.length > 0) {
                await db.query(
                    'DELETE FROM topic_likes WHERE topic_id = $1 AND user_id = $2',
                    [id, user_id]
                );
                
                await db.query(`
                    UPDATE topics 
                    SET likes = GREATEST(0, COALESCE(likes, 0) - 1) 
                    WHERE id = $1
                `, [id]);

                const updatedTopic = await db.query(
                    'SELECT likes FROM topics WHERE id = $1',
                    [id]
                );

                res.json({
                    success: true,
                    liked: false,
                    likes: updatedTopic.rows[0].likes || 0,
                    message: 'Topic unliked successfully'
                });
            } else {
                await db.query(
                    'INSERT INTO topic_likes (topic_id, user_id) VALUES ($1, $2)',
                    [id, user_id]
                );
                
                await db.query(`
                    UPDATE topics 
                    SET likes = COALESCE(likes, 0) + 1 
                    WHERE id = $1
                `, [id]);

                const updatedTopic = await db.query(
                    'SELECT likes FROM topics WHERE id = $1',
                    [id]
                );

                res.json({
                    success: true,
                    liked: true,
                    likes: updatedTopic.rows[0].likes || 0,
                    message: 'Topic liked successfully'
                });
            }
        } catch (error) {
            console.error('❌ Like topic error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
};

module.exports = topicController;