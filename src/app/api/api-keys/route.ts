import { NextRequest, NextResponse } from 'next/server';
import { AuthService, authenticateRequest } from '@/lib/auth';
import { SecurityMiddleware } from '@/lib/security';
import { z } from 'zod';

const security = new SecurityMiddleware();

const RegenerateApiKeyRequestSchema = z.object({
  userId: z.string().optional()
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
    const authResult = authenticateRequest(request);
    
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

    if (action === 'list' && user.role === 'admin') {
      // Admin can list all users and their API key info
      const allUsers = AuthService.getAllUsers();
      const userList = allUsers.map(u => ({
        id: u.id,
        email: u.email,
        role: u.role,
        rateLimit: u.rateLimit,
        isActive: u.isActive,
        apiKeyPrefix: u.apiKey.substring(0, 12) + '...'
      }));

      return createSuccessResponse({
        users: userList,
        total: userList.length
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

// POST /api/api-keys - Regenerate API key
export async function POST(request: NextRequest) {
  try {
    const authResult = authenticateRequest(request);
    
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
      requestData = RegenerateApiKeyRequestSchema.parse(rawBody);
    } catch (error) {
      return createErrorResponse(
        'INVALID_REQUEST_BODY',
        'Invalid request format',
        400
      );
    }

    const targetUserId = requestData.userId || currentUser.id;

    // Check permissions
    if (currentUser.role !== 'admin' && targetUserId !== currentUser.id) {
      return createErrorResponse(
        'INSUFFICIENT_PERMISSIONS',
        'You can only regenerate your own API key or need admin access',
        403
      );
    }

    const targetUser = AuthService.getUserById(targetUserId);
    if (!targetUser) {
      return createErrorResponse(
        'USER_NOT_FOUND',
        'Target user not found',
        404
      );
    }

    // Generate new API key
    const newApiKey = AuthService.generateApiKey();
    const updatedUser = AuthService.updateUser(targetUserId, {
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