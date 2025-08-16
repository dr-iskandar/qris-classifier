#!/usr/bin/env node

/**
 * PostgreSQL Connection Test Script
 * This script checks if PostgreSQL is available and tests the connection
 */

const { Client } = require('pg');
require('dotenv').config();

async function checkPostgreSQL() {
  console.log('🔍 Checking PostgreSQL connection...');
  console.log('📋 Configuration:');
  console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`   Port: ${process.env.DB_PORT || '5432'}`);
  console.log(`   Database: ${process.env.DB_NAME || 'qris_classifier'}`);
  console.log(`   User: ${process.env.DB_USER || 'postgres'}`);
  console.log('');

  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'qris_classifier',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    console.log('🔌 Attempting to connect...');
    await client.connect();
    console.log('✅ PostgreSQL connection successful!');
    
    // Test query
    const result = await client.query('SELECT version()');
    console.log(`📊 PostgreSQL version: ${result.rows[0].version}`);
    
    // Check if our tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'api_keys', 'request_logs', 'system_logs')
    `);
    
    console.log('\n📋 Database tables status:');
    const expectedTables = ['users', 'api_keys', 'request_logs', 'system_logs'];
    const existingTables = tablesResult.rows.map(row => row.table_name);
    
    expectedTables.forEach(table => {
      if (existingTables.includes(table)) {
        console.log(`   ✅ ${table} - exists`);
      } else {
        console.log(`   ❌ ${table} - missing`);
      }
    });
    
    if (existingTables.length === 0) {
      console.log('\n⚠️  No tables found. Run the setup script:');
      console.log('   psql -U postgres -d qris_classifier -f setup-database.sql');
    } else if (existingTables.length < expectedTables.length) {
      console.log('\n⚠️  Some tables are missing. Consider running the setup script.');
    } else {
      console.log('\n🎉 All required tables are present!');
      
      // Check if admin user exists
      const adminResult = await client.query(
        "SELECT id, email, role FROM users WHERE email = 'admin@qris-classifier.com'"
      );
      
      if (adminResult.rows.length > 0) {
        console.log('👤 Admin user found:', adminResult.rows[0]);
      } else {
        console.log('⚠️  Admin user not found. It will be created on first app startup.');
      }
    }
    
  } catch (error) {
    console.log('❌ PostgreSQL connection failed!');
    console.log('Error:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting steps:');
    console.log('1. Make sure PostgreSQL is installed and running:');
    console.log('   macOS: brew services start postgresql');
    console.log('   Linux: sudo systemctl start postgresql');
    console.log('   Windows: Start PostgreSQL service');
    console.log('');
    console.log('2. Create the database:');
    console.log('   psql -U postgres -c "CREATE DATABASE qris_classifier;"');
    console.log('');
    console.log('3. Update your .env file with correct credentials');
    console.log('');
    console.log('4. Run the setup script:');
    console.log('   psql -U postgres -d qris_classifier -f setup-database.sql');
    console.log('');
    console.log('💡 The application will work with in-memory storage if PostgreSQL is not available.');
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  checkPostgreSQL().catch(console.error);
}

module.exports = { checkPostgreSQL };