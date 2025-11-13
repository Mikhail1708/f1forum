const db = require('../db/postgres');

class Topic {
  static async create(topicData) {
    const { title, content, user_id, tags = [] } = topicData;
    
    const { rows } = await db.query(
      `INSERT INTO topics (title, content, user_id, tags) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [title, content, user_id, JSON.stringify(tags)]
    );
    
    return rows[0];
  }

  static async findAll() {
    const { rows } = await db.query(`
      SELECT t.*, u.username as author_username,
             (SELECT COUNT(*) FROM comments WHERE topic_id = t.id) as comments_count
      FROM topics t
      LEFT JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
    `);
    
    return rows.map(row => ({
      ...row,
      tags: row.tags ? JSON.parse(row.tags) : [],
      author: { username: row.author_username || 'Unknown' },
      comments_count: row.comments_count || 0
    }));
  }

  static async findById(id) {
    // Проверяем валидность ID
    const topicId = parseInt(id);
    if (isNaN(topicId) || topicId <= 0) {
      console.error('Invalid topic ID:', id);
      return null;
    }

    const { rows } = await db.query(`
      SELECT t.*, u.username as author_username,
             (SELECT COUNT(*) FROM comments WHERE topic_id = t.id) as comments_count
      FROM topics t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.id = $1
    `, [topicId]);
    
    if (rows.length === 0) return null;
    
    const row = rows[0];
    return {
      ...row,
      tags: row.tags ? JSON.parse(row.tags) : [],
      author: { username: row.author_username || 'Unknown' },
      comments_count: row.comments_count || 0,
      comments: []
    };
  }

  static async incrementViews(id) {
    // Проверяем валидность ID
    const topicId = parseInt(id);
    if (isNaN(topicId) || topicId <= 0) {
      console.error('Invalid topic ID for incrementViews:', id);
      return;
    }

    await db.query(
      'UPDATE topics SET views = COALESCE(views, 0) + 1 WHERE id = $1',
      [topicId]
    );
  }

  static async likeTopic(id, userId) {
    // Проверяем валидность ID
    const topicId = parseInt(id);
    const user_Id = parseInt(userId);
    
    if (isNaN(topicId) || topicId <= 0) {
      throw new Error('Invalid topic ID');
    }
    if (isNaN(user_Id) || user_Id <= 0) {
      throw new Error('Invalid user ID');
    }

    try {
      // Проверяем существующий лайк
      const { rows: existingLike } = await db.query(
        'SELECT * FROM topic_likes WHERE topic_id = $1 AND user_id = $2',
        [topicId, user_Id]
      );
      
      if (existingLike.length > 0) {
        // Удаляем лайк
        await db.query(
          'DELETE FROM topic_likes WHERE topic_id = $1 AND user_id = $2',
          [topicId, user_Id]
        );
        await db.query(
          'UPDATE topics SET likes = GREATEST(COALESCE(likes, 0) - 1, 0) WHERE id = $1',
          [topicId]
        );
        return { liked: false, action: 'removed' };
      } else {
        // Добавляем лайк
        await db.query(
          'INSERT INTO topic_likes (topic_id, user_id) VALUES ($1, $2)',
          [topicId, user_Id]
        );
        await db.query(
          'UPDATE topics SET likes = COALESCE(likes, 0) + 1 WHERE id = $1',
          [topicId]
        );
        return { liked: true, action: 'added' };
      }
    } catch (error) {
      console.error('Like topic error:', error);
      throw error;
    }
  }

  static async getLikesCount(id) {
    // Проверяем валидность ID
    const topicId = parseInt(id);
    if (isNaN(topicId) || topicId <= 0) {
      console.error('Invalid topic ID for getLikesCount:', id);
      return 0;
    }

    const { rows } = await db.query(
      'SELECT COUNT(*) as count FROM topic_likes WHERE topic_id = $1',
      [topicId]
    );
    return parseInt(rows[0].count);
  }
}

module.exports = Topic;