import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import { Database } from './database';
import { Logger } from './logger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export interface User {
  id: string;
  email: string;
  apiKey: string;
  role: 'admin' | 'user';
  rateLimit: number; // requests per hour
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// In-memory fallback for when database is not available
const fallbackUsers: Map<string, User> = new Map();
const fallbackApiKeys: Map<string, string> = new Map(); // apiKey -> userId
let databaseConnected = false;

// Default admin user
const defaultAdmin: User = {
  id: 'admin-001',
  email: 'admin@qris-classifier.com',
  apiKey: 'qris_admin_' + Math.random().toString(36).substring(2, 15),
  role: 'admin',
  rateLimit: 1000,
  isActive: true
};

export class AuthService {
  static async initialize(): Promise<void> {
    try {
      await Database.connect();
      databaseConnected = true;
      
      // Ensure default admin exists in database
      await this.ensureDefaultAdmin();
      
      Logger.info('AuthService initialized with database connection');
    } catch (error) {
      Logger.warn('Database connection failed, using in-memory fallback', { error: error instanceof Error ? error.message : String(error) });
      databaseConnected = false;
      
      // Initialize fallback storage
      fallbackUsers.set(defaultAdmin.id, defaultAdmin);
      fallbackApiKeys.set(defaultAdmin.apiKey, defaultAdmin.id);
    }
  }

  private static async ensureDefaultAdmin(): Promise<void> {
    try {
      // Check if admin already exists
      const result = await Database.query(
        'SELECT id FROM users WHERE email = $1',
        [defaultAdmin.email]
      );
      
      if (result.rows.length === 0) {
        const hashedPassword = await this.hashPassword('admin123'); // Default password
        await Database.query(
          `INSERT INTO users (id, email, password_hash, role, rate_limit, is_active, api_key, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [defaultAdmin.id, defaultAdmin.email, hashedPassword, defaultAdmin.role, defaultAdmin.rateLimit, defaultAdmin.isActive, defaultAdmin.apiKey]
        );
        Logger.info('Default admin user created in database');
      } else {
        Logger.info('Default admin user already exists in database');
      }
    } catch (error) {
      Logger.error('Failed to ensure default admin exists', { error: error instanceof Error ? error.message : String(error) });
      throw error; // Re-throw to trigger fallback mode
    }
  }

  static generateToken(user: User): string {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };
    
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
  }

  static verifyToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
      return null;
    }
  }

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateApiKey(): string {
    return 'qris_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  static async createUser(email: string, password: string, role: 'admin' | 'user' = 'user', rateLimit: number = 100): Promise<User> {
    const user: User = {
      id: 'user_' + Math.random().toString(36).substring(2, 15),
      email,
      apiKey: this.generateApiKey(),
      role,
      rateLimit,
      isActive: true
    };

    if (databaseConnected) {
      try {
        const hashedPassword = await this.hashPassword(password);
        await Database.query(
          `INSERT INTO users (id, email, password_hash, role, rate_limit, is_active, api_key, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [user.id, user.email, hashedPassword, user.role, user.rateLimit, user.isActive, user.apiKey]
        );
      } catch (error) {
        Logger.error('Failed to create user in database', { error: error instanceof Error ? error.message : String(error) });
        throw error;
      }
    } else {
      fallbackUsers.set(user.id, user);
      fallbackApiKeys.set(user.apiKey, user.id);
    }

    return user;
  }

  static async getUserById(id: string): Promise<User | undefined> {
    // Try database first
    try {
      const result = await Database.query(
        'SELECT id, email, role, rate_limit, is_active, api_key, created_at, updated_at FROM users WHERE id = $1',
        [id]
      );
      
      if (result.rows.length > 0) {
        const row = result.rows[0];
        const user = {
          id: row.id,
          email: row.email,
          apiKey: row.api_key,
          role: row.role,
          rateLimit: row.rate_limit,
          isActive: row.is_active,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        };
        return user;
      }
    } catch (error) {
      Logger.error('Failed to get user by ID from database', { error: error instanceof Error ? error.message : String(error) });
    }
    
    // Fallback to in-memory storage
    let fallbackUser = fallbackUsers.get(id);
    
    // If not found and this is the default admin, ensure it's in fallback storage
    if (!fallbackUser && id === defaultAdmin.id) {
      fallbackUsers.set(defaultAdmin.id, defaultAdmin);
      fallbackApiKeys.set(defaultAdmin.apiKey, defaultAdmin.id);
      fallbackUser = defaultAdmin;
    }
    
    return fallbackUser;
  }

  static async getUserByApiKey(apiKey: string): Promise<User | undefined> {
    if (databaseConnected) {
      try {
        const result = await Database.query(
          'SELECT id, email, role, rate_limit, is_active, api_key, created_at, updated_at FROM users WHERE api_key = $1',
          [apiKey]
        );
        
        if (result.rows.length > 0) {
          const row = result.rows[0];
          return {
            id: row.id,
            email: row.email,
            apiKey: row.api_key,
            role: row.role,
            rateLimit: row.rate_limit,
            isActive: row.is_active,
            createdAt: row.created_at,
            updatedAt: row.updated_at
          };
        }
      } catch (error) {
        Logger.error('Failed to get user by API key from database', { error: error instanceof Error ? error.message : String(error) });
      }
    }
    
    const userId = fallbackApiKeys.get(apiKey);
    return userId ? fallbackUsers.get(userId) : undefined;
  }

  static async getUserByEmail(email: string): Promise<User | undefined> {
    if (databaseConnected) {
      try {
        const result = await Database.query(
          'SELECT id, email, role, rate_limit, is_active, api_key, created_at, updated_at FROM users WHERE email = $1',
          [email]
        );
        
        if (result.rows.length > 0) {
          const row = result.rows[0];
          return {
            id: row.id,
            email: row.email,
            apiKey: row.api_key,
            role: row.role,
            rateLimit: row.rate_limit,
            isActive: row.is_active,
            createdAt: row.created_at,
            updatedAt: row.updated_at
          };
        }
      } catch (error) {
        Logger.error('Failed to get user by email from database', { error: error instanceof Error ? error.message : String(error) });
      }
    }
    
    for (const user of fallbackUsers.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return undefined;
  }

  static async getAllUsers(): Promise<User[]> {
    if (databaseConnected) {
      try {
        const result = await Database.query(
          'SELECT id, email, role, rate_limit, is_active, api_key, created_at, updated_at FROM users ORDER BY created_at DESC'
        );
        
        return result.rows.map((row: any) => ({
          id: row.id,
          email: row.email,
          apiKey: row.api_key,
          role: row.role,
          rateLimit: row.rate_limit,
          isActive: row.is_active,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }));
      } catch (error) {
        Logger.error('Failed to get all users from database', { error: error instanceof Error ? error.message : String(error) });
      }
    }
    
    return Array.from(fallbackUsers.values());
  }

  static async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    if (databaseConnected) {
      try {
        const setParts: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (updates.email !== undefined) {
          setParts.push(`email = $${paramIndex++}`);
          values.push(updates.email);
        }
        if (updates.role !== undefined) {
          setParts.push(`role = $${paramIndex++}`);
          values.push(updates.role);
        }
        if (updates.rateLimit !== undefined) {
          setParts.push(`rate_limit = $${paramIndex++}`);
          values.push(updates.rateLimit);
        }
        if (updates.isActive !== undefined) {
          setParts.push(`is_active = $${paramIndex++}`);
          values.push(updates.isActive);
        }
        if (updates.apiKey !== undefined) {
          setParts.push(`api_key = $${paramIndex++}`);
          values.push(updates.apiKey);
        }

        if (setParts.length > 0) {
          setParts.push(`updated_at = CURRENT_TIMESTAMP`);
          values.push(id);

          const result = await Database.query(
            `UPDATE users SET ${setParts.join(', ')} WHERE id = $${paramIndex} RETURNING id, email, role, rate_limit, is_active, api_key, created_at, updated_at`,
            values
          );

          if (result.rows.length > 0) {
            const row = result.rows[0];
            return {
              id: row.id,
              email: row.email,
              apiKey: row.api_key,
              role: row.role,
              rateLimit: row.rate_limit,
              isActive: row.is_active,
              createdAt: row.created_at,
              updatedAt: row.updated_at
            };
          }
        }
      } catch (error) {
        Logger.error('Failed to update user in database', { error: error instanceof Error ? error.message : String(error) });
      }
    }
    
    // Fallback to in-memory
    const user = fallbackUsers.get(id);
    if (!user) return null;

    const updatedUser = { ...user, ...updates };
    fallbackUsers.set(id, updatedUser);
    
    // Update API key mapping if changed
    if (updates.apiKey && updates.apiKey !== user.apiKey) {
      fallbackApiKeys.delete(user.apiKey);
      fallbackApiKeys.set(updates.apiKey, id);
    }

    return updatedUser;
  }

  static async deleteUser(id: string): Promise<boolean> {
    Logger.info('Attempting to delete user', { userId: id });
    
    if (databaseConnected) {
      try {
        const result = await Database.query('DELETE FROM users WHERE id = $1', [id]);
        const deleted = result.rowCount > 0;
        Logger.info('Database delete result', { userId: id, deleted, rowCount: result.rowCount });
        return deleted;
      } catch (error) {
        Logger.error('Failed to delete user from database', { 
          userId: id, 
          error: error instanceof Error ? error.message : String(error) 
        });
        return false;
      }
    }
    
    // Fallback to in-memory
    const user = fallbackUsers.get(id);
    if (!user) {
      Logger.warn('User not found in fallback storage', { userId: id });
      return false;
    }

    fallbackUsers.delete(id);
    fallbackApiKeys.delete(user.apiKey);
    Logger.info('User deleted from fallback storage', { userId: id });
    return true;
  }

  static async authenticateUser(email: string, password: string): Promise<User | null> {
    // Wait for database connection if not ready
    if (!databaseConnected) {
      try {
        await this.initialize();
      } catch (error) {
        Logger.warn('Failed to initialize database connection for authentication', { email });
      }
    }
    
    if (databaseConnected) {
      try {
        const result = await Database.query(
          'SELECT id, email, password_hash, role, rate_limit, is_active, api_key, created_at, updated_at FROM users WHERE email = $1',
          [email]
        );
        
        if (result.rows.length > 0) {
          const row = result.rows[0];
          const isValidPassword = await this.comparePassword(password, row.password_hash);
          
          if (isValidPassword && row.is_active) {
            return {
              id: row.id,
              email: row.email,
              apiKey: row.api_key,
              role: row.role,
              rateLimit: row.rate_limit,
              isActive: row.is_active,
              createdAt: row.created_at,
              updatedAt: row.updated_at
            };
          }
        }
      } catch (error) {
        Logger.error('Failed to authenticate user', { error: error instanceof Error ? error.message : String(error) });
      }
    } else {
        // Check fallback users if database is not available
        const fallbackUser = fallbackUsers.get('admin-001');
        if (fallbackUser && fallbackUser.email === email && password === 'admin123') {
          return fallbackUser;
        }
      }
    
    return null;
  }
}

export function extractTokenFromRequest(request: NextRequest): string | null {
  // Check Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check API key header
  const apiKey = request.headers.get('x-api-key');
  if (apiKey) {
    return apiKey;
  }

  return null;
}

export async function authenticateRequest(request: NextRequest): Promise<{ user: User; authType: 'jwt' | 'apikey' } | null> {
  const token = extractTokenFromRequest(request);
  if (!token) return null;

  // Try JWT first
  const jwtPayload = AuthService.verifyToken(token);
  if (jwtPayload) {
    const user = await AuthService.getUserById(jwtPayload.userId);
    if (user && user.isActive) {
      return { user, authType: 'jwt' };
    }
  }

  // Try API key
  const user = await AuthService.getUserByApiKey(token);
  if (user && user.isActive) {
    return { user, authType: 'apikey' };
  }

  return null;
}

// Initialize the auth service
AuthService.initialize().then(() => {
  console.log('Default admin API key:', defaultAdmin.apiKey);
}).catch((error) => {
  console.error('Failed to initialize AuthService:', error);
  console.log('Using fallback admin API key:', defaultAdmin.apiKey);
});