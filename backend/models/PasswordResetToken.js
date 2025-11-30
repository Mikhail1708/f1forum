// backend/models/PasswordResetToken.js
const db = require('../db/postgres');

class PasswordResetToken {
  static async create(tokenData) {
    const { user_id, token, expires_at } = tokenData;
    
    const { rows } = await db.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [user_id, token, expires_at]
    );
    
    return rows[0];
  }

  static async findByToken(token) {
    const { rows } = await db.query(
      `SELECT prt.*, u.email 
       FROM password_reset_tokens prt
       LEFT JOIN users u ON prt.user_id = u.id
       WHERE prt.token = $1`,
      [token]
    );
    return rows[0];
  }

  static async markAsUsed(tokenId) {
    const { rows } = await db.query(
      'UPDATE password_reset_tokens SET used = true WHERE id = $1 RETURNING *',
      [tokenId]
    );
    return rows[0];
  }

  static async deleteExpiredTokens() {
    const { rows } = await db.query(
      'DELETE FROM password_reset_tokens WHERE expires_at < NOW() RETURNING *'
    );
    return rows;
  }
}

module.exports = PasswordResetToken;