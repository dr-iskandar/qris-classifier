const { AuthService } = require('./src/lib/auth.ts');

async function testAuth() {
  try {
    console.log('Initializing AuthService...');
    await AuthService.initialize();
    
    console.log('Creating test admin user...');
    const testUser = await AuthService.createUser(
      'test@example.com',
      'testpassword123',
      'admin',
      1000
    );
    
    console.log('Test user created:');
    console.log('Email:', testUser.email);
    console.log('API Key:', testUser.apiKey);
    console.log('Role:', testUser.role);
    
    // Generate JWT token
    const token = AuthService.generateToken(testUser);
    console.log('JWT Token:', token);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testAuth();