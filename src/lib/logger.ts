import { NextRequest } from 'next/server';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  userId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  responseTime?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export class Logger {
  private static logs: LogEntry[] = [];
  private static maxLogs = 1000; // Keep last 1000 logs in memory

  private static createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context
    };
  }

  private static addLog(entry: LogEntry): void {
    this.logs.push(entry);
    
    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output for development
    if (process.env.NODE_ENV === 'development') {
      const logMethod = entry.level === LogLevel.ERROR ? console.error :
                       entry.level === LogLevel.WARN ? console.warn :
                       console.log;
      
      logMethod(`[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`, 
                entry.context || '');
    }
  }

  static error(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.ERROR, message, context);
    this.addLog(entry);
  }

  static warn(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.WARN, message, context);
    this.addLog(entry);
  }

  static info(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.INFO, message, context);
    this.addLog(entry);
  }

  static debug(message: string, context?: Record<string, any>): void {
    if (process.env.NODE_ENV === 'development') {
      const entry = this.createLogEntry(LogLevel.DEBUG, message, context);
      this.addLog(entry);
    }
  }

  static logRequest(
    request: NextRequest,
    userId?: string,
    statusCode?: number,
    responseTime?: number,
    error?: Error
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: error ? LogLevel.ERROR : LogLevel.INFO,
      message: error ? `Request failed: ${error.message}` : 'Request processed',
      userId,
      requestId: request.headers.get('x-request-id') || undefined,
      ip: this.getClientIP(request),
      userAgent: request.headers.get('user-agent') || undefined,
      endpoint: new URL(request.url).pathname,
      method: request.method,
      statusCode,
      responseTime,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    };

    this.addLog(entry);
  }

  static logSecurityEvent(
    event: string,
    request: NextRequest,
    details?: Record<string, any>
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.WARN,
      message: `Security event: ${event}`,
      ip: this.getClientIP(request),
      userAgent: request.headers.get('user-agent') || undefined,
      endpoint: new URL(request.url).pathname,
      method: request.method,
      context: {
        securityEvent: event,
        ...details
      }
    };

    this.addLog(entry);
  }

  static getLogs(
    level?: LogLevel,
    limit: number = 100,
    userId?: string
  ): LogEntry[] {
    let filteredLogs = this.logs;

    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }

    if (userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === userId);
    }

    return filteredLogs
      .slice(-limit)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  static getStats(): {
    total: number;
    byLevel: Record<LogLevel, number>;
    recentErrors: LogEntry[];
  } {
    const byLevel = {
      [LogLevel.ERROR]: 0,
      [LogLevel.WARN]: 0,
      [LogLevel.INFO]: 0,
      [LogLevel.DEBUG]: 0
    };

    this.logs.forEach(log => {
      byLevel[log.level]++;
    });

    const recentErrors = this.logs
      .filter(log => log.level === LogLevel.ERROR)
      .slice(-10)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      total: this.logs.length,
      byLevel,
      recentErrors
    };
  }

  static clearLogs(): void {
    this.logs = [];
  }

  private static getClientIP(request: NextRequest): string {
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
}

// Request timing middleware
export class RequestTimer {
  private startTime: number;
  private request: NextRequest;
  private userId?: string;

  constructor(request: NextRequest, userId?: string) {
    this.startTime = Date.now();
    this.request = request;
    this.userId = userId;
  }

  finish(statusCode: number, error?: Error): void {
    const responseTime = Date.now() - this.startTime;
    Logger.logRequest(this.request, this.userId, statusCode, responseTime, error);
  }
}

// Error handling utilities
export class ErrorHandler {
  static handleApiError(error: unknown, context?: Record<string, any>): {
    message: string;
    code: string;
    statusCode: number;
  } {
    if (error instanceof Error) {
      Logger.error(`API Error: ${error.message}`, {
        stack: error.stack,
        ...context
      });

      // Handle specific error types
      if (error.name === 'ValidationError') {
        return {
          message: 'Invalid input data',
          code: 'VALIDATION_ERROR',
          statusCode: 400
        };
      }

      if (error.name === 'UnauthorizedError') {
        return {
          message: 'Authentication required',
          code: 'UNAUTHORIZED',
          statusCode: 401
        };
      }

      if (error.name === 'ForbiddenError') {
        return {
          message: 'Insufficient permissions',
          code: 'FORBIDDEN',
          statusCode: 403
        };
      }

      if (error.name === 'NotFoundError') {
        return {
          message: 'Resource not found',
          code: 'NOT_FOUND',
          statusCode: 404
        };
      }

      // Generic error
      return {
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR',
        statusCode: 500
      };
    }

    // Unknown error type
    Logger.error('Unknown error type', { error, ...context });
    return {
      message: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      statusCode: 500
    };
  }

  static createCustomError(name: string, message: string): Error {
    const error = new Error(message);
    error.name = name;
    return error;
  }
}

// Custom error classes
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message: string = 'Insufficient permissions') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends Error {
  constructor(message: string = 'Rate limit exceeded') {
    super(message);
    this.name = 'RateLimitError';
  }
}