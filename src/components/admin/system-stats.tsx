'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Users, 
  Key, 
  TrendingUp, 
  Server, 
  Clock, 
  Cpu, 
  HardDrive, 
  Wifi,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface SystemStats {
  overview: {
    totalUsers: number;
    activeUsers: number;
    newToday: number;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    todayRequests: number;
    errorRate: number;
  };
  systemInfo: {
    uptime: string;
    version: string;
    environment: string;
    lastRestart: string;
    nodeVersion: string;
    platform: string;
    memoryUsage: {
      used: number;
      total: number;
      percentage: number;
    };
  };
  recentActivity: Array<{
    id: string;
    type: 'error' | 'success' | 'warning';
    message: string;
    timestamp: string;
    count?: number;
  }>;
}

interface SystemStatsProps {}

export default function SystemStats({}: SystemStatsProps) {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch system statistics
  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch('/api/admin?action=dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch system statistics');
      }
      
      const result = await response.json();
      setStats(result.data);
      setLastUpdated(new Date());
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'success':
      default:
        return 'default';
    }
  };

  const getStatusIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'success':
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const formatUptime = (uptime: string) => {
    // Convert uptime string to human readable format
    const seconds = parseInt(uptime);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={fetchStats}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Loading system statistics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Overview</h2>
          <p className="text-gray-600">
            Last updated: {lastUpdated?.toLocaleTimeString()}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStats} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.overview.newToday} new today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.overview.activeUsers / stats.overview.totalUsers) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.overview.todayRequests} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.errorRate.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.overview.failedRequests} failed requests
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Server className="h-5 w-5 mr-2" />
              System Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500">Environment</span>
                <p className="font-medium">{stats.systemInfo.environment}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Version</span>
                <p className="font-medium">{stats.systemInfo.version}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Platform</span>
                <p className="font-medium">{stats.systemInfo.platform}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Node.js</span>
                <p className="font-medium">{stats.systemInfo.nodeVersion}</p>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Memory Usage</span>
                <span className="text-sm font-medium">
                  {stats.systemInfo.memoryUsage.percentage.toFixed(1)}%
                </span>
              </div>
              <Progress value={stats.systemInfo.memoryUsage.percentage} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">
                {(stats.systemInfo.memoryUsage.used / 1024 / 1024).toFixed(0)} MB / 
                {(stats.systemInfo.memoryUsage.total / 1024 / 1024).toFixed(0)} MB
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500">Uptime</span>
                <p className="font-medium flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {formatUptime(stats.systemInfo.uptime)}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Last Restart</span>
                <p className="font-medium">
                  {new Date(stats.systemInfo.lastRestart).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest system events and alerts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentActivity.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No recent activity</p>
              ) : (
                stats.recentActivity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(activity.type)}
                      <Badge variant={getStatusColor(activity.type) as any} className="text-xs">
                        {activity.type.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium break-words">{activity.message}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-500">
                          {new Date(activity.timestamp).toLocaleTimeString()}
                        </span>
                        {activity.count && (
                          <Badge variant="outline" className="text-xs">
                            {activity.count}x
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Request Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Request Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {stats.overview.successfulRequests.toLocaleString()}
              </div>
              <p className="text-sm text-gray-500">Successful Requests</p>
              <div className="mt-2">
                <Progress 
                  value={(stats.overview.successfulRequests / stats.overview.totalRequests) * 100} 
                  className="h-2" 
                />
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">
                {stats.overview.failedRequests.toLocaleString()}
              </div>
              <p className="text-sm text-gray-500">Failed Requests</p>
              <div className="mt-2">
                <Progress 
                  value={(stats.overview.failedRequests / stats.overview.totalRequests) * 100} 
                  className="h-2" 
                />
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {stats.overview.todayRequests.toLocaleString()}
              </div>
              <p className="text-sm text-gray-500">Today's Requests</p>
              <div className="mt-2">
                <Progress 
                  value={Math.min((stats.overview.todayRequests / stats.overview.totalRequests) * 100, 100)} 
                  className="h-2" 
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}