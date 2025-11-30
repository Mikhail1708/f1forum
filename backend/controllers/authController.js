// backend/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

class AuthController {
  async login(req, res) {
    try {
      const { email, password } = req.body;

      console.log('🔐 Login attempt for:', email);

      // Проверяем существование пользователя
      const user = await User.findByEmail(email);
      if (!user) {
        console.log('❌ User not found:', email);
        return res.status(400).json({
          success: false,
          error: 'Неверный email или пароль'
        });
      }

      // Проверяем пароль
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        console.log('❌ Invalid password for:', email);
        return res.status(400).json({
          success: false,
          error: 'Неверный email или пароль'
        });
      }

      // Проверяем статус пользователя
      if (user.status === 'suspended' || user.status === 'banned') {
        console.log('❌ User suspended/banned:', email);
        return res.status(403).json({
          success: false,
          error: 'Ваш аккаунт заблокирован'
        });
      }

      // Обновляем информацию о входе
      await User.updateLoginInfo(user.id);

      // Создаем JWT токен
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email,
          role: user.role 
        },
        process.env.JWT_SECRET || 'fallback-secret-key',
        { expiresIn: '24h' }
      );

      // Логируем вход
      await ActivityLog.create({
        user_id: user.id,
        action: 'login',
        description: 'Успешный вход в систему',
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      console.log('✅ Login successful for:', email);

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          is_moderator: user.is_moderator,
          favorite_team: user.favorite_team,
          favorite_driver: user.favorite_driver,
          email_verified: user.email_verified
        }
      });

    } catch (error) {
      console.error('❌ Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при входе в систему'
      });
    }
  }

  async register(req, res) {
    try {
      const { username, email, password, favorite_team, favorite_driver } = req.body;

      console.log('👤 Registration attempt for:', email);

      // Проверяем, существует ли пользователь
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Пользователь с таким email уже существует'
        });
      }

      // Проверяем имя пользователя
      const existingUsername = await db.query(
        'SELECT id FROM users WHERE username = $1',
        [username]
      );
      
      if (existingUsername.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Пользователь с таким именем уже существует'
        });
      }

      // Хешируем пароль
      const passwordHash = await bcrypt.hash(password, 10);

      // Создаем пользователя
      const user = await User.create({
        username,
        email,
        password_hash: passwordHash,
        favorite_team,
        favorite_driver
      });

      // Логируем регистрацию
      await ActivityLog.create({
        user_id: user.id,
        action: 'register',
        description: 'Новый пользователь зарегистрирован',
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      console.log('✅ Registration successful for:', email);

      res.status(201).json({
        success: true,
        message: 'Пользователь успешно зарегистрирован',
        data: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      });

    } catch (error) {
      console.error('❌ Registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при регистрации'
      });
    }
  }

  async getMe(req, res) {
    try {
      const user = await User.findById(req.userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Пользователь не найден'
        });
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          is_moderator: user.is_moderator,
          favorite_team: user.favorite_team,
          favorite_driver: user.favorite_driver,
          email_verified: user.email_verified,
          created_at: user.created_at,
          last_login: user.last_login
        }
      });

    } catch (error) {
      console.error('❌ Get me error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении данных пользователя'
      });
    }
  }

  async logout(req, res) {
    try {
      // Логируем выход
      await ActivityLog.create({
        user_id: req.userId,
        action: 'logout',
        description: 'Выход из системы',
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Выход выполнен успешно'
      });

    } catch (error) {
      console.error('❌ Logout error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при выходе из системы'
      });
    }
  }

  async verifyEmail(req, res) {
    try {
      const { token } = req.query;

      // TODO: Реализовать логику подтверждения email
      // Пока просто возвращаем успех для тестирования
      await User.verifyEmail(req.userId);

      res.json({
        success: true,
        message: 'Email успешно подтвержден'
      });

    } catch (error) {
      console.error('❌ Verify email error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при подтверждении email'
      });
    }
  }

  async requestPasswordReset(req, res) {
    try {
      const { email } = req.body;

      const user = await User.findByEmail(email);
      if (!user) {
        // Для безопасности не сообщаем, что пользователь не существует
        return res.json({
          success: true,
          message: 'Если пользователь с таким email существует, инструкции по сбросу пароля будут отправлены'
        });
      }

      // TODO: Реализовать отправку email с токеном сброса
      console.log(`Password reset requested for: ${email}`);

      res.json({
        success: true,
        message: 'Инструкции по сбросу пароля отправлены на ваш email'
      });

    } catch (error) {
      console.error('❌ Password reset request error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при запросе сброса пароля'
      });
    }
  }

  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      // TODO: Реализовать проверку токена и сброс пароля
      console.log(`Password reset attempt with token: ${token}`);

      // Временная реализация для тестирования
      const passwordHash = await bcrypt.hash(newPassword, 10);
      // Нужно получить user_id из токена
      // await User.changePassword(userId, passwordHash);

      res.json({
        success: true,
        message: 'Пароль успешно изменен'
      });

    } catch (error) {
      console.error('❌ Password reset error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при сбросе пароля'
      });
    }
  }
}

module.exports = new AuthController();