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

    if (authStatus) {
      setIsAuthenticated(true);
      if (pathname === '/login') {
        router.push('/');
      }
    } else {
      if (pathname !== '/login') {
        router.push('/login');
      }
    }
    setIsLoading(false);
  }, [pathname, router]);
  
  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-muted-foreground">Loading...</div>
        </div>
    );
  }

  // If we are on the login page and not authenticated, show the login page
  if (!isAuthenticated && pathname === '/login') {
    return <>{children}</>;
  }

  // If we are not on the login page and not authenticated, we are being redirected, so show nothing.
  if (!isAuthenticated && pathname !== '/login') {
    return null;
  }
  
  // If we are authenticated and not on the login page, show the content.
  if (isAuthenticated && pathname !== '/login') {
    return <>{children}</>;
  }

  // If we are authenticated and on the login page, we are being redirected, so show nothing.
  if (isAuthenticated && pathname === '/login') {
    return null;
  }

  return null;
}
