"use client";
import React, { useState } from 'react';
import ClientAnalysisPage from '@/components/client-analysis-page';
import ReplyCrafter from '@/components/reply-crafter';
import { Sidebar, SidebarContent, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { type AnalysisHistoryItem } from '@/components/client-analysis-page';

export default function Home() {
  const [activeContact, setActiveContact] = useState<AnalysisHistoryItem | null>(null);

  return (
    <SidebarProvider>
      <ClientAnalysisPage onSelectContact={setActiveContact} />
      <Sidebar side="right">
        <SidebarContent>
          <ReplyCrafter activeContact={activeContact} />
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  );
}
