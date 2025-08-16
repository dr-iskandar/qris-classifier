const bcrypt = require('bcryptjs');
const { Client } = require('pg');

async function createAdmin() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'qris_classifier_prod',
    user: 'qris_classifier_user',
    password: 'YIKo9Sd3kGltDgjoLUwFKQDKF'
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Hash the password
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log('Password hashed successfully');

    // Update or insert admin user
    const result = await client.query(
      `INSERT INTO users (id, email, password_hash, role, rate_limit, is_active, api_key, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT (email) DO UPDATE SET 
       password_hash = EXCLUDED.password_hash,
       updated_at = CURRENT_TIMESTAMP`,
      ['admin-001', 'admin@qris-classifier.com', hashedPassword, 'admin', 1000, true, 'qris_admin_' + Math.random().toString(36).substring(2, 15)]
    );

    console.log('Admin user created/updated successfully');

    // Test password verification
    const userResult = await client.query('SELECT password_hash FROM users WHERE email = $1', ['admin@qris-classifier.com']);
    if (userResult.rows.length > 0) {
      const isValid = await bcrypt.compare(password, userResult.rows[0].password_hash);
      console.log('Password verification test:', isValid ? 'PASSED' : 'FAILED');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

createAdmin();