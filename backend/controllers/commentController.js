// backend/controllers/commentController.js
const db = require('../db/postgres');

const commentController = {
    // Получить комментарии для темы
    async getCommentsByTopic(req, res) {
        try {
            const { topicId } = req.params;
            console.log('💬 Getting comments for topic:', topicId);

            const comments = await db.query(`
                SELECT 
                    c.*,
                    u.username as author_name,
                    u.id as author_id
                FROM comments c
                LEFT JOIN users u ON c.user_id = u.id
                WHERE c.topic_id = $1
                ORDER BY c.created_at ASC
            `, [topicId]);

            res.json({
                success: true,
                comments: comments.rows
            });
        } catch (error) {
            console.error('❌ Get comments error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Создать комментарий
    async createComment(req, res) {
        try {
            const { content, topic_id, parent_id = null } = req.body;
            const user_id = req.userId;

            console.log('💬 Creating comment:', { topic_id, user_id });

            if (!content || !topic_id) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Content and topic_id are required' 
                });
            }

            const result = await db.query(`
                INSERT INTO comments (content, user_id, topic_id, parent_id)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            `, [content, user_id, topic_id, parent_id]);

            res.status(201).json({
                success: true,
                comment: result.rows[0],
                message: 'Comment created successfully'
            });
        } catch (error) {
            console.error('❌ Create comment error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Создать ответ на комментарий (alias для createComment)
    async createReply(req, res) {
        try {
            const { content, topic_id, parent_id } = req.body;
            const user_id = req.userId;

            console.log('💬 Creating reply:', { parent_id, user_id });

            if (!content || !topic_id || !parent_id) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Content, topic_id and parent_id are required' 
                });
            }

            const result = await db.query(`
                INSERT INTO comments (content, user_id, topic_id, parent_id)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            `, [content, user_id, topic_id, parent_id]);

            res.status(201).json({
                success: true,
                comment: result.rows[0],
                message: 'Reply created successfully'
            });
        } catch (error) {
            console.error('❌ Create reply error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Обновить комментарий
    async updateComment(req, res) {
        try {
            const { id } = req.params;
            const { content } = req.body;
            const user_id = req.userId;

            console.log('💬 Updating comment:', id);

            const existingComment = await db.query(
                'SELECT user_id FROM comments WHERE id = $1',
                [id]
            );

            if (existingComment.rows.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    error: 'Comment not found' 
                });
            }

            const comment = existingComment.rows[0];
            
            // Проверяем авторство ИЛИ права администратора/модератора
            if (comment.user_id !== user_id && req.user.role !== 'admin' && req.user.role !== 'moderator') {
                return res.status(403).json({ 
                    success: false, 
                    error: 'Not authorized to update this comment' 
                });
            }

            const result = await db.query(`
                UPDATE comments 
                SET content = $1, updated_at = NOW()
                WHERE id = $2
                RETURNING *
            `, [content, id]);

            res.json({
                success: true,
                comment: result.rows[0],
                message: 'Comment updated successfully'
            });
        } catch (error) {
            console.error('❌ Update comment error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Удалить комментарий
    async deleteComment(req, res) {
        try {
            const { id } = req.params;
            const user_id = req.userId;

            console.log('💬 Deleting comment:', id);

            const existingComment = await db.query(
                'SELECT user_id FROM comments WHERE id = $1',
                [id]
            );

            if (existingComment.rows.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    error: 'Comment not found' 
                });
            }

            const comment = existingComment.rows[0];
            
            // Проверяем авторство ИЛИ права администратора/модератора
            if (comment.user_id !== user_id && req.user.role !== 'admin' && req.user.role !== 'moderator') {
                return res.status(403).json({ 
                    success: false, 
                    error: 'Not authorized to delete this comment' 
                });
            }

            await db.query('DELETE FROM comments WHERE id = $1', [id]);

            res.json({
                success: true,
                message: 'Comment deleted successfully'
            });
        } catch (error) {
            console.error('❌ Delete comment error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Лайкнуть комментарий
    async likeComment(req, res) {
        try {
            const { id } = req.params;
            const user_id = req.userId;

            console.log('❤️ Like comment:', { commentId: id, userId: user_id });

            const existingLike = await db.query(
                'SELECT id FROM comment_likes WHERE comment_id = $1 AND user_id = $2',
                [id, user_id]
            );

            if (existingLike.rows.length > 0) {
                await db.query(
                    'DELETE FROM comment_likes WHERE comment_id = $1 AND user_id = $2',
                    [id, user_id]
                );
                
                await db.query(`
                    UPDATE comments 
                    SET likes = GREATEST(0, COALESCE(likes, 0) - 1) 
                    WHERE id = $1
                `, [id]);

                const updatedComment = await db.query(
                    'SELECT likes FROM comments WHERE id = $1',
                    [id]
                );

                res.json({
                    success: true,
                    liked: false,
                    likes: updatedComment.rows[0].likes || 0,
                    message: 'Comment unliked successfully'
                });
            } else {
                await db.query(
                    'INSERT INTO comment_likes (comment_id, user_id) VALUES ($1, $2)',
                    [id, user_id]
                );
                
                await db.query(`
                    UPDATE comments 
                    SET likes = COALESCE(likes, 0) + 1 
                    WHERE id = $1
                `, [id]);

                const updatedComment = await db.query(
                    'SELECT likes FROM comments WHERE id = $1',
                    [id]
                );

                res.json({
                    success: true,
                    liked: true,
                    likes: updatedComment.rows[0].likes || 0,
                    message: 'Comment liked successfully'
                });
            }
        } catch (error) {
            console.error('❌ Like comment error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
};

module.exports = commentController;