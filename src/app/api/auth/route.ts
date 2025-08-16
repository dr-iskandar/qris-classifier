import { NextRequest, NextResponse } from 'next/server';
import { AuthService, authenticateRequest } from '@/lib/auth';
import { SecurityMiddleware, InputValidator } from '@/lib/security';
import { GlobalRateLimiter } from '@/lib/rate-limiter';
import { z } from 'zod';

const security = new SecurityMiddleware();

// Request schemas
const LoginRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

const CreateUserRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
  role: z.enum(['admin', 'user']).default('user'),
  rateLimit: z.number().min(1).max(10000).default(100)
});

const UpdateUserRequestSchema = z.object({
  userId: z.string(),
  email: z.string().email().optional(),
  role: z.enum(['admin', 'user']).optional(),
  rateLimit: z.number().min(1).max(10000).optional(),
  isActive: z.boolean().optional()
});

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

function createErrorResponse(code: string, message: string, status: number = 400): NextResponse {
  const response = {
    success: false,
    error: {
      code,
      message,
      timestamp: new Date().toISOString()
    }
  };
  
  return security.applySecurityHeaders(
    NextResponse.json(response, { status })
  );
}

function createSuccessResponse(data: any, status: number = 200): NextResponse {
  const response = {
    success: true,
    data,
    timestamp: new Date().toISOString()
  };
  
  return security.applySecurityHeaders(
    NextResponse.json(response, { status })
  );
}

export async function OPTIONS(request: NextRequest) {
  return security.applyCorsHeaders(request, new NextResponse());
}

// POST /api/auth - Login or create user
export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    
    // Apply global rate limiting
    const globalRateLimit = GlobalRateLimiter.checkGlobalRateLimit(clientIP);
    if (globalRateLimit) {
      return globalRateLimit;
    }

    // Validate content type
    if (!security.validateContentType(request, ['application/json'])) {
      return createErrorResponse(
        'INVALID_CONTENT_TYPE',
        'Content-Type must be application/json',
        415
      );
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'login';

    if (action === 'login') {
      // Handle login
      let loginData;
      try {
        const rawBody = await request.json();
        loginData = LoginRequestSchema.parse(rawBody);
      } catch (error) {
        return createErrorResponse(
          'INVALID_REQUEST_BODY',
          'Invalid login request format',
          400
        );
      }

      const user = await AuthService.authenticateUser(loginData.email, loginData.password);
      if (!user || !user.isActive) {
        return createErrorResponse(
          'INVALID_CREDENTIALS',
          'Invalid email or password',
          401
        );
      }

      const token = AuthService.generateToken(user);

      return createSuccessResponse({
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          rateLimit: user.rateLimit
        }
      });
    }

    if (action === 'create-user') {
      // Handle user creation (admin only)
      const authResult = await authenticateRequest(request);
      
      if (!authResult || authResult.user.role !== 'admin') {
        return createErrorResponse(
          'INSUFFICIENT_PERMISSIONS',
          'Admin access required to create users',
          403
        );
      }

      let createUserData;
      try {
        const rawBody = await request.json();
        createUserData = CreateUserRequestSchema.parse(rawBody);
      } catch (error) {
        return createErrorResponse(
          'INVALID_REQUEST_BODY',
          'Invalid create user request format',
          400
        );
      }

      // Check if user already exists
      const existingUser = await AuthService.getUserByEmail(createUserData.email);
      if (existingUser) {
        return createErrorResponse(
          'USER_ALREADY_EXISTS',
          'User with this email already exists',
          409
        );
      }

      const newUser = await AuthService.createUser(
        createUserData.email,
        'defaultPassword123', // Default password for API key users
        createUserData.role,
        createUserData.rateLimit
      );

      return createSuccessResponse({
        user: {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
          rateLimit: newUser.rateLimit,
          apiKey: newUser.apiKey
        }
      }, 201);
    }

    return createErrorResponse(
      'INVALID_ACTION',
      'Invalid action parameter. Use "login" or "create-user"',
      400
    );

  } catch (error) {
    console.error('Auth error:', error);
    return createErrorResponse(
      'INTERNAL_SERVER_ERROR',
      'An unexpected error occurred',
      500
    );
  }
}

// GET /api/auth - Get current user info
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    
    if (!authResult) {
      return createErrorResponse(
        'AUTHENTICATION_REQUIRED',
        'Valid authentication token or API key required',
        401
      );
    }

    const { user } = authResult;

    return createSuccessResponse({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        rateLimit: user.rateLimit,
        isActive: user.isActive
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    return createErrorResponse(
      'INTERNAL_SERVER_ERROR',
      'An unexpected error occurred',
      500
    );
  }
}

// PUT /api/auth - Update user
export async function PUT(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    
    if (!authResult) {
      return createErrorResponse(
        'AUTHENTICATION_REQUIRED',
        'Valid authentication token or API key required',
        401
      );
    }

    const { user: currentUser } = authResult;

    let updateData;
    try {
      const rawBody = await request.json();
      updateData = UpdateUserRequestSchema.parse(rawBody);
    } catch (error) {
      return createErrorResponse(
        'INVALID_REQUEST_BODY',
        'Invalid update request format',
        400
      );
    }

    // Check permissions
    if (currentUser.role !== 'admin' && updateData.userId !== currentUser.id) {
      return createErrorResponse(
        'INSUFFICIENT_PERMISSIONS',
        'You can only update your own profile or need admin access',
        403
      );
    }

    // Admin-only fields
    if (currentUser.role !== 'admin' && (updateData.role || updateData.rateLimit !== undefined)) {
      return createErrorResponse(
        'INSUFFICIENT_PERMISSIONS',
        'Admin access required to modify role or rate limit',
        403
      );
    }

    const updatedUser = await AuthService.updateUser(updateData.userId, {
      email: updateData.email,
      role: updateData.role,
      rateLimit: updateData.rateLimit,
      isActive: updateData.isActive
    });

    if (!updatedUser) {
      return createErrorResponse(
        'USER_NOT_FOUND',
        'User not found',
        404
      );
    }

    return createSuccessResponse({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        rateLimit: updatedUser.rateLimit,
        isActive: updatedUser.isActive
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    return createErrorResponse(
      'INTERNAL_SERVER_ERROR',
      'An unexpected error occurred',
      500
    );
  }
}

// DELETE /api/auth - Delete user (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    
    if (!authResult || authResult.user.role !== 'admin') {
      return createErrorResponse(
        'INSUFFICIENT_PERMISSIONS',
        'Admin access required to delete users',
        403
      );
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return createErrorResponse(
        'MISSING_USER_ID',
        'User ID parameter is required',
        400
      );
    }

    const deleted = await AuthService.deleteUser(userId);
    
    if (!deleted) {
      return createErrorResponse(
        'USER_NOT_FOUND',
        'User not found',
        404
      );
    }

    return createSuccessResponse({
      message: 'User deleted successfully',
      userId
    });

  } catch (error) {
    console.error('Delete user error:', error);
    return createErrorResponse(
      'INTERNAL_SERVER_ERROR',
      'An unexpected error occurred',
      500
    );
  }
}