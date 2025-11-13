const db = require('../db/postgres');

class Comment {
  // Создание комментария
  static async create(commentData) {
    const { content, topic_id, user_id, parent_id = null } = commentData;
    
    // Проверяем валидность ID
    const topicId = parseInt(topic_id);
    const userId = parseInt(user_id);
    
    if (isNaN(topicId) || topicId <= 0) {
      throw new Error('Invalid topic ID');
    }
    if (isNaN(userId) || userId <= 0) {
      throw new Error('Invalid user ID');
    }

    const { rows } = await db.query(
      `INSERT INTO comments (content, topic_id, user_id, parent_id) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [content, topicId, userId, parent_id]
    );
    
    return rows[0];
  }

  // Создание ответа (алиас для create)
  static async createReply(commentData) {
    return await this.create(commentData);
  }

  // Получение комментариев для темы
  static async findByTopicId(topicId) {
    // Проверяем валидность ID
    const id = parseInt(topicId);
    if (isNaN(id) || id <= 0) {
      console.error('Invalid topic ID for findByTopicId:', topicId);
      return [];
    }

    const { rows } = await db.query(`
      SELECT 
        c.*,
        u.username as author_username,
        COUNT(r.id) as reply_count
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN comments r ON r.parent_id = c.id
      WHERE c.topic_id = $1 AND c.parent_id IS NULL
      GROUP BY c.id, u.username
      ORDER BY c.created_at ASC
    `, [id]);
    
    // Для каждого комментария получаем ответы
    const commentsWithReplies = await Promise.all(
      rows.map(async (comment) => {
        const replies = await this.getReplies(comment.id);
        return {
          ...comment,
          author: { username: comment.author_username || 'Unknown' },
          replies: replies
        };
      })
    );
    
    return commentsWithReplies;
  }

  // Получение ответов на комментарий
  static async getReplies(parentId) {
    // Проверяем валидность ID
    const id = parseInt(parentId);
    if (isNaN(id) || id <= 0) {
      console.error('Invalid parent ID for getReplies:', parentId);
      return [];
    }

    const { rows } = await db.query(`
      SELECT 
        c.*,
        u.username as author_username
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.parent_id = $1
      ORDER BY c.created_at ASC
    `, [id]);
    
    return rows.map(row => ({
      ...row,
      author: { username: row.author_username || 'Unknown' }
    }));
  }

  // Получение комментария по ID
  static async findById(id) {
    // Проверяем валидность ID
    const commentId = parseInt(id);
    if (isNaN(commentId) || commentId <= 0) {
      console.error('Invalid comment ID for findById:', id);
      return null;
    }

    const { rows } = await db.query(`
      SELECT 
        c.*,
        u.username as author_username
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = $1
    `, [commentId]);
    
    if (rows.length === 0) return null;
    
    const row = rows[0];
    return {
      ...row,
      author: { username: row.author_username || 'Unknown' }
    };
  }

  // Обновление комментария
  static async update(id, updateData) {
    const { content } = updateData;
    
    // Проверяем валидность ID
    const commentId = parseInt(id);
    if (isNaN(commentId) || commentId <= 0) {
      throw new Error('Invalid comment ID');
    }

    const { rows } = await db.query(
      `UPDATE comments 
       SET content = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [content, commentId]
    );

    if (rows.length === 0) {
      throw new Error('Comment not found');
    }

    return rows[0];
  }

  // Удаление комментария
  static async delete(id) {
    // Проверяем валидность ID
    const commentId = parseInt(id);
    if (isNaN(commentId) || commentId <= 0) {
      throw new Error('Invalid comment ID');
    }

    try {
      // Начинаем транзакцию
      await db.query('BEGIN');

      // Удаляем лайки комментария
      await db.query('DELETE FROM comment_likes WHERE comment_id = $1', [commentId]);
      
      // Если это родительский комментарий, удаляем его ответы
      const { rows: childComments } = await db.query(
        'SELECT id FROM comments WHERE parent_id = $1',
        [commentId]
      );
      
      if (childComments.length > 0) {
        // Удаляем лайки дочерних комментариев
        await db.query(
          'DELETE FROM comment_likes WHERE comment_id IN (SELECT id FROM comments WHERE parent_id = $1)',
          [commentId]
        );
        // Удаляем дочерние комментарии
        await db.query('DELETE FROM comments WHERE parent_id = $1', [commentId]);
      }
      
      // Удаляем сам комментарий
      const { rows } = await db.query(
        'DELETE FROM comments WHERE id = $1 RETURNING *',
        [commentId]
      );

      // Коммитим транзакцию
      await db.query('COMMIT');
      
      return rows[0];
    } catch (error) {
      // Откатываем транзакцию при ошибке
      await db.query('ROLLBACK');
      throw error;
    }
  }

  // Лайк комментария
  static async likeComment(id, userId) {
    // Проверяем валидность ID
    const commentId = parseInt(id);
    const user_Id = parseInt(userId);
    
    if (isNaN(commentId) || commentId <= 0) {
      throw new Error('Invalid comment ID');
    }
    if (isNaN(user_Id) || user_Id <= 0) {
      throw new Error('Invalid user ID');
    }

    const { rows: existingLike } = await db.query(
      'SELECT * FROM comment_likes WHERE comment_id = $1 AND user_id = $2',
      [commentId, user_Id]
    );
    
    if (existingLike.length > 0) {
      await db.query(
        'DELETE FROM comment_likes WHERE comment_id = $1 AND user_id = $2',
        [commentId, user_Id]
      );
      await db.query(
        'UPDATE comments SET likes = GREATEST(likes - 1, 0) WHERE id = $1',
        [commentId]
      );
      return { liked: false };
    } else {
      await db.query(
        'INSERT INTO comment_likes (comment_id, user_id) VALUES ($1, $2)',
        [commentId, user_Id]
      );
      await db.query(
        'UPDATE comments SET likes = COALESCE(likes, 0) + 1 WHERE id = $1',
        [commentId]
      );
      return { liked: true };
    }
  }
}

module.exports = Comment;