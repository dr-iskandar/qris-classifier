import { NextRequest, NextResponse } from 'next/server';
import { AuthService, authenticateRequest } from '@/lib/auth';
import { SecurityMiddleware } from '@/lib/security';
import { z } from 'zod';

const security = new SecurityMiddleware();

const RegenerateApiKeyRequestSchema = z.object({
  userId: z.string().optional()
});

const CreateApiKeyRequestSchema = z.object({
  email: z.string().email(),
  role: z.enum(['user', 'admin']),
  rateLimit: z.number().min(1).max(10000).default(100)
});

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

// GET /api/api-keys - Get current user's API key info
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    
    if (!authResult) {
      return createErrorResponse(
        'AUTHENTICATION_REQUIRED',
        'Valid authentication token required',
        401
      );
    }

    const { user } = authResult;
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (user.role === 'admin') {
      // Admin can list all users and their API key info
      const allUsers = await AuthService.getAllUsers();
      const keys = allUsers.map(u => ({
        id: u.id,
        name: u.email, // Using email as name for now
        key: u.apiKey,
        level: u.role,
        createdAt: new Date().toISOString(), // TODO: Add actual creation date
        lastUsed: undefined, // TODO: Track last usage
        requestCount: 0 // TODO: Track request count per key
      }));

      return createSuccessResponse({
        keys,
        total: keys.length
      });
    }

    // Return current user's API key info
    return createSuccessResponse({
      apiKey: user.apiKey,
      apiKeyPrefix: user.apiKey.substring(0, 12) + '...',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        rateLimit: user.rateLimit,
        isActive: user.isActive
      }
    });

  } catch (error) {
    console.error('Get API key error:', error);
    return createErrorResponse(
      'INTERNAL_SERVER_ERROR',
      'An unexpected error occurred',
      500
    );
  }
}

// POST /api/api-keys - Create new API key or regenerate existing one
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    
    if (!authResult) {
      return createErrorResponse(
        'AUTHENTICATION_REQUIRED',
        'Valid authentication token required',
        401
      );
    }

    const { user: currentUser } = authResult;

    // Validate content type
    if (!security.validateContentType(request, ['application/json'])) {
      return createErrorResponse(
        'INVALID_CONTENT_TYPE',
        'Content-Type must be application/json',
        415
      );
    }

    let requestData;
    try {
      const rawBody = await request.json();
      
      // Check if this is a create new key request (has email and role)
      if (rawBody.email && rawBody.role) {
        // Only admins can create new API keys
        if (currentUser.role !== 'admin') {
          return createErrorResponse(
            'INSUFFICIENT_PERMISSIONS',
            'Admin access required to create new API keys',
            403
          );
        }
        
        requestData = CreateApiKeyRequestSchema.parse(rawBody);
        
        // Create new user with API key
        const newUser = await AuthService.createUser(
          requestData.email,
          'defaultPassword123', // TODO: Generate random password or use email-based auth
          requestData.role,
          requestData.rateLimit
        );
        
        return createSuccessResponse({
          message: 'API key created successfully',
          apiKey: newUser.apiKey,
          user: {
            id: newUser.id,
            email: newUser.email,
            role: newUser.role
          }
        });
      } else {
        // This is a regenerate request
        requestData = RegenerateApiKeyRequestSchema.parse(rawBody);
      }
    } catch (error) {
      return createErrorResponse(
        'INVALID_REQUEST_BODY',
        'Invalid request format',
        400
      );
    }

    const targetUserId = requestData.userId || currentUser.id;

    // Check permissions for regeneration
    if (currentUser.role !== 'admin' && targetUserId !== currentUser.id) {
      return createErrorResponse(
        'INSUFFICIENT_PERMISSIONS',
        'You can only regenerate your own API key or need admin access',
        403
      );
    }

    const targetUser = await AuthService.getUserById(targetUserId);
    if (!targetUser) {
      return createErrorResponse(
        'USER_NOT_FOUND',
        'Target user not found',
        404
      );
    }

    // Generate new API key
    const newApiKey = AuthService.generateApiKey();
    const updatedUser = await AuthService.updateUser(targetUserId, {
      apiKey: newApiKey
    });

    if (!updatedUser) {
      return createErrorResponse(
        'UPDATE_FAILED',
        'Failed to update API key',
        500
      );
    }

    return createSuccessResponse({
      message: 'API key regenerated successfully',
      apiKey: newApiKey,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role
      }
    });

  } catch (error) {
    console.error('Regenerate API key error:', error);
    return createErrorResponse(
      'INTERNAL_SERVER_ERROR',
      'An unexpected error occurred',
      500
    );
  }
}

// DELETE /api/api-keys - Delete API key (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    
    if (!authResult || authResult.user.role !== 'admin') {
      return createErrorResponse(
        'INSUFFICIENT_PERMISSIONS',
        'Admin access required to delete API keys',
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
      message: 'API key deleted successfully',
      userId
    });

  } catch (error) {
    console.error('Delete API key error:', error);
    return createErrorResponse(
      'INTERNAL_SERVER_ERROR',
      'An unexpected error occurred',
      500
    );
  }
}