'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  Key, 
  Plus, 
  RefreshCw, 
  Trash2, 
  Copy, 
  Eye, 
  EyeOff,
  Shield,
  User,
  Crown,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  level: 'user' | 'admin';
  createdAt: string;
  lastUsed?: string;
  requestCount: number;
}

interface ApiKeyManagerProps {}

export default function ApiKeyManager({}: ApiKeyManagerProps) {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [newKeyData, setNewKeyData] = useState({
    email: '',
    role: 'user' as 'user' | 'admin',
    rateLimit: 100
  });
  const { toast } = useToast();

  // Fetch API keys
  const fetchKeys = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const url = new URL('/api/api-keys', window.location.origin);
      url.searchParams.set('action', 'list');
      
      const response = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch API keys');
      }
      
      const result = await response.json();
      setKeys(result.data.keys || []);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch API keys');
    } finally {
      setLoading(false);
    }
  };

  // Create new API key
  const createApiKey = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'create',
          email: newKeyData.email,
          role: newKeyData.role,
          rateLimit: newKeyData.rateLimit
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create API key');
      }
      
      const result = await response.json();
      
      toast({
        title: "API Key Created",
        description: `New API key created for ${newKeyData.email}`,
      });
      
      setShowCreateDialog(false);
      setNewKeyData({ email: '', role: 'user', rateLimit: 100 });
      fetchKeys();
      
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to create API key',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Regenerate API key
  const regenerateApiKey = async (keyId: string) => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'regenerate',
          userId: keyId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to regenerate API key');
      }
      
      toast({
        title: "API Key Regenerated",
        description: "The API key has been successfully regenerated",
      });
      
      fetchKeys();
      
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to regenerate API key',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete API key (placeholder - would need DELETE endpoint)
  const deleteApiKey = async (keyId: string) => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Delete API key by userId query parameter
      const url = new URL('/api/api-keys', window.location.origin);
      url.searchParams.set('userId', keyId);
      
      const response = await fetch(url.toString(), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete API key');
      }
      
      toast({
        title: "API Key Deleted",
        description: "The API key has been successfully deleted",
      });
      
      setShowDeleteDialog(false);
      setSelectedKey(null);
      fetchKeys();
      
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to delete API key',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied",
        description: "API key copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  // Toggle key visibility
  const toggleKeyVisibility = (keyId: string) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(keyId)) {
      newVisible.delete(keyId);
    } else {
      newVisible.add(keyId);
    }
    setVisibleKeys(newVisible);
  };

  // Format key for display
  const formatKey = (key: string, isVisible: boolean) => {
    if (isVisible) {
      return key;
    }
    return key.substring(0, 8) + '•'.repeat(24) + key.substring(key.length - 8);
  };

  // Get role icon
  const getRoleIcon = (role: string) => {
    return role === 'admin' ? (
      <Crown className="h-4 w-4 text-yellow-500" />
    ) : (
      <User className="h-4 w-4 text-blue-500" />
    );
  };

  // Get role color
  const getRoleColor = (role: string) => {
    return role === 'admin' ? 'default' : 'secondary';
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Key className="h-5 w-5 mr-2" />
              API Key Management
            </CardTitle>
            <CardDescription>
              Create, manage, and monitor API keys for system access
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Key
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New API Key</DialogTitle>
                  <DialogDescription>
                    Create a new API key for a user. This will also create a new user account.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@example.com"
                      value={newKeyData.email}
                      onChange={(e) => setNewKeyData({ ...newKeyData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select value={newKeyData.role} onValueChange={(value: 'user' | 'admin') => setNewKeyData({ ...newKeyData, role: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="rateLimit">Rate Limit (requests/hour)</Label>
                    <Input
                      id="rateLimit"
                      type="number"
                      min="1"
                      max="10000"
                      value={newKeyData.rateLimit}
                      onChange={(e) => setNewKeyData({ ...newKeyData, rateLimit: parseInt(e.target.value) || 100 })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createApiKey} disabled={loading || !newKeyData.email}>
                    Create API Key
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm" onClick={fetchKeys} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {keys.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              {loading ? 'Loading API keys...' : 'No API keys found'}
            </div>
          ) : (
            keys.map((key) => (
              <div key={key.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getRoleIcon(key.level)}
                    <div>
                      <h3 className="font-medium">{key.name}</h3>
                      <p className="text-sm text-gray-500">ID: {key.id}</p>
                    </div>
                    <Badge variant={getRoleColor(key.level) as any}>
                      {key.level}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => regenerateApiKey(key.id)}
                      disabled={loading}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedKey(key);
                        setShowDeleteDialog(true);
                      }}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <code className="text-sm font-mono break-all">
                      {formatKey(key.key, visibleKeys.has(key.id))}
                    </code>
                    <div className="flex items-center space-x-2 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleKeyVisibility(key.id)}
                      >
                        {visibleKeys.has(key.id) ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(key.key)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Created:</span>
                    <p className="font-medium">{new Date(key.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Last Used:</span>
                    <p className="font-medium">{key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : 'Never'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Requests:</span>
                    <p className="font-medium">{key.requestCount.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                Delete API Key
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the API key for "{selectedKey?.name}"? This action cannot be undone and will immediately revoke access.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => selectedKey && deleteApiKey(selectedKey.id)}
                disabled={loading}
              >
                Delete API Key
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}