"use client";

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let isAuthenticated = false;
    try {
      isAuthenticated = sessionStorage.getItem('rsm-authenticated') === 'true';
    } catch (error) {
      // If sessionStorage is not available, we can't authenticate.
      console.error("Session storage is not available.", error);
    }

    if (isAuthenticated) {
      // User is authenticated
      if (pathname === '/login') {
        router.push('/');
      } else {
        setIsLoading(false);
      }
    } else {
      // User is not authenticated
      if (pathname !== '/login') {
        router.push('/login');
      } else {
        setIsLoading(false);
      }
    }
  }, [pathname, router]);

  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-muted-foreground">Loading...</div>
        </div>
    );
  }

  return <>{children}</>;
}
