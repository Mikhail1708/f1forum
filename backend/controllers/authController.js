// backend/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/postgres');

const authController = {
  async login(req, res) {
    try {
      const { email, password } = req.body;

      console.log('Login attempt for:', email);

      // Проверяем существование пользователя
      const { rows } = await db.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      if (rows.length === 0) {
        console.log('User not found:', email);
        return res.status(401).json({ 
          success: false, 
          error: 'Invalid credentials' 
        });
      }

      const user = rows[0];

      // Проверяем пароль
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      
      if (!isPasswordValid) {
        console.log('Invalid password for:', email);
        return res.status(401).json({ 
          success: false, 
          error: 'Invalid credentials' 
        });
      }

      // Проверяем статус пользователя
      if (user.status === 'banned') {
        return res.status(403).json({ 
          success: false, 
          error: 'Account is banned' 
        });
      }

      // Обновляем информацию о логине
      await db.query(
        'UPDATE users SET last_login = NOW(), login_count = COALESCE(login_count, 0) + 1 WHERE id = $1',
        [user.id]
      );

      // Генерируем токен
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '7d' }
      );

      // Убираем пароль из ответа
      const { password_hash, ...userWithoutPassword } = user;

      console.log('Login successful for:', email);

      res.json({
        success: true,
        token,
        user: userWithoutPassword,
        message: 'Login successful'
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  },

  async register(req, res) {
    try {
      const { username, email, password, favorite_team, favorite_driver } = req.body;

      console.log('Registration attempt for:', email);

      // Проверяем, существует ли пользователь
      const existingUser = await db.query(
        'SELECT id FROM users WHERE email = $1 OR username = $2',
        [email, username]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'User already exists' 
        });
      }

      // Хешируем пароль
      const saltRounds = 10;
      const password_hash = await bcrypt.hash(password, saltRounds);

      // Создаем пользователя
      const { rows } = await db.query(
        `INSERT INTO users (username, email, password_hash, favorite_team, favorite_driver) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING id, username, email, role, status, favorite_team, favorite_driver, created_at`,
        [username, email, password_hash, favorite_team, favorite_driver]
      );

      const newUser = rows[0];

      // Генерируем токен
      const token = jwt.sign(
        { userId: newUser.id },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '7d' }
      );

      console.log('Registration successful for:', email);

      res.status(201).json({
        success: true,
        token,
        user: newUser,
        message: 'Registration successful'
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  },

  async getMe(req, res) {
    try {
      const { rows } = await db.query(
        `SELECT id, username, email, role, status, favorite_team, favorite_driver, 
                created_at, last_login, avatar_url 
         FROM users WHERE id = $1`,
        [req.userId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'User not found' 
        });
      }

      res.json({
        success: true,
        user: rows[0]
      });

    } catch (error) {
      console.error('Get me error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }
};
// Создание тестового модератора (для разработки)
const createTestModerator = async () => {
    try {
        const { rows } = await db.query(
            'SELECT id FROM users WHERE email = $1',
            ['moderator@f1forum.com']
        );

        if (rows.length === 0) {
            const password_hash = await bcrypt.hash('moderator123', 10);
            await db.query(
                `INSERT INTO users (username, email, password_hash, role, is_moderator) 
                 VALUES ($1, $2, $3, $4, $5)`,
                ['moderator', 'moderator@f1forum.com', password_hash, 'moderator', true]
            );
            console.log('✅ Test moderator created');
            console.log('📧 Login: moderator@f1forum.com');
            console.log('🔑 Password: moderator123');
        }
    } catch (error) {
        console.error('❌ Error creating test moderator:', error);
    }
};

// Вызовите эту функцию при запуске приложения
createTestModerator();

module.exports = authController;