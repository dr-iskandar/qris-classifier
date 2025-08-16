'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AuthGuard from '@/components/auth/auth-guard';
import SystemStats from '@/components/admin/system-stats';
import ApiKeyManager from '@/components/admin/api-key-manager';
import RealTimeLogs from '@/components/admin/real-time-logs';
import { 
  BarChart3, 
  Users, 
  Key, 
  Activity, 
  Shield, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Copy,
  Trash2,
  Plus,
  LogOut
} from 'lucide-react';

interface DashboardData {
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
    databaseStatus: string;
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
  }>;
}

interface ApiKey {
  id: string;
  name: string;
  key: string;
  level: 'admin' | 'user' | 'readonly';
  createdAt: string;
  lastUsed?: string;
  requestCount: number;
}

interface LogEntry {
  id: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
  metadata?: any;
}

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyLevel, setNewKeyLevel] = useState<'user' | 'readonly'>('user');
  const router = useRouter();
  const apiKey = 'qris_admin_ygmc5yyjal'; // Use the default admin key

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    router.push('/login');
  };

  useEffect(() => {
    // Load dashboard data using JWT token
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Load dashboard data
      const dashboardResponse = await fetch('/api/admin', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!dashboardResponse.ok) {
        throw new Error('Failed to load dashboard data');
      }
      
      const dashboardResult = await dashboardResponse.json();
      setDashboardData(dashboardResult.data);

      // Load API keys
      const keysResponse = await fetch('/api/api-keys', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (keysResponse.ok) {
        const keysResult = await keysResponse.json();
        setApiKeys(keysResult.data.keys || []);
      }

      // Load logs
      const logsResponse = await fetch('/api/admin?action=logs&limit=50', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (logsResponse.ok) {
        const logsResult = await logsResponse.json();
        setLogs(logsResult.data.logs || []);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };



  const createApiKey = async () => {
    if (!newKeyName.trim()) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newKeyName,
          level: newKeyLevel
        })
      });
      
      if (response.ok) {
        setNewKeyName('');
        loadDashboardData(); // Refresh data
      }
    } catch (err) {
      console.error('Failed to create API key:', err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const refreshData = () => {
    loadDashboardData();
  };



  return (
    <AuthGuard requireAdmin={true}>
      {loading ? (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      ) : error ? (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-red-600">Error</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={refreshData} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">QRIS Classifier Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={refreshData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <SystemStats />
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="api-keys" className="space-y-6">
            <ApiKeyManager />
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-6">
            <RealTimeLogs />
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Environment:</span>
                    <Badge>{dashboardData?.systemInfo.environment || 'Unknown'}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Version:</span>
                    <span className="text-sm font-medium">{dashboardData?.systemInfo.version || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Uptime:</span>
                    <span className="text-sm font-medium">{dashboardData?.systemInfo.uptime || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Last Restart:</span>
                    <span className="text-sm font-medium">
                      {dashboardData?.systemInfo.lastRestart ? 
                        new Date(dashboardData.systemInfo.lastRestart).toLocaleString() : 'Unknown'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full" onClick={refreshData}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh All Data
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Logs
                  </Button>
                  <Button variant="outline" className="w-full">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Export Analytics
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
      )}
    </AuthGuard>
  );
}