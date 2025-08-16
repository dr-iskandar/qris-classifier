import { Pool, PoolClient } from 'pg';
import { Logger } from './logger';

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

class Database {
  private pool: Pool | null = null;
  private config: DatabaseConfig;

  constructor() {
    this.config = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'qris_classifier',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      ssl: process.env.NODE_ENV === 'production',
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
    };
  }

  async connect(): Promise<void> {
    if (this.pool) {
      return;
    }

    try {
      this.pool = new Pool(this.config);
      
      // Test the connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      
      Logger.info('Database connected successfully');
      
      // Initialize database schema
      await this.initializeSchema();
      
    } catch (error) {
      Logger.error('Failed to connect to database:', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      Logger.info('Database disconnected');
    }
  }

  async query(text: string, params?: any[]): Promise<any> {
    if (!this.pool) {
      throw new Error('Database not connected');
    }

    try {
      const result = await this.pool.query(text, params);
      return result;
    } catch (error) {
      Logger.error('Database query error:', { query: text, params, error });
      throw error;
    }
  }

  async getClient(): Promise<PoolClient> {
    if (!this.pool) {
      throw new Error('Database not connected');
    }
    return await this.pool.connect();
  }

  private async initializeSchema(): Promise<void> {
    try {
      // Create users table
      await this.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(255) PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL DEFAULT 'user',
          rate_limit INTEGER NOT NULL DEFAULT 100,
          is_active BOOLEAN NOT NULL DEFAULT true,
          api_key VARCHAR(255) UNIQUE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create api_keys table for tracking API key usage
      await this.query(`
        CREATE TABLE IF NOT EXISTS api_keys (
          id VARCHAR(255) PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          key_hash VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          permissions TEXT[] DEFAULT ARRAY['read'],
          rate_limit INTEGER NOT NULL DEFAULT 100,
          is_active BOOLEAN NOT NULL DEFAULT true,
          last_used_at TIMESTAMP WITH TIME ZONE,
          expires_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Create request_logs table for tracking API usage
      await this.query(`
        CREATE TABLE IF NOT EXISTS request_logs (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(255),
          api_key_id VARCHAR(255),
          endpoint VARCHAR(255) NOT NULL,
          method VARCHAR(10) NOT NULL,
          status_code INTEGER NOT NULL,
          response_time_ms INTEGER,
          request_size_bytes INTEGER,
          response_size_bytes INTEGER,
          ip_address INET,
          user_agent TEXT,
          error_message TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
          FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE SET NULL
        )
      `);

      // Create system_logs table for application logs
      await this.query(`
        CREATE TABLE IF NOT EXISTS system_logs (
          id SERIAL PRIMARY KEY,
          level VARCHAR(20) NOT NULL,
          message TEXT NOT NULL,
          metadata JSONB,
          source VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create indexes for better performance
      await this.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
      await this.query('CREATE INDEX IF NOT EXISTS idx_users_api_key ON users(api_key)');
      await this.query('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)');
      await this.query('CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at)');
      
      await this.query('CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id)');
      await this.query('CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash)');
      await this.query('CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active)');
      await this.query('CREATE INDEX IF NOT EXISTS idx_api_keys_created_at ON api_keys(created_at)');
      
      await this.query('CREATE INDEX IF NOT EXISTS idx_request_logs_user_id ON request_logs(user_id)');
      await this.query('CREATE INDEX IF NOT EXISTS idx_request_logs_api_key_id ON request_logs(api_key_id)');
      await this.query('CREATE INDEX IF NOT EXISTS idx_request_logs_endpoint ON request_logs(endpoint)');
      await this.query('CREATE INDEX IF NOT EXISTS idx_request_logs_status_code ON request_logs(status_code)');
      await this.query('CREATE INDEX IF NOT EXISTS idx_request_logs_created_at ON request_logs(created_at)');
      
      await this.query('CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level)');
      await this.query('CREATE INDEX IF NOT EXISTS idx_system_logs_source ON system_logs(source)');
      await this.query('CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at)');

      Logger.info('Database schema initialized successfully');
    } catch (error) {
      Logger.error('Failed to initialize database schema:', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  async healthCheck(): Promise<{ status: string; timestamp: string; details?: any }> {
    try {
      if (!this.pool) {
        return {
          status: 'disconnected',
          timestamp: new Date().toISOString()
        };
      }

      const start = Date.now();
      const result = await this.query('SELECT NOW() as current_time, version() as version');
      const responseTime = Date.now() - start;

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        details: {
          responseTime: `${responseTime}ms`,
          currentTime: result.rows[0].current_time,
          version: result.rows[0].version,
          totalConnections: this.pool.totalCount,
          idleConnections: this.pool.idleCount,
          waitingConnections: this.pool.waitingCount
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }
}

// Singleton instance
const database = new Database();

export { database as Database, type DatabaseConfig };
export default database;