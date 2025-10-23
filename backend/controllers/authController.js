const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authController = {
  async register(req, res) {
    try {
      const { username, email, password, favorite_team, favorite_driver } = req.body;
      
      // Проверка существования пользователя
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Хеширование пароля
      const password_hash = await bcrypt.hash(password, 10);
      
      // Создание пользователя
      const user = await User.create({
        username,
        email,
        password_hash,
        favorite_team,
        favorite_driver
      });

      // Генерация JWT токена
      const token = jwt.sign(
        { userId: user.id }, 
        process.env.JWT_SECRET || 'your_jwt_secret',
        { expiresIn: '24h' }
      );

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          favorite_team: user.favorite_team,
          favorite_driver: user.favorite_driver
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // controllers/authController.js
async login(req, res) {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for email:', email);
    
    const user = await User.findByEmail(email);
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await User.updateLoginInfo(user.id);

    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '24h' }
    );

    console.log('Login successful for user:', {
      id: user.id,
      username: user.username,
      role: user.role
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        favorite_team: user.favorite_team,
        favorite_driver: user.favorite_driver,
        role: user.role, // Убедитесь, что это поле есть
        is_moderator: user.is_moderator,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
},
  async getProfile(req, res) {
    try {
      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ 
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          favorite_team: user.favorite_team,
          favorite_driver: user.favorite_driver,
          role: user.role,
          is_moderator: user.is_moderator,
          created_at: user.created_at
        }
      });
    } catch (error) {
      console.error('Profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = authController;