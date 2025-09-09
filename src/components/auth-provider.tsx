"use client";

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let authStatus = false;
    try {
      authStatus = sessionStorage.getItem('rsm-authenticated') === 'true';
    } catch (error) {
      console.error("Session storage is not available.", error);
    }
    
    setIsAuthenticated(authStatus);
    setIsLoading(false);

  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        if (pathname === '/login') {
          router.push('/');
        }
      } else {
        if (pathname !== '/login') {
          router.push('/login');
        }
      }
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-muted-foreground">Loading...</div>
        </div>
    );
  }

  if (!isAuthenticated && pathname !== '/login') {
    return null; // Don't render anything while redirecting to login
  }

  if (isAuthenticated && pathname === '/login') {
    return null; // Don't render login page if authenticated
  }

  return <>{children}</>;
}
