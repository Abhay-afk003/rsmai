"use client";
import React, { useState } from 'react';
import ClientAnalysisPage from '@/components/client-analysis-page';
import ReplyCrafter from '@/components/reply-crafter';
import { type AnalysisHistoryItem } from '@/components/client-analysis-page';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';

export default function Home() {
  const [activeContact, setActiveContact] = useState<AnalysisHistoryItem | null>(null);

  return (
    <ResizablePanelGroup direction="horizontal" className="min-h-screen w-full">
      <ResizablePanel defaultSize={70}>
          <ClientAnalysisPage onSelectContact={setActiveContact} />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
        <div className="h-full border-l">
          <ReplyCrafter activeContact={activeContact} />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
