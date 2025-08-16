import { NextRequest, NextResponse } from 'next/server';
import { classifyBusinessType, ClassifyBusinessTypeInput } from '@/ai/flows/classify-business-type';
import { authenticateRequest, AuthService } from '@/lib/auth';
import { RateLimiter, GlobalRateLimiter } from '@/lib/rate-limiter';
import { SecurityMiddleware, InputValidator } from '@/lib/security';
import { z } from 'zod';

const security = new SecurityMiddleware();

// Request validation schema
const ClassifyRequestSchema = z.object({
  images: z.object({
    image1: z.string().optional(),
    image2: z.string().optional(),
    image3: z.string().optional(),
    image4: z.string().optional(),
    image5: z.string().optional(),
  }).refine(
    (data) => {
      const imageCount = Object.values(data).filter(Boolean).length;
      return imageCount >= 1 && imageCount <= 5;
    },
    {
      message: "Must provide between 1 and 5 images"
    }
  ),
  metadata: z.object({
    requestId: z.string().optional(),
    clientVersion: z.string().optional(),
    timestamp: z.string().optional(),
  }).optional()
});

type ClassifyRequest = z.infer<typeof ClassifyRequestSchema>;

interface ClassifyResponse {
  success: boolean;
  data?: {
    businessType: string;
    confidence?: number;
    requestId?: string;
    processedAt: string;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  rateLimit?: {
    remaining: number;
    resetTime: number;
    limit: number;
  };
}

// Helper function to get client IP
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

// Helper function to create error response
function createErrorResponse(
  code: string,
  message: string,
  status: number = 400,
  details?: any
): NextResponse {
  const response: ClassifyResponse = {
    success: false,
    error: {
      code,
      message,
      details
    }
  };
  
  return security.applySecurityHeaders(
    NextResponse.json(response, { status })
  );
}

// Helper function to create success response
function createSuccessResponse(
  businessType: string,
  requestId?: string,
  rateLimit?: { remaining: number; resetTime: number; limit: number }
): NextResponse {
  const response: ClassifyResponse = {
    success: true,
    data: {
      businessType,
      requestId,
      processedAt: new Date().toISOString()
    },
    rateLimit
  };
  
  const nextResponse = NextResponse.json(response, { status: 200 });
  
  if (rateLimit) {
    nextResponse.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
    nextResponse.headers.set('X-RateLimit-Reset', Math.ceil(rateLimit.resetTime / 1000).toString());
    nextResponse.headers.set('X-RateLimit-Limit', rateLimit.limit.toString());
  }
  
  return security.applySecurityHeaders(nextResponse);
}

export async function OPTIONS(request: NextRequest) {
  return security.applyCorsHeaders(request, new NextResponse());
}

export async function POST(request: NextRequest) {
  try {
    // Apply CORS headers
    const corsResponse = security.applyCorsHeaders(request, new NextResponse());
    
    // Validate request size
    if (!security.validateRequestSize(request)) {
      return createErrorResponse(
        'REQUEST_TOO_LARGE',
        'Request size exceeds maximum allowed limit',
        413
      );
    }

    // Validate content type
    if (!security.validateContentType(request, ['application/json'])) {
      return createErrorResponse(
        'INVALID_CONTENT_TYPE',
        'Content-Type must be application/json',
        415
      );
    }

    // Get client IP for rate limiting
    const clientIP = getClientIP(request);

    // Authenticate request (fixed async call)
    const authResult = await authenticateRequest(request);
    
    if (!authResult) {
      // Apply global rate limiting for unauthenticated requests
      const globalRateLimit = GlobalRateLimiter.checkGlobalRateLimit(clientIP);
      if (globalRateLimit) {
        return globalRateLimit;
      }
      
      return createErrorResponse(
        'AUTHENTICATION_REQUIRED',
        'Valid authentication token or API key required',
        401
      );
    }

    const { user } = authResult;

    // Apply user-specific rate limiting
    const rateLimitResponse = RateLimiter.applyRateLimit(request, user);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Get current rate limit info
    const rateLimitInfo = RateLimiter.checkRateLimit(user.id, user.rateLimit);

    // Parse and validate request body
    let requestBody: ClassifyRequest;
    try {
      const rawBody = await request.json();
      requestBody = ClassifyRequestSchema.parse(rawBody);
    } catch (error) {
      return createErrorResponse(
        'INVALID_REQUEST_BODY',
        'Invalid request format or missing required fields',
        400,
        error instanceof z.ZodError ? error.errors : undefined
      );
    }

    const { images, metadata } = requestBody;

    // Validate images
    const imageEntries = Object.entries(images).filter(([_, value]) => value);
    
    if (imageEntries.length === 0) {
      return createErrorResponse(
        'NO_IMAGES_PROVIDED',
        'At least one image must be provided'
      );
    }

    if (imageEntries.length > 5) {
      return createErrorResponse(
        'TOO_MANY_IMAGES',
        'Maximum 5 images allowed per request'
      );
    }

    // Validate each image
    for (const [key, imageData] of imageEntries) {
      if (!InputValidator.isValidBase64Image(imageData)) {
        return createErrorResponse(
          'INVALID_IMAGE_FORMAT',
          `Invalid image format for ${key}. Must be a valid base64-encoded image with data URI format.`
        );
      }
    }

    // Validate image sizes
    if (!InputValidator.validateImageSizes(images)) {
      return createErrorResponse(
        'IMAGE_TOO_LARGE',
        'One or more images exceed the maximum size limit (5MB per image)'
      );
    }

    // Prepare input for AI classification - only include defined images
    const classificationInput: ClassifyBusinessTypeInput = {};
    if (images.image1) classificationInput.image1 = images.image1;
    if (images.image2) classificationInput.image2 = images.image2;
    if (images.image3) classificationInput.image3 = images.image3;
    if (images.image4) classificationInput.image4 = images.image4;
    if (images.image5) classificationInput.image5 = images.image5;

    // Perform classification
    const startTime = Date.now();
    const result = await classifyBusinessType(classificationInput);
    const processingTime = Date.now() - startTime;

    // Log successful request (in production, use proper logging service)
    console.log(`Classification completed for user ${user.id} in ${processingTime}ms`);

    return createSuccessResponse(
      result.businessType,
      metadata?.requestId,
      {
        remaining: rateLimitInfo.remaining - 1,
        resetTime: rateLimitInfo.resetTime,
        limit: user.rateLimit
      }
    );

  } catch (error) {
    console.error('Classification error:', error);
    
    return createErrorResponse(
      'INTERNAL_SERVER_ERROR',
      'An unexpected error occurred during classification',
      500
    );
  }
}

// Health check endpoint
export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  
  if (!authResult) {
    return createErrorResponse(
      'AUTHENTICATION_REQUIRED',
      'Valid authentication token or API key required',
      401
    );
  }

  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    user: {
      id: authResult.user.id,
      email: authResult.user.email,
      rateLimit: authResult.user.rateLimit
    }
  };

  return security.applySecurityHeaders(
    NextResponse.json(healthData, { status: 200 })
  );
}