import { NextRequest, NextResponse } from 'next/server';

export interface SecurityConfig {
  corsOrigins?: string[];
  allowCredentials?: boolean;
  maxRequestSize?: number;
  enableCSP?: boolean;
}

const defaultConfig: SecurityConfig = {
  corsOrigins: ['http://localhost:3000', 'http://localhost:9002'],
  allowCredentials: true,
  maxRequestSize: 30 * 1024 * 1024, // 30MB
  enableCSP: true
};

export class SecurityMiddleware {
  private config: SecurityConfig;

  constructor(config: SecurityConfig = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  applyCorsHeaders(request: NextRequest, response: NextResponse): NextResponse {
    const origin = request.headers.get('origin');
    const { corsOrigins, allowCredentials } = this.config;

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      const preflightResponse = new NextResponse(null, { status: 200 });
      
      if (origin && corsOrigins?.includes(origin)) {
        preflightResponse.headers.set('Access-Control-Allow-Origin', origin);
      } else if (corsOrigins?.includes('*')) {
        preflightResponse.headers.set('Access-Control-Allow-Origin', '*');
      }

      preflightResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      preflightResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
      
      if (allowCredentials) {
        preflightResponse.headers.set('Access-Control-Allow-Credentials', 'true');
      }

      preflightResponse.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
      
      return preflightResponse;
    }

    // Handle actual requests
    if (origin && corsOrigins?.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    } else if (corsOrigins?.includes('*')) {
      response.headers.set('Access-Control-Allow-Origin', '*');
    }

    if (allowCredentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    return response;
  }

  applySecurityHeaders(response: NextResponse): NextResponse {
    // Prevent XSS attacks
    response.headers.set('X-XSS-Protection', '1; mode=block');
    
    // Prevent MIME type sniffing
    response.headers.set('X-Content-Type-Options', 'nosniff');
    
    // Prevent clickjacking
    response.headers.set('X-Frame-Options', 'DENY');
    
    // Force HTTPS in production
    if (process.env.NODE_ENV === 'production') {
      response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    
    // Referrer policy
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Permissions policy
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    // Content Security Policy
    if (this.config.enableCSP) {
      const csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "font-src 'self'",
        "connect-src 'self'",
        "media-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'"
      ].join('; ');
      
      response.headers.set('Content-Security-Policy', csp);
    }

    return response;
  }

  validateRequestSize(request: NextRequest): boolean {
    const contentLength = request.headers.get('content-length');
    if (contentLength) {
      const size = parseInt(contentLength, 10);
      return size <= (this.config.maxRequestSize || defaultConfig.maxRequestSize!);
    }
    return true;
  }

  validateContentType(request: NextRequest, allowedTypes: string[]): boolean {
    const contentType = request.headers.get('content-type');
    if (!contentType) return false;
    
    return allowedTypes.some(type => contentType.includes(type));
  }

  createErrorResponse(message: string, status: number = 400): NextResponse {
    const response = NextResponse.json(
      {
        error: 'Security Error',
        message,
        timestamp: new Date().toISOString()
      },
      { status }
    );

    return this.applySecurityHeaders(response);
  }
}

// Input validation utilities
export class InputValidator {
  static isValidBase64Image(data: string): boolean {
    // Check if it's a valid data URI with image MIME type
    const dataUriRegex = /^data:image\/(jpeg|jpg|png|gif|webp);base64,([A-Za-z0-9+/=]+)$/;
    return dataUriRegex.test(data);
  }

  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static sanitizeString(input: string, maxLength: number = 1000): string {
    return input.trim().substring(0, maxLength);
  }

  static validateImageCount(images: Record<string, string>): boolean {
    const imageKeys = Object.keys(images).filter(key => key.startsWith('image'));
    return imageKeys.length >= 1 && imageKeys.length <= 5;
  }

  static validateImageSizes(images: Record<string, string>, maxSizePerImage: number = 5 * 1024 * 1024): boolean {
    for (const [key, value] of Object.entries(images)) {
      if (key.startsWith('image') && value) {
        // Estimate base64 size (base64 is ~33% larger than original)
        const estimatedSize = (value.length * 3) / 4;
        if (estimatedSize > maxSizePerImage) {
          return false;
        }
      }
    }
    return true;
  }
}

// Create default security middleware instance
export const defaultSecurity = new SecurityMiddleware();