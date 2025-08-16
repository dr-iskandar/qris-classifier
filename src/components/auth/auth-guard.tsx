'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        console.log('Checking auth token:', token ? 'Token found' : 'No token');
        
        if (!token) {
          console.log('No token found, redirecting to login');
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        console.log('Verifying token with server...');
        // Verify token with the server
        const response = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        console.log('Verification response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('Verification successful:', data);
          
          // Check if admin role is required
          if (requireAdmin && data.user.role !== 'admin') {
            console.log('Admin role required but user is not admin');
            setIsAuthenticated(false);
          } else {
            console.log('Authentication successful');
            setIsAuthenticated(true);
          }
        } else {
          console.log('Token verification failed, removing token');
          // Token is invalid, remove it
          localStorage.removeItem('auth_token');
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('auth_token');
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [requireAdmin]);

  useEffect(() => {
    if (!isLoading && isAuthenticated === false) {
      console.log('Redirecting to login page...');
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Add a timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.log('Auth check timeout, redirecting to login');
        setIsLoading(false);
        setIsAuthenticated(false);
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(timeout);
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}