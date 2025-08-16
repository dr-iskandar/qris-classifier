require('dotenv').config();
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function testDatabaseAuth() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Database connected successfully');

    // Check if admin user exists
    const result = await client.query(
      'SELECT id, email, password_hash, role, is_active FROM users WHERE email = $1',
      ['admin@qris-classifier.com']
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('Admin user found:', {
        id: user.id,
        email: user.email,
        role: user.role,
        is_active: user.is_active
      });

      // Test password verification
      const isValidPassword = await bcrypt.compare('admin123', user.password_hash);
      console.log('Password verification result:', isValidPassword);

      if (isValidPassword && user.is_active) {
        console.log('✅ Authentication should work!');
      } else {
        console.log('❌ Authentication failed - password invalid or user inactive');
      }
    } else {
      console.log('❌ Admin user not found in database');
    }

    await client.end();
  } catch (error) {
    console.error('Database test failed:', error.message);
  }
}

testDatabaseAuth();