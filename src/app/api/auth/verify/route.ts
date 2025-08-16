import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { defaultSecurity } from '@/lib/security';
import { Logger } from '@/lib/logger';

function createErrorResponse(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

function createSuccessResponse(data: any, status: number = 200) {
  return NextResponse.json(data, { status });
}

export async function OPTIONS(request: NextRequest) {
  return defaultSecurity.applyCorsHeaders(request, new NextResponse());
}

async function verifyToken(request: NextRequest) {
  try {
    // Validate request size
    if (!defaultSecurity.validateRequestSize(request)) {
      return createErrorResponse('Request too large', 413);
    }

    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createErrorResponse('Missing or invalid authorization header', 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the JWT token
    const payload = AuthService.verifyToken(token);
    if (!payload) {
      return createErrorResponse('Invalid or expired token', 401);
    }

    // Get user details
    const user = await AuthService.getUserById(payload.userId);
    if (!user) {
      return createErrorResponse('User not found', 401);
    }

    // Check if user is still active
    if (!user.isActive) {
      return createErrorResponse('User account is disabled', 401);
    }

    Logger.info('Token verification successful', {
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return createSuccessResponse({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    Logger.error('Token verification error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return createErrorResponse('Internal server error', 500);
  }
}

export async function GET(request: NextRequest) {
  return verifyToken(request);
}

export async function POST(request: NextRequest) {
  return verifyToken(request);
}