const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authController = {
  async register(req, res) {
    try {
      const { username, email, password, favorite_team, favorite_driver } = req.body;

      console.log('Registration attempt:', { username, email });
      console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');

      // Валидация
      if (!username || !email || !password) {
        return res.status(400).json({ error: 'Username, email and password are required' });
      }

      // Проверяем, существует ли пользователь
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Хешируем пароль
      const saltRounds = 10;
      const password_hash = await bcrypt.hash(password, saltRounds);

      // Создаем пользователя
      const user = await User.create({
        username,
        email,
        password_hash,
        favorite_team,
        favorite_driver
      });

      // Создаем JWT токен с правильным секретом
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' } // Увеличиваем время жизни токена
      );

      // Обновляем информацию о входе
      await User.updateLoginInfo(user.id);

      console.log('User registered successfully:', user.username);

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          favorite_team: user.favorite_team,
          favorite_driver: user.favorite_driver
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;

      console.log('Login attempt for email:', email);
      console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Находим пользователя
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      // Проверяем пароль
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      // Создаем JWT токен с правильным секретом
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' } // Увеличиваем время жизни токена
      );

      // Обновляем информацию о входе
      await User.updateLoginInfo(user.id);

      console.log('User logged in successfully:', user.username);

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          favorite_team: user.favorite_team,
          favorite_driver: user.favorite_driver
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async verify(req, res) {
    try {
      // Если middleware auth прошел успешно, пользователь авторизован
      res.json({
        user: {
          id: req.user.id,
          username: req.user.username,
          email: req.user.email,
          role: req.user.role
        }
      });
    } catch (error) {
      console.error('Verify error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = authController;