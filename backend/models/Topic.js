// backend/models/Topic.js
const db = require('../db/postgres');

class Topic {
  static async create(topicData) {
    const { title, content, user_id, tags = [] } = topicData;
    
    const { rows } = await db.query(
      `INSERT INTO topics (title, content, user_id, tags, status) 
       VALUES ($1, $2, $3, $4, 'pending') 
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
      WHERE t.status = 'approved'
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
      WHERE t.id = $1 AND t.status = 'approved'
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
    const topicId = parseInt(id);
    if (isNaN(topicId) || topicId <= 0) {
      console.error('Invalid topic ID for incrementViews:', id);
      return;
    }

    await db.query(
      'UPDATE topics SET views = COALESCE(views, 0) + 1 WHERE id = $1 AND status = $2',
      [topicId, 'approved']
    );
  }

  static async likeTopic(id, userId) {
    const topicId = parseInt(id);
    const user_Id = parseInt(userId);
    
    if (isNaN(topicId) || topicId <= 0) {
      throw new Error('Invalid topic ID');
    }
    if (isNaN(user_Id) || user_Id <= 0) {
      throw new Error('Invalid user ID');
    }

    try {
      const { rows: existingLike } = await db.query(
        'SELECT * FROM topic_likes WHERE topic_id = $1 AND user_id = $2',
        [topicId, user_Id]
      );
      
      if (existingLike.length > 0) {
        await db.query(
          'DELETE FROM topic_likes WHERE topic_id = $1 AND user_id = $2',
          [topicId, user_Id]
        );
        await db.query(
          'UPDATE topics SET likes = GREATEST(COALESCE(likes, 0) - 1, 0) WHERE id = $1', // ИСПРАВЛЕНО: likes
          [topicId]
        );
        return { liked: false, action: 'removed' };
      } else {
        await db.query(
          'INSERT INTO topic_likes (topic_id, user_id) VALUES ($1, $2)',
          [topicId, user_Id]
        );
        await db.query(
          'UPDATE topics SET likes = COALESCE(likes, 0) + 1 WHERE id = $1', // ИСПРАВЛЕНО: likes
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

  static async update(id, updateData) {
    const { title, content, tags = [] } = updateData;
    
    const topicId = parseInt(id);
    if (isNaN(topicId) || topicId <= 0) {
      throw new Error('Invalid topic ID');
    }

    const { rows } = await db.query(
      `UPDATE topics 
       SET title = $1, content = $2, tags = $3, updated_at = CURRENT_TIMESTAMP, status = 'pending'
       WHERE id = $4 
       RETURNING *`,
      [title, content, JSON.stringify(tags), topicId]
    );

    if (rows.length === 0) {
      throw new Error('Topic not found');
    }

    const updatedTopic = rows[0];
    updatedTopic.tags = tags;
    
    return updatedTopic;
  }

  static async delete(id) {
    const topicId = parseInt(id);
    if (isNaN(topicId) || topicId <= 0) {
      throw new Error('Invalid topic ID');
    }

    try {
      await db.query('BEGIN');
      await db.query('DELETE FROM topic_likes WHERE topic_id = $1', [topicId]);
      await db.query('DELETE FROM comments WHERE topic_id = $1', [topicId]);
      const { rows } = await db.query(
        'DELETE FROM topics WHERE id = $1 RETURNING *',
        [topicId]
      );
      await db.query('COMMIT');
      return rows[0];
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  }
}

module.exports = Topic;