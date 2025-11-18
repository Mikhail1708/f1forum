const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function resetAdminPassword() {
  // Конфигурация подключения - используем правильное имя БД 11_forum
  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'f1_forum', // ПРАВИЛЬНОЕ имя базы данных
    password: process.env.DB_PASSWORD || '123', // Ваш пароль
    port: process.env.DB_PORT || 5432,
  });

  const client = await pool.connect();
  
  try {
    console.log('Connecting to f1_forum database...');
    
    // Находим администратора
    const result = await client.query(
      'SELECT id, username, email FROM users WHERE email = $1 AND role = $2', 
      ['admin@mforum com', 'admin']
    );
    
    if (result.rows.length === 0) {
      console.log('Admin user not found with email: admin@mforum com');
      
      // Попробуем найти любого администратора
      const adminResult = await client.query(
        'SELECT id, username, email FROM users WHERE role = $1 LIMIT 1', 
        ['admin']
      );
      
      if (adminResult.rows.length === 0) {
        console.log('No admin users found!');
        return;
      }
      
      console.log(`Found admin: ${adminResult.rows[0].username} (${adminResult.rows[0].email})`);
      var admin = adminResult.rows[0];
    } else {
      console.log(`Found admin: ${result.rows[0].username} (${result.rows[0].email})`);
      var admin = result.rows[0];
    }

    // Генерируем новый пароль
    const newPassword = 'Admin123!';
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(newPassword, saltRounds);

    // Обновляем пароль
    await client.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [password_hash, admin.id]
    );

    console.log('\n✅ PASSWORD RESET SUCCESSFUL!');
    console.log('=================================');
    console.log(`Database: f1_forum`);
    console.log(`Admin: ${admin.email}`);
    console.log(`New password: ${newPassword}`);
    console.log('=================================');
    console.log('You can now login with:');
    console.log(`Email: ${admin.email}`);
    console.log(`Password: ${newPassword}`);
    
  } catch (error) {
    console.error('❌ Error resetting password:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

resetAdminPassword();