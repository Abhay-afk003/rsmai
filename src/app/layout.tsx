import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { cn } from '@/lib/utils';
import Sidebar from '@/components/sidebar';
import Link from 'next/link';
import { BrainCircuit } from 'lucide-react';


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
          <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
            <div className="hidden border-r bg-muted/40 md:block">
              <div className="flex h-full max-h-screen flex-col gap-2">
                <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                  <Link href="/" className="flex items-center gap-2 font-semibold">
                    <BrainCircuit className="h-6 w-6 text-primary" />
                    <span className="">RSM Insights</span>
                  </Link>
                </div>
                <div className="flex-1">
                  <Sidebar />
                </div>
              </div>
            </div>
            <div className="flex flex-col">
              <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] md:hidden">
                 <Sidebar />
                 <div className="flex items-center flex-1 justify-center">
                    <Link href="/" className="flex items-center gap-2 font-semibold">
                        <BrainCircuit className="h-6 w-6 text-primary" />
                        <h1 className="text-lg">RSM Insights</h1>
                    </Link>
                </div>
              </header>
              <main className="flex flex-1 flex-col gap-4 p-2 sm:p-4 md:gap-6 md:p-6">
                {children}
              </main>
            </div>
          </div>
          <Toaster />
      </body>
    </html>
  );
}
