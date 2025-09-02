import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { cn } from '@/lib/utils';
import Sidebar from '@/components/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';


export const metadata: Metadata = {
  title: 'RSM Insights AI',
  description: 'AI-powered analysis to identify and extract pain points from scraped data.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn("font-body antialiased", "min-h-screen bg-background font-sans")}>
          <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <Sidebar />
            <main className="flex flex-1 flex-col sm:gap-4 sm:py-4 sm:pl-14">
              {children}
            </main>
          </div>
          <Toaster />
      </body>
    </html>
  );
}
