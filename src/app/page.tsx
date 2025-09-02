"use client";
import React from 'react';
import ScraperPage from '@/components/scraper-page';
import { useIsMobile } from '@/hooks/use-mobile';


export default function Home() {
  const isMobile = useIsMobile();
  return (
    <div className={isMobile ? "" : "border-t"}>
      <ScraperPage />
    </div>
  );
}
