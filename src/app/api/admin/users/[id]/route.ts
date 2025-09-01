import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, AuthService } from '@/lib/auth';
import { SecurityMiddleware } from '@/lib/security';
import { Logger } from '@/lib/logger';
import { Database } from '@/lib/database';

const security = new SecurityMiddleware();

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

// DELETE /api/admin/users/[id] - Delete a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    Logger.debug('DELETE /api/admin/users/[id] - Starting request', { userId: params.id });
    
    // Authenticate request
    const authResult = await authenticateRequest(request);
    Logger.debug('Authentication result', { authResult: !!authResult, role: authResult?.user?.role });
    
    if (!authResult || authResult.user.role !== 'admin') {
      Logger.warn('Insufficient permissions for user deletion', { 
        userId: authResult?.user?.id,
        role: authResult?.user?.role 
      });
      return createErrorResponse(
        'INSUFFICIENT_PERMISSIONS',
        'Admin access required',
        403
      );
    }

    const { id } = params;
    Logger.debug('Attempting to delete user', { targetUserId: id });

    // Prevent self-deletion
    if (authResult.user.id === id) {
      Logger.warn('User attempted to delete themselves', { userId: id });
      return createErrorResponse(
        'SELF_DELETE_FORBIDDEN',
        'Cannot delete your own account',
        400
      );
    }

    // Get database instance
    const db = Database;
    Logger.debug('Database instance obtained');

    // Check if user exists
    const existingUser = await AuthService.getUserById(id);
    Logger.debug('User lookup result', { userExists: !!existingUser, userId: id });
    
    if (!existingUser) {
      Logger.warn('User not found for deletion', { userId: id });
      return createErrorResponse(
        'USER_NOT_FOUND',
        'User not found',
        404
      );
    }

    // Delete the user
    Logger.debug('Proceeding with user deletion', { userId: id });
    const success = await AuthService.deleteUser(id);
    Logger.debug('User deletion result', { success, userId: id });

    if (!success) {
      Logger.error('Failed to delete user from database', { userId: id });
      return createErrorResponse(
        'DELETE_FAILED',
        'Failed to delete user',
        500
      );
    }

    Logger.info('User successfully deleted', { 
      deletedUserId: id,
      deletedBy: authResult.user.id 
    });

    return createSuccessResponse({
      message: 'User deleted successfully',
      deletedUserId: id
    });

  } catch (error) {
    Logger.error('Error in DELETE /api/admin/users/[id]', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: params?.id
    });
    
    return createErrorResponse(
      'INTERNAL_ERROR',
      'Internal server error',
      500
    );
  }
}