const bcrypt = require('bcryptjs');
const { Client } = require('pg');

async function fixAdminPassword() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'qris_classifier',
    user: 'postgres',
    password: 'postgres'
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Hash the correct password
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log('New password hash generated:', hashedPassword);

    // Verify the new hash works
    const isValid = await bcrypt.compare(password, hashedPassword);
    console.log('New hash verification:', isValid ? 'VALID' : 'INVALID');

    if (isValid) {
      // Update the admin user password
      const result = await client.query(
        'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2',
        [hashedPassword, 'admin@qris-classifier.com']
      );

      console.log('Admin password updated successfully. Rows affected:', result.rowCount);

      // Verify the update
      const userResult = await client.query(
        'SELECT password_hash FROM users WHERE email = $1',
        ['admin@qris-classifier.com']
      );

      if (userResult.rows.length > 0) {
        const finalCheck = await bcrypt.compare(password, userResult.rows[0].password_hash);
        console.log('Final verification from database:', finalCheck ? 'SUCCESS' : 'FAILED');
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

fixAdminPassword();