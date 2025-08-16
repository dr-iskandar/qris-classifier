import { NextRequest, NextResponse } from 'next/server';
import { User } from './auth';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory rate limit store (replace with Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();

export class RateLimiter {
  private static getKey(identifier: string, window: string): string {
    return `${identifier}:${window}`;
  }

  private static getCurrentWindow(windowMs: number): string {
    return Math.floor(Date.now() / windowMs).toString();
  }

  static checkRateLimit(
    identifier: string,
    limit: number,
    windowMs: number = 3600000 // 1 hour default
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const window = this.getCurrentWindow(windowMs);
    const key = this.getKey(identifier, window);
    const now = Date.now();
    const resetTime = Math.ceil(now / windowMs) * windowMs;

    let entry = rateLimitStore.get(key);
    
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 0,
        resetTime
      };
    }

    entry.count++;
    rateLimitStore.set(key, entry);

    const allowed = entry.count <= limit;
    const remaining = Math.max(0, limit - entry.count);

    return {
      allowed,
      remaining,
      resetTime
    };
  }

  static createRateLimitResponse(
    remaining: number,
    resetTime: number,
    limit: number
  ): NextResponse {
    const response = NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: `Too many requests. Limit: ${limit} requests per hour.`,
        retryAfter: Math.ceil((resetTime - Date.now()) / 1000)
      },
      { status: 429 }
    );

    response.headers.set('X-RateLimit-Limit', limit.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', Math.ceil(resetTime / 1000).toString());
    response.headers.set('Retry-After', Math.ceil((resetTime - Date.now()) / 1000).toString());

    return response;
  }

  static applyRateLimit(
    request: NextRequest,
    user: User
  ): NextResponse | null {
    const identifier = user.id;
    const limit = user.rateLimit;
    
    const { allowed, remaining, resetTime } = this.checkRateLimit(identifier, limit);

    if (!allowed) {
      return this.createRateLimitResponse(remaining, resetTime, limit);
    }

    return null; // No rate limit exceeded
  }

  // Cleanup old entries (call this periodically)
  static cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  }
}

// Global rate limiter for unauthenticated requests
export class GlobalRateLimiter {
  private static readonly GLOBAL_LIMIT = 10; // requests per hour for unauthenticated
  private static readonly WINDOW_MS = 3600000; // 1 hour

  static checkGlobalRateLimit(ip: string): NextResponse | null {
    const { allowed, remaining, resetTime } = RateLimiter.checkRateLimit(
      `global:${ip}`,
      this.GLOBAL_LIMIT,
      this.WINDOW_MS
    );

    if (!allowed) {
      return RateLimiter.createRateLimitResponse(remaining, resetTime, this.GLOBAL_LIMIT);
    }

    return null;
  }
}

// Cleanup interval (run every hour)
setInterval(() => {
  RateLimiter.cleanup();
}, 3600000);