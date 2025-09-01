const bcrypt = require('bcryptjs');

async function verifyPassword() {
  const password = 'admin123';
  const storedHash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO9G';
  
  try {
    const isValid = await bcrypt.compare(password, storedHash);
    console.log('Password verification result:', isValid ? 'VALID' : 'INVALID');
    console.log('Expected password:', password);
    console.log('Stored hash:', storedHash);
    
    // Test with different possible passwords
    const testPasswords = ['admin123', 'Admin123', 'ADMIN123', 'admin', 'password'];
    
    console.log('\nTesting different passwords:');
    for (const testPwd of testPasswords) {
      const result = await bcrypt.compare(testPwd, storedHash);
      console.log(`${testPwd}: ${result ? 'MATCH' : 'NO MATCH'}`);
    }
    
  } catch (error) {
    console.error('Error verifying password:', error);
  }
}

verifyPassword();