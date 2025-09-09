"use client";

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    try {
      const authStatus = sessionStorage.getItem('rsm-authenticated');
      if (authStatus === 'true') {
        setIsAuthenticated(true);
      } else {
        if (pathname !== '/login') {
          router.push('/login');
        }
      }
    } catch (error) {
      console.error("Session storage is not available.", error);
      if (pathname !== '/login') {
        router.push('/login');
      }
    } finally {
      setIsLoading(false);
    }
  }, [pathname, router]);
  
  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-muted-foreground">Loading...</div>
        </div>
    );
  }

  if (!isAuthenticated && pathname !== '/login') {
    return null; // or a loading spinner, as redirection is happening
  }

  if (isAuthenticated && pathname === '/login') {
      router.push('/');
      return null;
  }

  return <>{children}</>;
}
