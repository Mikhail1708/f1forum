// backend/models/Backup.js
const db = require('../db/postgres');

class Backup {
  static async create(backupData) {
    const { filename, filepath, size, type = 'full', notes, created_by } = backupData;
    
    const { rows } = await db.query(
      `INSERT INTO backups (filename, filepath, size, type, notes, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [filename, filepath, size, type, notes, created_by]
    );
    
    return rows[0];
  }

  static async findAll(limit = 50, offset = 0) {
    const { rows } = await db.query(
      `SELECT b.*, u.username as created_by_username 
       FROM backups b 
       LEFT JOIN users u ON b.created_by = u.id 
       ORDER BY b.created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return rows;
  }

  static async findById(id) {
    const { rows } = await db.query(
      `SELECT b.*, u.username as created_by_username 
       FROM backups b 
       LEFT JOIN users u ON b.created_by = u.id 
       WHERE b.id = $1`,
      [id]
    );
    return rows[0];
  }

  static async delete(id) {
    const { rowCount } = await db.query(
      'DELETE FROM backups WHERE id = $1',
      [id]
    );
    return rowCount > 0;
  }

  static async getStats() {
    const { rows } = await db.query(`
      SELECT 
        COUNT(*) as total_backups,
        COALESCE(SUM(size), 0) as total_size,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as recent_count
      FROM backups
    `);
    return rows[0];
  }
}

module.exports = Backup;