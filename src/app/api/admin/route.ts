import { NextRequest, NextResponse } from 'next/server';
import { AuthService, authenticateRequest } from '@/lib/auth';
import { SecurityMiddleware } from '@/lib/security';
import { Logger, LogLevel } from '@/lib/logger';
import { RateLimiter } from '@/lib/rate-limiter';

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

// GET /api/admin - Admin dashboard data
export async function GET(request: NextRequest) {
  try {
    const authResult = authenticateRequest(request);
    
    if (!authResult || authResult.user.role !== 'admin') {
      return createErrorResponse(
        'INSUFFICIENT_PERMISSIONS',
        'Admin access required',
        403
      );
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'dashboard';

    switch (action) {
      case 'dashboard':
        return getDashboardData();
      
      case 'users':
        return getUsersData();
      
      case 'logs':
        const level = url.searchParams.get('level') as LogLevel || undefined;
        const limit = parseInt(url.searchParams.get('limit') || '100');
        return getLogsData(level, limit);
      
      case 'stats':
        return getStatsData();
      
      case 'health':
        return getHealthData();
      
      default:
        return createErrorResponse(
          'INVALID_ACTION',
          'Invalid action parameter',
          400
        );
    }

  } catch (error) {
    console.error('Admin API error:', error);
    return createErrorResponse(
      'INTERNAL_SERVER_ERROR',
      'An unexpected error occurred',
      500
    );
  }
}

function getDashboardData(): NextResponse {
  const users = AuthService.getAllUsers();
  const logStats = Logger.getStats();
  
  const dashboardData = {
    overview: {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.isActive).length,
      adminUsers: users.filter(u => u.role === 'admin').length,
      totalRequests: logStats.total,
      errorRate: logStats.byLevel.error / Math.max(logStats.total, 1),
      uptime: process.uptime()
    },
    recentActivity: {
      recentErrors: logStats.recentErrors.slice(0, 5),
      recentLogs: Logger.getLogs(undefined, 10)
    },
    systemInfo: {
      nodeVersion: process.version,
      platform: process.platform,
      memoryUsage: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development'
    }
  };

  return createSuccessResponse(dashboardData);
}

function getUsersData(): NextResponse {
  const users = AuthService.getAllUsers();
  
  const usersData = users.map(user => ({
    id: user.id,
    email: user.email,
    role: user.role,
    rateLimit: user.rateLimit,
    isActive: user.isActive,
    apiKeyPrefix: user.apiKey.substring(0, 12) + '...',
    recentActivity: Logger.getLogs(undefined, 5, user.id)
  }));

  return createSuccessResponse({
    users: usersData,
    total: usersData.length,
    summary: {
      active: users.filter(u => u.isActive).length,
      inactive: users.filter(u => !u.isActive).length,
      admins: users.filter(u => u.role === 'admin').length,
      regularUsers: users.filter(u => u.role === 'user').length
    }
  });
}

function getLogsData(level?: LogLevel, limit: number = 100): NextResponse {
  const logs = Logger.getLogs(level, limit);
  const stats = Logger.getStats();
  
  return createSuccessResponse({
    logs,
    stats,
    filters: {
      level,
      limit
    }
  });
}

function getStatsData(): NextResponse {
  const users = AuthService.getAllUsers();
  const logStats = Logger.getStats();
  
  // Calculate request statistics
  const allLogs = Logger.getLogs(undefined, 1000);
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  const recentLogs = allLogs.filter(log => new Date(log.timestamp) > oneHourAgo);
  const dailyLogs = allLogs.filter(log => new Date(log.timestamp) > oneDayAgo);
  
  const stats = {
    users: {
      total: users.length,
      active: users.filter(u => u.isActive).length,
      byRole: {
        admin: users.filter(u => u.role === 'admin').length,
        user: users.filter(u => u.role === 'user').length
      }
    },
    requests: {
      total: logStats.total,
      lastHour: recentLogs.length,
      lastDay: dailyLogs.length,
      byLevel: logStats.byLevel,
      errorRate: {
        overall: logStats.byLevel.error / Math.max(logStats.total, 1),
        lastHour: recentLogs.filter(l => l.level === LogLevel.ERROR).length / Math.max(recentLogs.length, 1),
        lastDay: dailyLogs.filter(l => l.level === LogLevel.ERROR).length / Math.max(dailyLogs.length, 1)
      }
    },
    system: {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      nodeVersion: process.version,
      platform: process.platform
    },
    security: {
      recentSecurityEvents: allLogs
        .filter(log => log.context?.securityEvent)
        .slice(-10),
      rateLimitHits: allLogs
        .filter(log => log.message.includes('Rate limit'))
        .length
    }
  };
  
  return createSuccessResponse(stats);
}

function getHealthData(): NextResponse {
  const memUsage = process.memoryUsage();
  const uptime = process.uptime();
  const logStats = Logger.getStats();
  
  // Health checks
  const checks = {
    memory: {
      status: memUsage.heapUsed < 500 * 1024 * 1024 ? 'healthy' : 'warning', // 500MB threshold
      details: memUsage
    },
    uptime: {
      status: uptime > 60 ? 'healthy' : 'warning', // 1 minute threshold
      details: { uptime, uptimeFormatted: formatUptime(uptime) }
    },
    errorRate: {
      status: (logStats.byLevel.error / Math.max(logStats.total, 1)) < 0.1 ? 'healthy' : 'warning',
      details: {
        errorCount: logStats.byLevel.error,
        totalRequests: logStats.total,
        errorRate: logStats.byLevel.error / Math.max(logStats.total, 1)
      }
    },
    database: {
      status: 'healthy', // In-memory storage is always available
      details: {
        type: 'in-memory',
        userCount: AuthService.getAllUsers().length
      }
    }
  };
  
  const overallStatus = Object.values(checks).every(check => check.status === 'healthy') 
    ? 'healthy' 
    : 'warning';
  
  return createSuccessResponse({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    checks,
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

// POST /api/admin - Admin actions
export async function POST(request: NextRequest) {
  try {
    const authResult = authenticateRequest(request);
    
    if (!authResult || authResult.user.role !== 'admin') {
      return createErrorResponse(
        'INSUFFICIENT_PERMISSIONS',
        'Admin access required',
        403
      );
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'clear-logs':
        Logger.clearLogs();
        Logger.info('Logs cleared by admin', { adminId: authResult.user.id });
        return createSuccessResponse({ message: 'Logs cleared successfully' });
      
      case 'cleanup-rate-limits':
        RateLimiter.cleanup();
        Logger.info('Rate limit cleanup performed by admin', { adminId: authResult.user.id });
        return createSuccessResponse({ message: 'Rate limit cleanup completed' });
      
      default:
        return createErrorResponse(
          'INVALID_ACTION',
          'Invalid action parameter',
          400
        );
    }

  } catch (error) {
    console.error('Admin action error:', error);
    return createErrorResponse(
      'INTERNAL_SERVER_ERROR',
      'An unexpected error occurred',
      500
    );
  }
}