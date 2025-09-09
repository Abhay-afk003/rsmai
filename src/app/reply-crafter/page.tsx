"use client";

import ReplyCrafter from "@/components/reply-crafter";
import Sidebar from "@/components/sidebar";
import MobileHeader from "@/components/mobile-header";

export default function ReplyCrafterPage() {
    return (
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
            <Sidebar />
            <div className="flex flex-col">
                <MobileHeader />
                <main className="flex flex-1 flex-col">
                    <ReplyCrafter />
                </main>
            </div>
        </div>
    )
}
