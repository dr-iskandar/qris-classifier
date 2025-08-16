import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { AuthService } from '@/lib/auth';
import { defaultSecurity } from '@/lib/security';
import { Logger } from '@/lib/logger';

const LoginRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

function createErrorResponse(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

function createSuccessResponse(data: any, status: number = 200) {
  return NextResponse.json(data, { status });
}

export async function OPTIONS(request: NextRequest) {
  return defaultSecurity.applyCorsHeaders(request, new NextResponse());
}

export async function POST(request: NextRequest) {
  try {
    // Validate request size
    if (!defaultSecurity.validateRequestSize(request)) {
      Logger.warn('Request size validation failed for login attempt', {
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      });
      return createErrorResponse('Request too large', 413);
    }

    // Validate content type
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return createErrorResponse('Content-Type must be application/json', 400);
    }

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return createErrorResponse('Invalid JSON in request body', 400);
    }

    const validation = LoginRequestSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => err.message).join(', ');
      return createErrorResponse(`Validation failed: ${errors}`, 400);
    }

    const { email, password } = validation.data;

    // Authenticate user with email and password
    const user = await AuthService.authenticateUser(email, password);
    if (!user) {
      Logger.warn('Login attempt with invalid credentials', {
        email,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      });
      return createErrorResponse('Invalid credentials', 401);
    }

    // Check if user has admin role
    if (user.role !== 'admin') {
      Logger.warn('Login attempt by non-admin user', {
        email,
        userId: user.id,
        role: user.role,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      });
      return createErrorResponse('Access denied. Admin privileges required.', 403);
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
    if (!jwtSecret) {
      Logger.error('JWT_SECRET environment variable is not set');
      return createErrorResponse('Server configuration error', 500);
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      jwtSecret,
      {
        expiresIn: '24h',
        issuer: 'qris-classifier',
        audience: 'admin-dashboard',
      }
    );

    Logger.info('Successful admin login', {
      userId: user.id,
      email: user.email,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    });

    return createSuccessResponse({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      expiresIn: '24h',
    });

  } catch (error) {
    Logger.error('Login endpoint error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return createErrorResponse('Internal server error', 500);
  }
}