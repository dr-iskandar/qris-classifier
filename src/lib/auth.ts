import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export interface User {
  id: string;
  email: string;
  apiKey: string;
  role: 'admin' | 'user';
  rateLimit: number; // requests per hour
  isActive: boolean;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// In-memory user store (replace with database in production)
const users: Map<string, User> = new Map();
const apiKeys: Map<string, string> = new Map(); // apiKey -> userId

// Default admin user
const defaultAdmin: User = {
  id: 'admin-001',
  email: 'admin@qris-classifier.com',
  apiKey: 'qris_admin_' + Math.random().toString(36).substring(2, 15),
  role: 'admin',
  rateLimit: 1000,
  isActive: true
};

users.set(defaultAdmin.id, defaultAdmin);
apiKeys.set(defaultAdmin.apiKey, defaultAdmin.id);

export class AuthService {
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

  static createUser(email: string, role: 'admin' | 'user' = 'user', rateLimit: number = 100): User {
    const user: User = {
      id: 'user_' + Math.random().toString(36).substring(2, 15),
      email,
      apiKey: this.generateApiKey(),
      role,
      rateLimit,
      isActive: true
    };

    users.set(user.id, user);
    apiKeys.set(user.apiKey, user.id);
    return user;
  }

  static getUserById(id: string): User | undefined {
    return users.get(id);
  }

  static getUserByApiKey(apiKey: string): User | undefined {
    const userId = apiKeys.get(apiKey);
    return userId ? users.get(userId) : undefined;
  }

  static getUserByEmail(email: string): User | undefined {
    for (const user of users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return undefined;
  }

  static getAllUsers(): User[] {
    return Array.from(users.values());
  }

  static updateUser(id: string, updates: Partial<User>): User | null {
    const user = users.get(id);
    if (!user) return null;

    const updatedUser = { ...user, ...updates };
    users.set(id, updatedUser);
    
    // Update API key mapping if changed
    if (updates.apiKey && updates.apiKey !== user.apiKey) {
      apiKeys.delete(user.apiKey);
      apiKeys.set(updates.apiKey, id);
    }

    return updatedUser;
  }

  static deleteUser(id: string): boolean {
    const user = users.get(id);
    if (!user) return false;

    users.delete(id);
    apiKeys.delete(user.apiKey);
    return true;
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

export function authenticateRequest(request: NextRequest): { user: User; authType: 'jwt' | 'apikey' } | null {
  const token = extractTokenFromRequest(request);
  if (!token) return null;

  // Try JWT first
  const jwtPayload = AuthService.verifyToken(token);
  if (jwtPayload) {
    const user = AuthService.getUserById(jwtPayload.userId);
    if (user && user.isActive) {
      return { user, authType: 'jwt' };
    }
  }

  // Try API key
  const user = AuthService.getUserByApiKey(token);
  if (user && user.isActive) {
    return { user, authType: 'apikey' };
  }

  return null;
}

// Initialize with default admin
console.log('Default admin API key:', defaultAdmin.apiKey);