// backend/models/EmailVerificationToken.js
const db = require('../db/postgres');

class EmailVerificationToken {
  static async create(tokenData) {
    const { user_id, token, expires_at } = tokenData;
    
    const { rows } = await db.query(
      `INSERT INTO email_verification_tokens (user_id, token, expires_at) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [user_id, token, expires_at]
    );
    
    return rows[0];
  }

  static async findByToken(token) {
    const { rows } = await db.query(
      `SELECT evt.*, u.email 
       FROM email_verification_tokens evt
       LEFT JOIN users u ON evt.user_id = u.id
       WHERE evt.token = $1`,
      [token]
    );
    return rows[0];
  }

  static async markAsUsed(tokenId) {
    const { rows } = await db.query(
      'UPDATE email_verification_tokens SET used = true WHERE id = $1 RETURNING *',
      [tokenId]
    );
    return rows[0];
  }

  static async deleteExpiredTokens() {
    const { rows } = await db.query(
      'DELETE FROM email_verification_tokens WHERE expires_at < NOW() RETURNING *'
    );
    return rows;
  }
}

module.exports = EmailVerificationToken;