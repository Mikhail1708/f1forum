// backend/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/postgres');

const authController = {
  async login(req, res) {
    try {
      const { email, password } = req.body;

      console.log('🔐 Login attempt for:', email);

      // Проверяем существование пользователя
      const { rows } = await db.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      if (rows.length === 0) {
        console.log('❌ User not found:', email);
        return res.status(401).json({ 
          success: false, 
          error: 'Неверный email или пароль' 
        });
      }

      const user = rows[0];

      // ВАЖНОЕ ИСПРАВЛЕНИЕ: проверяем правильное поле пароля
      const isPasswordValid = await bcrypt.compare(password, user.password_hash || user.password);
      
      if (!isPasswordValid) {
        console.log('❌ Invalid password for:', email);
        return res.status(401).json({ 
          success: false, 
          error: 'Неверный email или пароль' 
        });
      }

      // ВАЖНОЕ ИСПРАВЛЕНИЕ: проверяем статус пользователя
      if (user.status === 'suspended' || user.status === 'banned') {
        console.log('🚫 Blocked user tried to login:', email, 'Status:', user.status);
        return res.status(403).json({ 
          success: false, 
          error: 'Ваш аккаунт заблокирован. Обратитесь к администратору.' 
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
      const { password_hash, password: pwd, ...userWithoutPassword } = user;

      console.log('✅ Login successful for:', user.username, 'Role:', user.role, 'Status:', user.status);

      res.json({
        success: true,
        token,
        user: userWithoutPassword,
        message: 'Login successful'
      });

    } catch (error) {
      console.error('❌ Login error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Ошибка сервера' 
      });
    }
  },

  async register(req, res) {
    try {
      const { username, email, password, favorite_team, favorite_driver } = req.body;

      console.log('👤 Registration attempt for:', email);

      // Проверяем, существует ли пользователь
      const existingUser = await db.query(
        'SELECT id FROM users WHERE email = $1 OR username = $2',
        [email, username]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Пользователь с таким email или именем уже существует' 
        });
      }

      // Хешируем пароль
      const saltRounds = 10;
      const password_hash = await bcrypt.hash(password, saltRounds);

      // Создаем пользователя
      const { rows } = await db.query(
        `INSERT INTO users (username, email, password_hash, favorite_team, favorite_driver, status) 
         VALUES ($1, $2, $3, $4, $5, 'active') 
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

      console.log('✅ Registration successful for:', email);

      res.status(201).json({
        success: true,
        token,
        user: newUser,
        message: 'Регистрация успешна'
      });

    } catch (error) {
      console.error('❌ Registration error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Ошибка сервера' 
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
          error: 'Пользователь не найден' 
        });
      }

      const user = rows[0];

      // Проверяем статус при получении профиля
      if (user.status === 'suspended' || user.status === 'banned') {
        return res.status(403).json({ 
          success: false, 
          error: 'Аккаунт заблокирован' 
        });
      }

      res.json({
        success: true,
        user: user
      });

    } catch (error) {
      console.error('❌ Get me error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Ошибка сервера' 
      });
    }
  },

  // Выход из системы (логика на фронтенде, но можно добавить blacklist токенов)
  async logout(req, res) {
    try {
      // В реальном приложении здесь можно добавить токен в blacklist
      console.log('🚪 User logout:', req.userId);
      
      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      console.error('❌ Logout error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Ошибка сервера' 
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
                `INSERT INTO users (username, email, password_hash, role, status) 
                 VALUES ($1, $2, $3, $4, $5)`,
                ['moderator', 'moderator@f1forum.com', password_hash, 'moderator', 'active']
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